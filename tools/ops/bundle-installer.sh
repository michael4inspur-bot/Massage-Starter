#!/usr/bin/env bash
# 把联调机首次安装要用的脚本打成一个自包含文件 ms-install.sh（服务器拉不了私有仓库，runner 又还没装，只能这样送过去）。
#
#   bash tools/ops/bundle-installer.sh [输出路径，缺省 ./ms-install.sh]
#
# 生成的 ms-install.sh 在联调机上以 root 执行：
#   sudo bash ms-install.sh --token <runner 注册令牌>
# 它把内嵌脚本解到 /tmp/ms-ops/，依次跑：
#   bootstrap-server.sh --site   组 / 目录 / env / systemd 单元 / sudoers / nginx 站点 / Let's Encrypt 证书
#   install-runner.sh --token …  为 Massage-Starter 注册 runner（标签 pilot），装成 systemd 服务
# 之后部署走 GitHub Actions「Deploy to pilot」。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-./ms-install.sh}"
FILES=(bootstrap-server.sh evidence-tuina.service nginx-site.py install-runner.sh ms-status.sh deploy.sh)
COMMIT=$(git -C "$HERE" rev-parse --short HEAD 2>/dev/null || echo unknown)

{
  cat <<HDR
#!/usr/bin/env bash
# EvidenceTuina 联调机一次性安装包（由 tools/ops/bundle-installer.sh 生成，来源提交 $COMMIT，勿手改）
#   sudo bash ms-install.sh --token <runner 注册令牌>
# 令牌：GitHub → Massage-Starter → Settings → Actions → Runners → New self-hosted runner，
#       页面上 ./config.sh 那一行 --token 后面的值（1 小时内有效）。
# 可重复执行：已完成的步骤会跳过。不碰 evcharger 的服务与 runner。
set -euo pipefail
TOKEN=""
while [ \$# -gt 0 ]; do
  case "\$1" in
    --token) TOKEN="\${2:?--token 需要值}"; shift 2 ;;
    *) echo "用法: sudo bash \$0 --token <runner 注册令牌>" >&2; exit 2 ;;
  esac
done
[ "\$(id -u)" = 0 ] || { echo "要以 root 执行：sudo bash \$0 --token ..." >&2; exit 1; }
OPS=/tmp/ms-ops
rm -rf "\$OPS"; mkdir -p "\$OPS"
HDR
  for f in "${FILES[@]}"; do
    [ -f "$HERE/$f" ] || { echo "缺 $HERE/$f" >&2; exit 1; }
    echo "base64 -d > \"\$OPS/$f\" <<'__MS_B64__'"
    base64 -w 76 "$HERE/$f"
    echo "__MS_B64__"
  done
  cat <<'TAIL'
chmod +x "$OPS"/*.sh "$OPS"/*.py
chmod -R a+rX "$OPS"
echo "安装包已解到 $OPS"

bash "$OPS/bootstrap-server.sh" --site
if [ -n "$TOKEN" ]; then
  bash "$OPS/install-runner.sh" --token "$TOKEN"
else
  bash "$OPS/install-runner.sh"     # 已注册过时不需要令牌；没注册过会提示缺 --token
fi

printf '\n\033[1m== 安装完成 ==\033[0m\n'
echo "  runner、目录、systemd 单元、sudoers、nginx 站点都已就位。"
echo "  回到对话里告诉 Claude「装好了」，它会在 GitHub Actions 上触发部署并核对 https://ms.port.et/api/health。"
TAIL
} > "$OUT"
chmod +x "$OUT"
bash -n "$OUT"
echo "已生成 $OUT（$(wc -c < "$OUT") 字节，来源提交 $COMMIT）"
