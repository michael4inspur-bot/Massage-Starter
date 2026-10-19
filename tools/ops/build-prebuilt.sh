#!/usr/bin/env bash
# 把 EvidenceTuina 构建成"可直接换入联调机"的产物目录（Next.js standalone）。
#
#   bash tools/ops/build-prebuilt.sh <输出目录>
#
# 产物布局（<输出目录>/）：
#   server.js  .next/  node_modules/  public/  package.json   ← next build 的 standalone 树 + static + public
#   BUILD_INFO                                                ← commit / 构建机 / node 版本 / 时间，deploy.sh --prebuilt 据此核对
#
# 在哪跑：
#   - GitHub 托管 runner（.github/workflows/deploy-pilot.yml 的 build 任务，缺省）——x86_64，与联调机一致；
#   - 或联调机本机（deploy.sh 不带 --prebuilt 时自己调），内存峰值约 800 MB，联调机紧张时会很慢。
# 只依赖 bash / node / git / coreutils（RUNBOOK §5.5 守则）。
set -euo pipefail

OUT="${1:?用法: build-prebuilt.sh <输出目录>}"
MS_REPO="${MS_REPO:-$(cd "$(dirname "$0")/../.." && pwd)}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}"
export NEXT_TELEMETRY_DISABLED=1

ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✘\033[0m %s\n' "$*" >&2; exit 1; }

cd "$MS_REPO"
[ -f package.json ] && grep -q '"name": "evidence-tuina"' package.json || die "$MS_REPO 不是 EvidenceTuina 仓库"
COMMIT=$(git rev-parse HEAD 2>/dev/null || echo unknown)
export NEXT_PUBLIC_BUILD_COMMIT="$COMMIT"

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "== npm ci（lock 比 node_modules 新）"
  npm ci --no-audit --no-fund
else
  ok "依赖已是最新，跳过 npm ci"
fi

echo "== prisma generate（含 RHEL 引擎）"
node node_modules/prisma/build/index.js generate >/dev/null
ls node_modules/.prisma/client/ | grep -q 'libquery_engine-rhel' || die "生成的 Prisma client 里没有 rhel 引擎——检查 prisma/schema.prisma 的 binaryTargets"

echo "== next build（standalone）"
rm -rf .next
node node_modules/next/dist/bin/next build
[ -f .next/standalone/server.js ] || die "没有 .next/standalone/server.js——next.config.ts 的 output 必须是 standalone"

echo "== 组装产物 → $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"
cp -a .next/standalone/. "$OUT/"
mkdir -p "$OUT/.next/static"
cp -a .next/static/. "$OUT/.next/static/"
[ -d public ] && cp -a public "$OUT/public"
cp -a prisma/schema.prisma "$OUT/schema.prisma"
# Prisma client 要能在 RHEL 上跑：standalone 追踪只会拷 .prisma/client 目录，这里确认引擎真的在里面
ls "$OUT/node_modules/.prisma/client/" | grep -q 'libquery_engine-rhel' || die "产物里的 Prisma client 缺 rhel 引擎"

{
  echo "commit=$COMMIT"
  echo "builder=$(hostname) ($(uname -m))"
  echo "node=$(node -v)"
  echo "built_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} > "$OUT/BUILD_INFO"
ok "产物：$(du -sh "$OUT" | cut -f1)  $(tr '\n' ' ' < "$OUT/BUILD_INFO")"
