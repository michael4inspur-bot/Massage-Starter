#!/usr/bin/env bash
# EvidenceTuina 联调机巡检（只读）。用法：bash tools/ops/ms-status.sh
# 环境变量缺省对应联调机：MS_REPO=/mnt/data/massage-starter MS_PORT=9600 MS_SERVICE=evidence-tuina MS_PUBLIC_HOST=ms.port.et
set -u
MS_REPO="${MS_REPO:-/mnt/data/massage-starter}"
MS_PORT="${MS_PORT:-9600}"
MS_SERVICE="${MS_SERVICE:-evidence-tuina}"
MS_PUBLIC_HOST="${MS_PUBLIC_HOST:-ms.port.et}"
ok(){ printf '  \033[32m✔\033[0m %s\n' "$*"; }
no(){ printf '  \033[31m✘\033[0m %s\n' "$*"; FAIL=$((FAIL+1)); }
info(){ printf '  \033[33m●\033[0m %s\n' "$*"; }
FAIL=0
echo "===== $(date '+%F %T')  $(hostname)  repo=$(git -C "$MS_REPO" log --oneline -1 2>/dev/null || echo '?') ====="

echo; echo "[1] 发布产物"
if [ -L "$MS_REPO/current" ]; then
  cur=$(readlink "$MS_REPO/current")
  ok "current → $cur"
  [ -f "$cur/BUILD_INFO" ] && info "$(tr '\n' ' ' < "$cur/BUILD_INFO")"
  repo_sha=$(git -C "$MS_REPO" rev-parse HEAD 2>/dev/null || true)
  pb_sha=$(sed -n 's/^commit=//p' "$cur/BUILD_INFO" 2>/dev/null || true)
  [ -n "$repo_sha" ] && [ "$repo_sha" = "$pb_sha" ] && ok "产物提交 = 仓库 HEAD" || no "产物提交 ${pb_sha:0:7} ≠ 仓库 HEAD ${repo_sha:0:7}"
else
  no "$MS_REPO/current 不存在（还没部署过）"
fi
[ -f "$MS_REPO/current.prev" ] && info "可回滚到：$(cat "$MS_REPO/current.prev")"

echo; echo "[2] systemd"
st=$(systemctl is-active "$MS_SERVICE" 2>/dev/null)
if [ "$st" = active ]; then
  pid=$(systemctl show -p MainPID --value "$MS_SERVICE"); up=$(ps -o etimes= -p "$pid" 2>/dev/null | tr -d ' ')
  ok "$MS_SERVICE active pid=$pid 已运行 ${up:-?}s"
else
  no "$MS_SERVICE ${st:-unknown}（journalctl -u $MS_SERVICE -n 50）"
fi

echo; echo "[3] 端口与本机探活"
line=$(ss -lntp 2>/dev/null | grep -E "[:.]$MS_PORT\b" | head -1)
if [ -n "$line" ]; then
  addr=$(echo "$line" | awk '{print $4}')
  case "$addr" in 127.0.0.1:*|\[::1\]:*) ok "$MS_PORT $addr";; *) no "$MS_PORT $addr（应只绑 127.0.0.1）";; esac
else
  no "$MS_PORT 未监听"
fi
h=$(curl -s -m 5 -w '\n%{http_code}' "http://127.0.0.1:$MS_PORT/api/health" 2>/dev/null)
code=$(echo "$h" | tail -1); body=$(echo "$h" | head -1 | head -c 200)
[ "$code" = 200 ] && ok "/api/health $code $body" || no "/api/health ${code:-无响应} $body"

echo; echo "[4] nginx 与公网"
systemctl is-active --quiet nginx && ok "nginx active" || no "nginx $(systemctl is-active nginx)"
grep -q "server_name $MS_PUBLIC_HOST" /etc/nginx/nginx.conf 2>/dev/null && ok "nginx.conf 有 $MS_PUBLIC_HOST 的 server 块" || no "nginx.conf 没有 $MS_PUBLIC_HOST（跑 tools/ops/nginx-site.py）"
if [ -f "/etc/letsencrypt/live/$MS_PUBLIC_HOST/fullchain.pem" ]; then
  exp=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$MS_PUBLIC_HOST/fullchain.pem" 2>/dev/null | cut -d= -f2)
  ok "证书存在，到期：${exp:-?}"
else
  no "没有 /etc/letsencrypt/live/$MS_PUBLIC_HOST/（certbot certonly --nginx -d $MS_PUBLIC_HOST）"
fi
if command -v getent >/dev/null; then
  ip=$(getent hosts "$MS_PUBLIC_HOST" | awk '{print $1}' | head -1)
  [ -n "$ip" ] && ok "DNS $MS_PUBLIC_HOST → $ip" || no "DNS 解析不到 $MS_PUBLIC_HOST（port.et 加 A 记录）"
fi
pc=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://$MS_PUBLIC_HOST/api/health" 2>/dev/null)
[ "$pc" = 200 ] && ok "https://$MS_PUBLIC_HOST/api/health $pc" || no "https://$MS_PUBLIC_HOST/api/health ${pc:-无响应}"

echo; echo "[5] 资源"
info "$(free -m 2>/dev/null | awk '/Mem:/{printf "内存 可用 %s MB / 共 %s MB", $7, $2}')  $(df -h "$MS_REPO" 2>/dev/null | awk 'NR==2{print "磁盘 剩余 "$4}')"
[ -d "$MS_REPO/data" ] && info "SQLite：$(ls -la "$MS_REPO/data" 2>/dev/null | grep -E '\.db$' | awk '{print $5" bytes "$9}')"

echo; [ "$FAIL" = 0 ] && echo "全部通过" || echo "$FAIL 项异常"
exit $FAIL
