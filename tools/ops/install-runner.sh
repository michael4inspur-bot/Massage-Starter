#!/usr/bin/env bash
# 在联调机上为 Massage-Starter 仓库注册一个 self-hosted runner（以 root 执行，可重复执行）。
#
#   sudo bash install-runner.sh --token <注册令牌>
#
# 注册令牌：GitHub → Massage-Starter → Settings → Actions → Runners → New self-hosted runner，
# 页面上 `./config.sh --url ... --token XXXX` 里的 XXXX（1 小时内有效，只用一次）。
#
# 做什么（对照 evcharger RUNBOOK §5.1：必须装成 systemd 服务，手工 ./run.sh 终端一断就死）：
#   1. 取 runner 程序：从 api.github.com 查最新版本，下载 linux 包并按 release 说明里的 SHA256 校验；
#      下载失败（联调机间歇性出网故障）时，从本机 evcharger 那台 runner（/opt/actions-runner）拷程序文件，
#      不拷它的注册信息与凭据
#   2. 以 ghrunner 身份 config.sh（标签 pilot，名字 ms-pilot）
#   3. svc.sh install ghrunner → systemd 服务，start，验收 systemctl list-units 有它
# 不碰 evcharger 的 runner（/opt/actions-runner）——它可能正在跑部署，重启它会留下停机服务。
set -euo pipefail

TOKEN=""; NAME="ms-pilot"; LABELS="pilot"; DIR="/opt/actions-runner-ms"; RUN_USER="ghrunner"
REPO_URL="https://github.com/michael4inspur-bot/Massage-Starter"
FALLBACK_SRC="/opt/actions-runner"
while [ $# -gt 0 ]; do
  case "$1" in
    --token) TOKEN="${2:?--token 需要值}"; shift 2 ;;
    --name) NAME="${2:?}"; shift 2 ;;
    --labels) LABELS="${2:?}"; shift 2 ;;
    --dir) DIR="${2:?}"; shift 2 ;;
    --user) RUN_USER="${2:?}"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "未知选项: $1" >&2; exit 2 ;;
  esac
done

ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✘\033[0m %s\n' "$*" >&2; exit 1; }
step() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || die "要以 root 执行"
id "$RUN_USER" >/dev/null 2>&1 || die "用户 $RUN_USER 不存在"
case "$(uname -m)" in x86_64) ARCH=x64 ;; aarch64) ARCH=arm64 ;; *) die "不支持的架构 $(uname -m)" ;; esac

step "0. 现状"
if [ -f "$DIR/.runner" ]; then
  ok "$DIR 已注册过：$(grep -o '"agentName": *"[^"]*"' "$DIR/.runner" 2>/dev/null || echo '?')，跳过下载与注册，只确保服务在跑"
  ALREADY=1
else
  [ -n "$TOKEN" ] || die "需要 --token（GitHub → Massage-Starter → Settings → Actions → Runners → New self-hosted runner）"
  ALREADY=0
fi

if [ "$ALREADY" = 0 ]; then
  step "1. runner 程序 → $DIR"
  mkdir -p "$DIR"
  GOT=0
  rel=$(curl -fsSL -m 20 https://api.github.com/repos/actions/runner/releases/latest 2>/dev/null || true)
  ver=$(printf '%s' "$rel" | sed -n 's/.*"tag_name": *"v\{0,1\}\([0-9.]*\)".*/\1/p' | head -1)
  if [ -n "$ver" ]; then
    pkg="actions-runner-linux-$ARCH-$ver.tar.gz"
    # release 说明里有 <!-- BEGIN SHA linux-x64 -->哈希<!-- END SHA linux-x64 -->
    sha=$(printf '%s' "$rel" | grep -o "BEGIN SHA linux-$ARCH -->[0-9a-f]\{64\}" | head -1 | grep -o '[0-9a-f]\{64\}' || true)
    if curl -fsSL -m 300 -o "/tmp/$pkg" "https://github.com/actions/runner/releases/download/v$ver/$pkg"; then
      if [ -n "$sha" ] && echo "$sha  /tmp/$pkg" | sha256sum -c - >/dev/null 2>&1; then
        tar xzf "/tmp/$pkg" -C "$DIR"; rm -f "/tmp/$pkg"; GOT=1
        ok "已下载并校验 runner v$ver（sha256 ${sha:0:12}…）"
      else
        rm -f "/tmp/$pkg"; warn "v$ver 下载了但 SHA256 校验不过（或 release 说明里没找到哈希），不用它"
      fi
    else
      warn "下载 $pkg 失败"
    fi
  else
    warn "查不到 runner 最新版本（api.github.com 不通？）"
  fi
  if [ "$GOT" = 0 ]; then
    [ -x "$FALLBACK_SRC/config.sh" ] || die "下载失败，且本机没有 $FALLBACK_SRC 可拷——稍后重试"
    warn "改为从 $FALLBACK_SRC 拷 runner 程序文件（不拷注册信息 / 凭据 / 工作目录 / 日志）"
    tar -C "$FALLBACK_SRC" -chf - \
      --exclude=./.runner --exclude=./.credentials --exclude=./.credentials_rsaparams \
      --exclude=./.service --exclude=./.env --exclude=./.path --exclude=./svc.sh \
      --exclude=./_work --exclude=./_diag . | tar -C "$DIR" -xf -
    ok "已拷贝（版本 $(ls "$DIR"/bin/Runner.Listener >/dev/null 2>&1 && "$DIR/bin/Runner.Listener" --version 2>/dev/null || echo '?')）"
  fi
  chown -R "$RUN_USER:$RUN_USER" "$DIR"

  step "2. 注册（以 $RUN_USER 身份，标签 $LABELS，名字 $NAME）"
  # 用登录 shell（-i）：sudo 会把 PATH 重置成 secure_path，runner 记录的 PATH 里就没有 node
  sudo -iu "$RUN_USER" bash -c "cd '$DIR' && ./config.sh --unattended --replace --url '$REPO_URL' --token '$TOKEN' --name '$NAME' --labels '$LABELS' --work _work"
  ok "注册完成"
fi

# runner 的 PATH 记录在 .path；确保 node 所在目录在里面（部署脚本直接调 node / npm）
NODE_DIR=$(dirname "$(command -v node 2>/dev/null || echo /usr/bin/node)")
if [ -f "$DIR/.path" ] && ! tr ':' '\n' < "$DIR/.path" | grep -qx "$NODE_DIR"; then
  printf '%s:%s' "$(cat "$DIR/.path")" "$NODE_DIR" > "$DIR/.path"
  chown "$RUN_USER:$RUN_USER" "$DIR/.path"
  ok "已把 $NODE_DIR 加进 runner 的 PATH"
fi

step "3. systemd 服务"
cd "$DIR"
if [ -f "$DIR/.service" ] && systemctl list-unit-files "$(cat "$DIR/.service")" >/dev/null 2>&1 && systemctl cat "$(cat "$DIR/.service")" >/dev/null 2>&1; then
  ok "服务已安装：$(cat "$DIR/.service")"
else
  ./svc.sh install "$RUN_USER"
fi
UNIT=$(cat "$DIR/.service")
systemctl restart "$UNIT"
sleep 3
systemctl is-active --quiet "$UNIT" || die "$UNIT 没起来：journalctl -u $UNIT -n 50"
ok "$UNIT active"
systemctl list-units --no-legend 'actions.runner.*' | sed 's/^/     /'
ok "GitHub → Massage-Starter → Settings → Actions → Runners 里 $NAME 应显示 Idle"
