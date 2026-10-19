#!/usr/bin/env bash
# EvidenceTuina 联调机一次性引导（以 root 执行一次，可重复执行、幂等）。
#
#   sudo bash /tmp/ms-ops/bootstrap-server.sh          # 工作流 Preflight 会把 tools/ops/ 复制到 /tmp/ms-ops/
#   sudo bash bootstrap-server.sh --site               # 另外写 nginx 站点 + 申请 Let's Encrypt 证书（ms-install.sh 用这个）
#
# 做什么（对照 evcharger RUNBOOK §2.0「服务器侧一次性授权」）：
#   1. 建组 msdeploy，把 runner 用户 ghrunner 放进去
#   2. 建 $MS_ROOT/{releases,data}（缺省 /mnt/data/massage-starter），归组可写、setgid；目录已存在则只补权限
#   3. 写 /mnt/data/massage-starter/.env.production（已存在则不动）
#   4. 装 systemd 单元 evidence-tuina（node 路径按本机探测，可用 NODE_BIN 覆盖）
#   5. sudoers：只允许 ghrunner 重启 evidence-tuina 这一个服务
#   6. （--site）nginx-site.py 写 80 块 → reload → certbot certonly --nginx → 再写 443 块 → reload；
#      证书申请失败只告警，站点先以 http 可用
# 不做什么：不拉代码（代码由 Actions 用临时令牌拉）。
set -euo pipefail

DO_SITE=0
for a in "$@"; do
  case "$a" in
    --site) DO_SITE=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "未知选项: $a" >&2; exit 2 ;;
  esac
done
MS_ROOT="${MS_ROOT:-/mnt/data/massage-starter}"
MS_PUBLIC_HOST="${MS_PUBLIC_HOST:-ms.port.et}"
MS_USER="${MS_USER:-ghrunner}"
MS_GROUP="${MS_GROUP:-msdeploy}"
MS_PORT="${MS_PORT:-9600}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
HERE="$(cd "$(dirname "$0")" && pwd)"

ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✘\033[0m %s\n' "$*" >&2; exit 1; }
step() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || die "要以 root 执行（sudo bash $0）"
[ -n "$NODE_BIN" ] || die "找不到 node；用 NODE_BIN=/path/to/node 指定（联调机是 Node 20，RUNBOOK §2.9）"
NODE_MAJOR=$("$NODE_BIN" -v | sed 's/^v//' | cut -d. -f1)
[ "$NODE_MAJOR" -ge 18 ] || die "node $($NODE_BIN -v) 太旧，Next.js 15 需要 ≥ 18.18"
id "$MS_USER" >/dev/null 2>&1 || die "用户 $MS_USER 不存在——先按手册注册 runner（它以 $MS_USER 运行）"

step "0. 环境"
ok "node：$NODE_BIN ($("$NODE_BIN" -v))"
ok "OpenSSL：$(openssl version 2>/dev/null || echo '?')（Prisma 引擎按 rhel-openssl-1.0.x / 1.1.x / 3.0.x 三个版本都带了）"
if ss -lnt 2>/dev/null | grep -qE "[:.]$MS_PORT\b"; then
  warn "端口 $MS_PORT 已有进程监听：$(ss -lntp 2>/dev/null | grep -E "[:.]$MS_PORT\b" | head -1)"
else
  ok "端口 $MS_PORT 空闲"
fi

step "1. 组与目录"
groupadd -f "$MS_GROUP"
usermod -aG "$MS_GROUP" "$MS_USER"
mkdir -p "$MS_ROOT/releases" "$MS_ROOT/data"
chgrp -R "$MS_GROUP" "$MS_ROOT"
chmod -R g+rwX "$MS_ROOT"
find "$MS_ROOT" -type d -exec chmod g+s {} +
ok "$MS_ROOT 归组 $MS_GROUP，$MS_USER 已在组内（runner 服务重启后生效）"

step "2. 环境文件"
ENV_FILE="$MS_ROOT/.env.production"
if [ -f "$ENV_FILE" ]; then
  ok "$ENV_FILE 已存在，不动"
else
  cat > "$ENV_FILE" <<EOT
# EvidenceTuina 生产环境（systemd EnvironmentFile）。改完 systemctl restart evidence-tuina
NODE_ENV=production
PORT=$MS_PORT
HOSTNAME=127.0.0.1
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=file:$MS_ROOT/data/evidence-tuina.db
EOT
  chgrp "$MS_GROUP" "$ENV_FILE"; chmod 640 "$ENV_FILE"
  ok "已写 $ENV_FILE"
fi

step "3. systemd 单元"
UNIT=/etc/systemd/system/evidence-tuina.service
sed -e "s#__NODE_BIN__#$NODE_BIN#" -e "s#__MS_ROOT__#$MS_ROOT#g" "$HERE/evidence-tuina.service" > "$UNIT.candidate"
grep -q "__" "$UNIT.candidate" && die "单元模板还有没替换的占位符：$(grep -n "__" "$UNIT.candidate")"
if [ -f "$UNIT" ] && cmp -s "$UNIT" "$UNIT.candidate"; then
  rm -f "$UNIT.candidate"; ok "$UNIT 已是目标内容"
else
  [ -f "$UNIT" ] && cp -a "$UNIT" "$UNIT.bak-$(date +%Y%m%d-%H%M%S)"
  mv "$UNIT.candidate" "$UNIT"
  chmod 644 "$UNIT"   # root 的 umask 可能是 077；单元文件应对所有人可读
  systemctl daemon-reload
  ok "已写 $UNIT（daemon-reload 完成）"
fi
systemctl enable evidence-tuina >/dev/null 2>&1 && ok "已 enable（首次发布产物后由 deploy.sh 启动）"

step "4. sudoers（最小权限：只许重启这一个服务）"
SUDOERS=/etc/sudoers.d/evidence-tuina-deploy
SYSTEMCTL_BIN=$(command -v systemctl)
printf '%s ALL=(root) NOPASSWD: %s restart evidence-tuina\n' "$MS_USER" "$SYSTEMCTL_BIN" > "$SUDOERS.candidate"
chmod 440 "$SUDOERS.candidate"
if visudo -cf "$SUDOERS.candidate" >/dev/null; then
  mv "$SUDOERS.candidate" "$SUDOERS"; ok "已写 $SUDOERS 并通过 visudo -c"
else
  rm -f "$SUDOERS.candidate"; die "sudoers 候选文件校验失败，未写入"
fi

if [ "$DO_SITE" = 1 ]; then
  step "5. nginx 站点 + 证书（$MS_PUBLIC_HOST）"
  command -v nginx >/dev/null || die "没有 nginx"
  command -v python3 >/dev/null || die "没有 python3（nginx-site.py 要用）"
  # set -euo pipefail 下解析失败（getent 退出 2）会让整个脚本无声退出，所以要 || true
  ip=$(getent hosts "$MS_PUBLIC_HOST" 2>/dev/null | awk '{print $1}' | head -1 || true)
  [ -n "$ip" ] && ok "DNS $MS_PUBLIC_HOST → $ip" || warn "本机解析不到 $MS_PUBLIC_HOST，证书多半会申请失败"
  site() { MS_PUBLIC_HOST="$MS_PUBLIC_HOST" python3 "$HERE/nginx-site.py" "$@"; }
  site >/tmp/ms-nginx-site.log 2>&1 || { cat /tmp/ms-nginx-site.log; die "nginx-site.py 失败（真实配置未改）"; }
  grep -E '^== |无改动|已写入' /tmp/ms-nginx-site.log | sed 's/^/     /'
  nginx -t >/dev/null 2>&1 && systemctl reload nginx && ok "nginx 已 reload（80 块就位）"
  if [ -f "/etc/letsencrypt/live/$MS_PUBLIC_HOST/fullchain.pem" ]; then
    ok "证书已存在，跳过申请"
  elif command -v certbot >/dev/null; then
    cb_args=(certonly --nginx -d "$MS_PUBLIC_HOST" --non-interactive --agree-tos --keep-until-expiring)
    # 机器上已有 Let's Encrypt 账号（ev.port.et 在用）就沿用；没有才以无邮箱方式注册
    ls /etc/letsencrypt/accounts/*/directory/* >/dev/null 2>&1 || cb_args+=(--register-unsafely-without-email)
    if certbot "${cb_args[@]}" >/tmp/ms-certbot.log 2>&1; then
      ok "证书已签发：/etc/letsencrypt/live/$MS_PUBLIC_HOST/"
    else
      tail -n 15 /tmp/ms-certbot.log | sed 's/^/     /'
      warn "证书申请失败（DNS 未生效 / 80 端口不通？），站点先以 http 提供；修好后重跑本脚本 --site"
    fi
  else
    warn "没有 certbot，跳过证书"
  fi
  if [ -f "/etc/letsencrypt/live/$MS_PUBLIC_HOST/fullchain.pem" ]; then
    site >/tmp/ms-nginx-site.log 2>&1 || { cat /tmp/ms-nginx-site.log; die "写 443 块失败（真实配置未改）"; }
    grep -E '^== |无改动|已写入' /tmp/ms-nginx-site.log | sed 's/^/     /'
    nginx -t >/dev/null 2>&1 && systemctl reload nginx && ok "nginx 已 reload（443 + 80 跳转）"
  fi
fi

step "完成"
if [ "$DO_SITE" = 1 ]; then
  echo "  目录 / 环境文件 / systemd 单元 / sudoers / nginx 站点已就位。"
  echo "  还没注册 runner 的话：bash $HERE/install-runner.sh --token <注册令牌>（ms-install.sh 会接着自动跑）"
else
  cat <<EOT
  1) 让 runner 的新附加组生效：只重启本仓库的 runner（不要动 evcharger 那台，它可能正在部署）
       systemctl restart "\$(cat /opt/actions-runner-ms/.service)"
  2) nginx + 证书：sudo bash $HERE/bootstrap-server.sh --site
  3) GitHub → Massage-Starter → Actions → Deploy to pilot → dry_run=false
  4) 验收：bash $MS_ROOT/tools/ops/ms-status.sh
EOT
fi
