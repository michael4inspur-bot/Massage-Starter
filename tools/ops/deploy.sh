#!/usr/bin/env bash
# EvidenceTuina 联调机部署（对照 evcharger tools/ops/deploy-backend.sh 的套路）：
#   0. 拉代码（fast-forward main；目录不存在则 clone）
#   1. npm ci（仅当 package-lock.json 比 node_modules 新）
#   2. prisma db push（SQLite，幂等）
#   3. 产物：--prebuilt DIR 直接换入 CI 产物（BUILD_INFO 的 commit 必须等于 HEAD），否则本机构建（内存峰值约 800 MB）
#   4. 发布到 releases/<sha>-<时刻>/，把 current 符号链接指过去（旧目标记在 current.prev）
#   5. systemctl restart evidence-tuina → 轮询 http://127.0.0.1:9600/api/health
#   6. 探活失败：current 指回上一版、重启、再探活；退出非 0
#   7. 只保留最近 3 个 release
#
# 用法（联调机上，以 ghrunner 或 root）：
#   bash tools/ops/deploy.sh --dry-run                  # 只打印
#   bash tools/ops/deploy.sh -y --prebuilt /path/to/prebuilt   # 工作流用：换入 CI 产物
#   bash tools/ops/deploy.sh -y                         # 本机构建（应急）
#   bash tools/ops/deploy.sh --rollback                 # current 指回 current.prev 并重启
#
# 选项：--dry-run  -y|--yes  --skip-pull  --skip-deps  --prebuilt DIR  --rollback
# 环境变量（缺省对应联调机）：
#   MS_REPO=/mnt/data/massage-starter   MS_BRANCH=main   MS_PORT=9600   MS_SERVICE=evidence-tuina
#   MS_GIT_URL=https://github.com/michael4inspur-bot/Massage-Starter.git（仅首次 clone）
#   MS_HEALTH_TIMEOUT=45   MS_KEEP_RELEASES=3
#   MS_RESTART_CMD   覆盖重启命令（本地自测用；缺省 root 直接 systemctl，否则 sudo -n systemctl）
# 只依赖 bash / node / git / curl / coreutils；联调机 bash 可能是 4.2，数组展开按 ${a[@]+"${a[@]}"} 写。
set -euo pipefail
umask 0002

MS_REPO="${MS_REPO:-/mnt/data/massage-starter}"
MS_BRANCH="${MS_BRANCH:-main}"
MS_PORT="${MS_PORT:-9600}"
MS_SERVICE="${MS_SERVICE:-evidence-tuina}"
MS_GIT_URL="${MS_GIT_URL:-https://github.com/michael4inspur-bot/Massage-Starter.git}"
MS_HEALTH_TIMEOUT="${MS_HEALTH_TIMEOUT:-45}"
MS_KEEP_RELEASES="${MS_KEEP_RELEASES:-3}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}"
export NEXT_TELEMETRY_DISABLED=1

DRY_RUN=0; ASSUME_YES=0; DO_PULL=1; DO_DEPS=1; PREBUILT=""; ROLLBACK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    -y|--yes) ASSUME_YES=1; shift ;;
    --skip-pull) DO_PULL=0; shift ;;
    --skip-deps) DO_DEPS=0; shift ;;
    --prebuilt) PREBUILT="${2:?--prebuilt 需要一个目录}"; shift 2 ;;
    --rollback) ROLLBACK=1; shift ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) echo "未知选项: $1（-h 看用法）" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✘\033[0m %s\n' "$*" >&2; exit 1; }
run()  { if [ "$DRY_RUN" = 1 ]; then printf '  [dry-run] %s\n' "$*"; else eval "$@"; fi; }

# 重活降优先级（evcharger scripts/ci-lowprio.sh 同款逻辑，内联以免依赖另一仓库）
LOWPRIO="nice -n 19"
if command -v ionice >/dev/null 2>&1 && ionice -c3 true >/dev/null 2>&1; then LOWPRIO="nice -n 19 ionice -c3"; fi

if [ -n "${MS_RESTART_CMD:-}" ]; then
  RESTART="$MS_RESTART_CMD"
elif [ "$(id -u)" = 0 ]; then
  RESTART="systemctl restart $MS_SERVICE"
else
  RESTART="sudo -n systemctl restart $MS_SERVICE"
fi

CURRENT="$MS_REPO/current"
RELEASES="$MS_REPO/releases"
ENV_FILE="$MS_REPO/.env.production"

wait_health() { # 等 /api/health 200；成功 0，超时 1
  local waited=0 code=""
  while [ "$waited" -lt "$MS_HEALTH_TIMEOUT" ]; do
    code=$(curl -s -o /dev/null -m 3 -w '%{http_code}' "http://127.0.0.1:$MS_PORT/api/health" || true)
    [ "$code" = 200 ] && { ok "/api/health 200（${waited}s）：$(curl -s -m 3 "http://127.0.0.1:$MS_PORT/api/health" | head -c 200)"; return 0; }
    sleep 1; waited=$((waited+1))
  done
  warn "/api/health 在 ${MS_HEALTH_TIMEOUT}s 内没有返回 200（最后 ${code:-无响应}）"
  return 1
}

switch_current() { # 目标 release 目录 → 原子切换 current，并把旧目标记到 current.prev
  local target="$1" old=""
  [ -L "$CURRENT" ] && old=$(readlink "$CURRENT" || true)
  run "ln -sfn '$target' '$CURRENT.tmp' && mv -Tf '$CURRENT.tmp' '$CURRENT'"
  [ -n "$old" ] && run "printf '%s\n' '$old' > '$MS_REPO/current.prev'"
  return 0
}

# ---------- 回滚模式 ----------
if [ "$ROLLBACK" = 1 ]; then
  step "回滚 $MS_SERVICE"
  [ -f "$MS_REPO/current.prev" ] || die "没有 $MS_REPO/current.prev，无法回滚"
  prev=$(cat "$MS_REPO/current.prev")
  [ -f "$prev/server.js" ] || die "上一版 $prev 已不存在（被 --keep 清理了？）"
  warn "current → $prev（$(cat "$prev/BUILD_INFO" 2>/dev/null | tr '\n' ' ')）"
  switch_current "$prev"
  run "$RESTART"
  [ "$DRY_RUN" = 1 ] || wait_health || die "回滚后探活仍失败，需要人工介入：journalctl -u $MS_SERVICE -n 50"
  exit 0
fi

# ---------- 0. 代码 ----------
step "0. 代码（$MS_REPO @ $MS_BRANCH）"
# 部署目录由 root 建、归 msdeploy 组（bootstrap-server.sh），ghrunner 能在里面写，但不是属主——
# 所以不能 clone 到别处再 cp -a 整体搬进来（cp 要改目录本身的时间戳，非属主会 Operation not permitted，
# 2026-10-19 首次正式部署 run 39320211319 就死在这里）。改为就地 git init + fetch + checkout。
# 上次失败留下的半截 .git（rev-parse 不出 HEAD）同样就地重建。
[ -d "$MS_REPO" ] || die "$MS_REPO 不存在——先以 root 跑 tools/ops/bootstrap-server.sh"
[ -w "$MS_REPO" ] || die "$MS_REPO 不可写（当前用户 $(id -un)）——bootstrap 的组授权没生效？本仓库 runner 服务重启过吗"
# 目录属主是 root、本脚本以 ghrunner 跑：git ≥ 2.35.2 会对每条命令报 "detected dubious ownership" 并退出。
# 先把它登记进 safe.directory（幂等，不重复追加）。原先只在工作流 Preflight 里、且仅当 .git 已存在时才登记，
# 首次部署恰好没有 .git，于是必然失败。
if ! git config --global --get-all safe.directory 2>/dev/null | grep -qxF "$MS_REPO"; then
  git config --global --add safe.directory "$MS_REPO"
  ok "已把 $MS_REPO 加入 git safe.directory（属主 $(stat -c '%U' "$MS_REPO") ≠ 当前用户 $(id -un)）"
fi
NEED_INIT=0
if [ ! -d "$MS_REPO/.git" ]; then
  NEED_INIT=1; warn "$MS_REPO 还不是 git 仓库，首次就地初始化（凭据来自工作流的临时令牌；手工跑看到 Username 提示就 Ctrl+C）"
elif ! git -C "$MS_REPO" rev-parse -q --verify HEAD >/dev/null 2>&1; then
  NEED_INIT=1; warn "$MS_REPO/.git 不完整（上次首次部署中断？），就地重建"
fi
if [ -d "$MS_REPO/.clone.tmp" ]; then
  run "rm -rf '$MS_REPO/.clone.tmp'"; ok "清掉旧版脚本留下的 .clone.tmp"
fi
if [ "$NEED_INIT" = 1 ]; then
  run "rm -rf '$MS_REPO/.git' && git -C '$MS_REPO' init -q && git -C '$MS_REPO' remote add origin '$MS_GIT_URL' && git -C '$MS_REPO' fetch -q origin '$MS_BRANCH' && git -C '$MS_REPO' checkout -q -f -B '$MS_BRANCH' 'origin/$MS_BRANCH'"
  [ "$DRY_RUN" = 1 ] && { warn "dry-run：后面的步骤要等代码就位之后才有意义，到此为止"; exit 0; }
  ok "代码就位：$(git -C "$MS_REPO" log --oneline -1)"
fi
cd "$MS_REPO"
[ "$(git rev-parse --abbrev-ref HEAD)" = "$MS_BRANCH" ] || warn "当前分支是 $(git rev-parse --abbrev-ref HEAD)，不是 $MS_BRANCH"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  git status --short --untracked-files=no | head -20
  die "工作目录有未提交改动——联调机上不该直接改代码"
fi
OLD_SHA=$(git rev-parse HEAD)
if [ "$DO_PULL" = 1 ]; then
  git fetch -q origin "$MS_BRANCH"
  NEW_SHA=$(git rev-parse "origin/$MS_BRANCH")
  if [ "$OLD_SHA" = "$NEW_SHA" ]; then
    ok "已经是 origin/$MS_BRANCH 最新：$(git log --oneline -1)"
  else
    git merge-base --is-ancestor "$OLD_SHA" "$NEW_SHA" || die "本地 ${OLD_SHA:0:7} 不是 origin/$MS_BRANCH 的祖先，无法 fast-forward"
    ok "将从 ${OLD_SHA:0:7} 前进到 ${NEW_SHA:0:7}（$(git rev-list --count "$OLD_SHA..$NEW_SHA") 个提交）"
    git log --oneline "$OLD_SHA..$NEW_SHA" | sed 's/^/     /'
    run "git pull -q --ff-only origin '$MS_BRANCH'"
  fi
else
  NEW_SHA=$OLD_SHA; ok "--skip-pull：用现有代码 $(git log --oneline -1)"
fi
[ "$DRY_RUN" = 1 ] && NEW_SHA=$(git rev-parse "origin/$MS_BRANCH" 2>/dev/null || echo "$OLD_SHA")

# ---------- 产物来源 ----------
if [ -n "$PREBUILT" ]; then
  [ -f "$PREBUILT/BUILD_INFO" ] && [ -f "$PREBUILT/server.js" ] || die "--prebuilt $PREBUILT 不是 build-prebuilt.sh 的产物（缺 BUILD_INFO / server.js）"
  PB_COMMIT=$(sed -n 's/^commit=//p' "$PREBUILT/BUILD_INFO")
  if [ "$PB_COMMIT" != "$NEW_SHA" ]; then
    die "预构建产物的提交 ${PB_COMMIT:0:7} ≠ 联调机 HEAD ${NEW_SHA:0:7}——构建与部署之间又合并了？重新触发一次工作流"
  fi
  ok "预构建产物：$(tr '\n' ' ' < "$PREBUILT/BUILD_INFO")"
else
  warn "没有 --prebuilt：将在本机构建（next build 内存峰值约 800 MB，联调机紧张时很慢）"
fi

# 动手前确认服务器侧引导已完成，否则会在 npm ci / 建库 / 换入之后才在重启这一步失败
if [ -z "${MS_RESTART_CMD:-}" ]; then
  # 问 systemd 的 LoadState（走 D-Bus，不读单元文件）。systemctl cat 要读文件，root 的 umask 是 077 时
  # 单元文件对 ghrunner 不可读，会误报"没装"（2026-10-19 首次 dry-run）
  if [ "$(systemctl show -p LoadState --value "$MS_SERVICE" 2>/dev/null)" = loaded ]; then
    ok "systemd 单元 $MS_SERVICE 已安装"
  elif [ "$DRY_RUN" = 1 ]; then
    warn "systemd 单元 $MS_SERVICE 还没装（root 跑 tools/ops/bootstrap-server.sh）"
  else
    die "systemd 单元 $MS_SERVICE 还没装——先以 root 跑 tools/ops/bootstrap-server.sh"
  fi
  if [ "$(id -u)" != 0 ]; then
    if sudo -n -l systemctl restart "$MS_SERVICE" >/dev/null 2>&1; then
      ok "sudoers 允许 $(id -un) 重启 $MS_SERVICE"
    elif [ "$DRY_RUN" = 1 ]; then
      warn "sudoers 还不允许 $(id -un) 重启 $MS_SERVICE（bootstrap-server.sh 会写 /etc/sudoers.d/evidence-tuina-deploy）"
    else
      die "sudoers 不允许 $(id -un) 重启 $MS_SERVICE——先以 root 跑 tools/ops/bootstrap-server.sh"
    fi
  fi
fi

if [ "$ASSUME_YES" = 0 ] && [ "$DRY_RUN" = 0 ]; then
  printf '\n继续？会安装依赖、同步数据库、发布 %s 并重启 %s [y/N] ' "${NEW_SHA:0:7}" "$MS_SERVICE"
  read -r reply; case "$reply" in y|Y|yes) ;; *) echo "已取消"; exit 0 ;; esac
fi

# ---------- 1. 依赖 ----------
step "1. 依赖（prisma CLI 要用）"
if [ "$DO_DEPS" = 0 ]; then
  ok "--skip-deps"
elif [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  ok "package-lock.json 比 node_modules 新 → npm ci（降优先级）"
  run "$LOWPRIO npm ci --no-audit --no-fund"
else
  ok "依赖已是最新"
fi

# ---------- 2. 数据库 ----------
step "2. 数据库（prisma db push，幂等）"
[ -f "$ENV_FILE" ] || die "缺 $ENV_FILE——bootstrap-server.sh 会写"
DB_URL=$(sed -n 's/^DATABASE_URL=//p' "$ENV_FILE" | tr -d '"'"'")
[ -n "$DB_URL" ] || die "$ENV_FILE 里没有 DATABASE_URL"
ok "DATABASE_URL=$DB_URL"
run "DATABASE_URL='$DB_URL' $LOWPRIO node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss=false >/tmp/ms-dbpush.log 2>&1 || { cat /tmp/ms-dbpush.log; exit 1; }"
[ "$DRY_RUN" = 1 ] || ok "$(grep -E 'in sync|already in sync|Your database is now' /tmp/ms-dbpush.log | head -1 || echo 'db push 完成')"

# ---------- 3. 产物 ----------
step "3. 产物"
STAMP=$(date +%Y%m%d-%H%M%S)
RELEASE="$RELEASES/${NEW_SHA:0:7}-$STAMP"
mkdir -p "$RELEASES"
if [ -n "$PREBUILT" ]; then
  run "cp -a '$PREBUILT' '$RELEASE' && touch '$RELEASE'"
  ok "已拷贝预构建产物 → $RELEASE"
else
  run "$LOWPRIO bash '$MS_REPO/tools/ops/build-prebuilt.sh' '$RELEASE'"
fi
[ "$DRY_RUN" = 1 ] || [ -f "$RELEASE/server.js" ] || die "发布目录缺 server.js"

# ---------- 4. 切换 + 5. 重启 + 探活 ----------
step "4. 切换 current → $RELEASE 并重启 $MS_SERVICE"
PREV_TARGET=""
[ -L "$CURRENT" ] && PREV_TARGET=$(readlink "$CURRENT" || true)
switch_current "$RELEASE"
run "$RESTART"
if [ "$DRY_RUN" = 1 ]; then
  warn "dry-run 到此为止（没有拉代码、没有构建、没有重启）"; exit 0
fi
if wait_health; then
  ok "部署完成：$(git log --oneline -1)"
else
  step "探活失败 → 回滚"
  if [ -n "$PREV_TARGET" ] && [ -f "$PREV_TARGET/server.js" ]; then
    warn "current 指回 $PREV_TARGET，这次的产物留在 $RELEASE 供排查"
    ln -sfn "$PREV_TARGET" "$CURRENT.tmp" && mv -Tf "$CURRENT.tmp" "$CURRENT"
    eval "$RESTART"
    if wait_health; then die "已回滚并健康；本次部署失败。日志：journalctl -u $MS_SERVICE -n 80"; fi
    die "回滚后仍不健康，需要人工介入：journalctl -u $MS_SERVICE -n 80"
  fi
  die "没有上一版可回滚（首次部署失败）。日志：journalctl -u $MS_SERVICE -n 80"
fi

# ---------- 7. 清理 ----------
step "7. 清理旧 release（保留 $MS_KEEP_RELEASES 个）"
# 注意 pipefail：current.prev 首次部署时不存在，cat 失败会让整条流水线非 0 → set -e 在部署成功后把脚本打成失败
keep_list=$( { readlink "$CURRENT" || true; cat "$MS_REPO/current.prev" 2>/dev/null || true; } | sort -u )
# 按目录名里的时刻排序（cp -a 会保留产物原 mtime，按 mtime 排不可靠）
count=0
for name in $(ls -1 "$RELEASES" 2>/dev/null | sort -t- -k2 -r); do
  d="$RELEASES/$name"
  [ -d "$d" ] || continue
  count=$((count+1))
  if [ "$count" -gt "$MS_KEEP_RELEASES" ] && ! printf '%s\n' "$keep_list" | grep -qx "$d"; then
    rm -rf "$d"; ok "删除 $d"
  fi
done
ok "releases：$(ls -1 "$RELEASES" | wc -l) 个"
