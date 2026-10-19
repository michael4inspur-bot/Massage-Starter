#!/usr/bin/env python3
"""把 EvidenceTuina 的站点（ms.port.et → 127.0.0.1:9600）写进联调机 nginx.conf 的 http 块。

规矩与 evcharger tools/ops/nginx-web-block.py 相同：**候选文件 → nginx -t → 通过才落盘 → 失败不碰真实文件**，
落盘前按时间戳备份，--rollback 恢复最近一次。块由标记包住，重复执行是**替换**不是追加：

    # >>> MS SITE (managed by tools/ops/nginx-site.py) — 块内勿手改 >>>
    server { listen 80; ... }
    server { listen 443 ssl; ... }      ← 只有证书文件已存在时才写（certbot certonly 之后再跑一次）
    # <<< MS SITE <<<

插入位置：http 块里第一个 server 块之前（与 ev.port.et 的块相邻）。
安全响应头：nginx 的 add_header 在 server 层出现会顶掉 http 层继承的全部同类指令，所以把 http 块的
add_header 原样搬进来，只把 CSP 换成 Next.js 跑得起来的版本（内联 hydration 脚本需要 'unsafe-inline'）。

用法（root）：
    python3 tools/ops/nginx-site.py --dry-run          # 看 diff，候选 nginx -t
    python3 tools/ops/nginx-site.py                    # 落盘；接着 systemctl reload nginx
    python3 tools/ops/nginx-site.py --rollback

**守 Python 3.6 兼容**（联调机是 CentOS 自带 3.6）：不用 capture_output / text= / 海象 / 内置泛型注解。
"""

import argparse
import difflib
import glob
import os
import re
import shutil
import subprocess
import sys
import time

MARK_BEGIN = "# >>> MS SITE (managed by tools/ops/nginx-site.py) — 块内勿手改 >>>"
MARK_END = "# <<< MS SITE <<<"
MARK_BEGIN_RE = re.compile(r"[ \t]*# >>> MS SITE \(managed by [^\n]*>>>")
MARK_END_RE = re.compile(r"[ \t]*# <<< MS SITE <<<")
BACKUP_SUFFIX = ".ms-site-bak-"


def strip_comments_and_strings(src):
    """返回与 src 等长的字符串：注释与引号内容替换成空格，便于安全地找花括号。"""
    out = []
    i = 0
    n = len(src)
    in_str = None
    while i < n:
        c = src[i]
        if in_str:
            out.append(" ")
            if c == "\\" and i + 1 < n:
                out.append(" ")
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c == "#":
            while i < n and src[i] != "\n":
                out.append(" ")
                i += 1
            continue
        if c in ("'", '"'):
            in_str = c
            out.append(" ")
            i += 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


def find_block(src, clean, keyword):
    """找顶层 `keyword {` 块，返回 (块起点, 开括号下标, 闭括号下标)；找不到返回 None。"""
    for m in re.finditer(r"(?m)^[ \t]*" + keyword + r"\s*\{", clean):
        depth = 0
        for j in range(m.end() - 1, len(clean)):
            if clean[j] == "{":
                depth += 1
            elif clean[j] == "}":
                depth -= 1
                if depth == 0:
                    return m.start(), m.end() - 1, j
        break
    return None


def server_blocks_in(clean, start, end):
    """http 块 [start, end) 内所有 server 块的 (起点, 终点)。"""
    spans = []
    pos = start
    while True:
        m = re.compile(r"(?m)^[ \t]*server\s*\{").search(clean, pos, end)
        if not m:
            return spans
        depth = 0
        close = None
        for j in range(m.end() - 1, end):
            if clean[j] == "{":
                depth += 1
            elif clean[j] == "}":
                depth -= 1
                if depth == 0:
                    close = j
                    break
        if close is None:
            sys.exit("server 块花括号不配对，拒绝继续")
        spans.append((m.start(), close + 1))
        pos = close + 1


def collect_http_add_headers(src, clean, http_start, http_end, spans):
    out = []
    for m in re.finditer(r"""^[ \t]*add_header\s+(?:"[^"]*"|'[^']*'|[^;"'])+;""", src, flags=re.M):
        if not (http_start <= m.start() < http_end):
            continue
        if any(s <= m.start() < e for s, e in spans):
            continue
        h = m.group(0).strip()
        if h.count('"') % 2 or h.count("'") % 2:
            sys.exit("解析 http 块的 add_header 时引号不配对，拒绝继续：\n  " + h)
        out.append(h)
    return out


def render_csp():
    # Next.js 15 App Router：hydration 用内联 <script>（无 nonce 方案）→ script-src 'unsafe-inline'；
    # Framer Motion / Tailwind 注入行内样式 → style-src 'unsafe-inline'；
    # 本应用没有第三方域、没有 WebSocket；字体 / 图片全部同源。
    return "; ".join([
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
    ])


def render_block(server_name, upstream, with_tls, cert_dir, inherited_headers, indent):
    kept = [h for h in inherited_headers if "Content-Security-Policy" not in h]
    headers = "\n".join(kept + ['add_header Content-Security-Policy "{0}" always;'.format(render_csp())])
    proxy = """location / {{
    proxy_pass http://{upstream};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
    proxy_buffering off;
}}""".format(upstream=upstream)

    parts = [MARK_BEGIN, "# EvidenceTuina 循证推拿实验室 → Next.js 127.0.0.1:9600（systemd evidence-tuina）"]
    if with_tls:
        parts.append("""server {{
listen 80;
server_name {name};
# certbot（authenticator = nginx）续期时会临时改这里，不要手工加 acme location
return 301 https://$host$request_uri;
}}""".format(name=server_name))
        ssl_extra = []
        if os.path.exists("/etc/letsencrypt/options-ssl-nginx.conf"):
            ssl_extra.append("include /etc/letsencrypt/options-ssl-nginx.conf;")
        if os.path.exists("/etc/letsencrypt/ssl-dhparam.pem"):
            ssl_extra.append("ssl_dhparam /etc/letsencrypt/ssl-dhparam.pem;")
        parts.append("""server {{
listen 443 ssl http2;
server_name {name};
ssl_certificate {cert}/fullchain.pem;
ssl_certificate_key {cert}/privkey.pem;{ssl_extra}
client_max_body_size 2m;
# 安全响应头：http 块的那几条原样搬下来，只换 CSP（理由见脚本 render_csp）
{headers}
{proxy}
}}""".format(name=server_name, cert=cert_dir, ssl_extra="".join("\n" + x for x in ssl_extra), headers=headers, proxy=proxy))
    else:
        parts.append("""server {{
listen 80;
server_name {name};
# 证书还没申请：先只走 80，certbot certonly --nginx -d {name} 之后重跑本脚本会自动升级成 443 + 80 跳转
client_max_body_size 2m;
{headers}
{proxy}
}}""".format(name=server_name, headers=headers, proxy=proxy))
    parts.append(MARK_END)
    text = "\n".join(parts)
    # 块内每行统一缩进；server 内部再多一级
    lines = []
    depth = 0
    for line in text.split("\n"):
        s = line.strip()
        if s.startswith("}"):
            depth -= 1
        lines.append((indent + "    " * depth + s) if s else "")
        if s.endswith("{"):
            depth += 1
    return "\n".join(lines) + "\n"


def build_candidate(src, args):
    clean = strip_comments_and_strings(src)
    http = find_block(src, clean, "http")
    if not http:
        sys.exit("在 {0} 里找不到顶层 http 块".format(args.conf))
    http_start, http_open, http_close = http
    spans = server_blocks_in(clean, http_open + 1, http_close)
    inherited = collect_http_add_headers(src, clean, http_open, http_close, spans)

    cert_dir = "/etc/letsencrypt/live/" + args.server_name
    if args.tls == "auto":
        with_tls = os.path.exists(os.path.join(cert_dir, "fullchain.pem")) and os.path.exists(os.path.join(cert_dir, "privkey.pem"))
    else:
        with_tls = args.tls == "on"

    mb = MARK_BEGIN_RE.search(src)
    me = MARK_END_RE.search(src)
    if mb and me and mb.start() < me.end():
        indent = re.match(r"[ \t]*", mb.group(0)).group(0)
        block = render_block(args.server_name, args.upstream, with_tls, cert_dir, inherited, indent)
        # 替换含首尾标记的整段（连同 END 行的换行）
        end = me.end()
        if end < len(src) and src[end] == "\n":
            end += 1
        return src[:mb.start()] + block + src[end:], "更新受管块（{0}）".format("443 + 80 跳转" if with_tls else "仅 80")
    if mb or me:
        sys.exit("受管块标记只剩一半，拒绝继续——先人工看 {0}".format(args.conf))

    if spans:
        insert_at = spans[0][0]
        indent = re.match(r"[ \t]*", src[insert_at:]).group(0)
    else:
        insert_at = http_close
        indent = "    "
    block = render_block(args.server_name, args.upstream, with_tls, cert_dir, inherited, indent)
    return src[:insert_at] + block + "\n" + src[insert_at:], "首次写入受管块（{0}）".format("443 + 80 跳转" if with_tls else "仅 80")


def nginx_test(path):
    try:
        p = subprocess.Popen(["nginx", "-t", "-c", path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    except OSError:
        return False, "找不到 nginx 可执行文件"
    out, err = p.communicate()
    return p.returncode == 0, (err or out).strip()


def do_rollback(conf):
    backups = sorted(glob.glob(conf + BACKUP_SUFFIX + "*"))
    if not backups:
        print("没有 {0}{1}* 备份可恢复".format(conf, BACKUP_SUFFIX), file=sys.stderr)
        return 1
    newest = backups[-1]
    ok, out = nginx_test(newest)
    if not ok:
        print("备份 {0} 自身校验不过，未恢复：\n{1}".format(newest, out), file=sys.stderr)
        return 1
    shutil.copy2(conf, conf + BACKUP_SUFFIX + time.strftime("%Y%m%d-%H%M%S") + ".before-rollback")
    shutil.copy2(newest, conf)
    print("已恢复 {0} → {1}；接着执行： nginx -t && systemctl reload nginx".format(newest, conf))
    return 0


def main():
    ap = argparse.ArgumentParser(description="把 ms.port.et 站点写进 nginx.conf 的 http 块")
    ap.add_argument("--conf", default=os.environ.get("MS_NGINX_CONF", "/etc/nginx/nginx.conf"))
    ap.add_argument("--server-name", default=os.environ.get("MS_PUBLIC_HOST", "ms.port.et"))
    ap.add_argument("--upstream", default="127.0.0.1:" + os.environ.get("MS_PORT", "9600"))
    ap.add_argument("--tls", choices=["auto", "on", "off"], default="auto",
                    help="auto = /etc/letsencrypt/live/<域名>/ 有证书就写 443（缺省）")
    ap.add_argument("--candidate", default="/tmp/nginx.conf.ms-site-candidate")
    ap.add_argument("--dry-run", action="store_true", help="只打印 diff 与候选校验结果，不落盘")
    ap.add_argument("--no-test", action="store_true", help="跳过 nginx -t（仅离线自测用）")
    ap.add_argument("--rollback", action="store_true", help="恢复最近一次本脚本的备份")
    args = ap.parse_args()

    if args.rollback:
        return do_rollback(args.conf)
    if not os.path.isfile(args.conf):
        print("找不到 {0}".format(args.conf), file=sys.stderr)
        return 2
    with open(args.conf, encoding="utf-8") as f:
        src = f.read()
    cand, action = build_candidate(src, args)
    if cand == src:
        print("配置已是目标状态，无改动。")
        return 0
    diff = list(difflib.unified_diff(src.splitlines(keepends=True), cand.splitlines(keepends=True),
                                     fromfile=args.conf, tofile=args.conf + " (候选)", n=3))
    print("== {0} ==".format(action))
    print("".join(diff))
    with open(args.candidate, "w", encoding="utf-8") as f:
        f.write(cand)
    if not args.no_test:
        ok, out = nginx_test(args.candidate)
        if not ok:
            print("候选配置校验失败，真实文件未改动：\n" + out, file=sys.stderr)
            return 4
        print("候选配置 nginx -t 通过。")
    if args.dry_run:
        print("--dry-run：未落盘。候选文件在 " + args.candidate)
        return 0
    backup = args.conf + BACKUP_SUFFIX + time.strftime("%Y%m%d-%H%M%S")
    shutil.copy2(args.conf, backup)
    with open(args.conf, "w", encoding="utf-8") as f:
        f.write(cand)
    print("已写入 {0}（备份 {1}）".format(args.conf, backup))
    print("接着执行： nginx -t && systemctl reload nginx")
    return 0


if __name__ == "__main__":
    sys.exit(main())
