# EvidenceTuina 联调机部署手册（ms.port.et · 47.91.93.223）

> 与 evcharger 共用同一台联调机（`docs/PILOT_SERVER_RUNBOOK.md` 那台）：宿主机 nginx、Let's Encrypt（`authenticator = nginx`）、
> 自托管 GitHub Actions runner。本应用是一个 Next.js 进程，监听 **127.0.0.1:9600**，由 nginx 以 `ms.port.et` 反代；
> 数据是一个 SQLite 文件。所有"改配置"都走 **候选文件 → `nginx -t` → 通过才落盘 → 失败自动回滚** 的套路，不手改。

## 0. 给服务器命令之前

1. 账号 / 路径照抄 `tools/ops/ms-status.sh` 缺省值：代码与数据 `/mnt/data/massage-starter`，服务 `evidence-tuina`，端口 `9600`，runner 用户 `ghrunner`，组 `msdeploy`。
2. 服务器上看到 `Username for 'https://github.com'` 就 **Ctrl+C**，永远不输凭据；拉代码只走 Actions（临时令牌）。
3. 在服务器上**单条执行**命令，不要整段粘贴（`certbot` 会弹交互）。
4. 触发部署前先看最近 3 次运行，有正在跑的就不要再点（跑到一半的部署不要取消）。

## 1. 架构一眼看

| 项 | 值 |
|---|---|
| 代码 | `/mnt/data/massage-starter`（git，分支 `main`，Actions 用临时令牌 fast-forward） |
| 产物 | `/mnt/data/massage-starter/releases/<sha>-<时刻>/`（Next.js standalone），`current` 符号链接指向在用的一份，`current.prev` 记上一份 |
| 进程 | systemd `evidence-tuina`：`node server.js`，`User=ghrunner`，`EnvironmentFile=/mnt/data/massage-starter/.env.production`，`Restart=always` |
| 数据 | SQLite `/mnt/data/massage-starter/data/evidence-tuina.db`（`DATABASE_URL` 在 `.env.production`） |
| 入口 | nginx `/etc/nginx/nginx.conf` 的 http 块里 `# >>> MS SITE ... <<<` 受管块：80 跳转 + 443 反代 127.0.0.1:9600；证书 `/etc/letsencrypt/live/ms.port.et/` |
| 探活 | `GET /api/health` → `{ok, commit, db}`；部署脚本重启后轮询它，非 200 回滚 |
| 构建 | **不在联调机上构建**（`next build` 峰值约 800 MB）。GitHub 托管 runner 构建 → artifact → 联调机 runner 换入 |

脚本都在 `tools/ops/`：

| 脚本 | 谁跑 | 做什么 |
|---|---|---|
| `bootstrap-server.sh` | root，一次 | 组 / 目录 / `.env.production` / systemd 单元 / sudoers |
| `deploy.sh` | ghrunner（工作流）或 root | 拉代码 → `npm ci` → `prisma db push` → 换入产物 → 重启 → 探活 → 失败回滚；`--rollback` |
| `build-prebuilt.sh` | 托管 runner（工作流）或本机 | `next build` 并组装 standalone 产物 + `BUILD_INFO` |
| `nginx-site.py` | root | 写 / 更新 ms.port.et 受管块（候选校验、备份、`--rollback`），证书存在时自动带 443 |
| `ms-status.sh` | 任何人 | 只读巡检：产物提交、systemd、端口、本机 / 公网探活、证书到期、DNS |

## 2. 首次上线（按顺序，一次性）

### 2.1 DNS
在 `port.et` 的 DNS 加 A 记录：`ms.port.et → 47.91.93.223`（与 `ev.port.et` 同一台）。验证：`dig +short ms.port.et` 返回该 IP。

### 2.2 注册本仓库的 runner（联调机，以 ghrunner 用户）
runner 是**仓库级**的（个人账户没有组织级 runner），evcharger 那台 `ghrunner` 不能复用，要再装一个实例、标签 `pilot`：

1. GitHub → `Massage-Starter` → Settings → Actions → Runners → New self-hosted runner → Linux x64，复制页面上的下载与 `config.sh` 命令（含一次性 token）。
2. 联调机上以 **ghrunner** 执行（目录另起，不要和 `/opt/actions-runner` 混）：
   ```bash
   sudo mkdir -p /opt/actions-runner-ms && sudo chown ghrunner:ghrunner /opt/actions-runner-ms
   sudo -iu ghrunner bash -c 'cd /opt/actions-runner-ms && curl -o actions-runner.tar.gz -L <页面上的下载地址> && tar xzf actions-runner.tar.gz'
   sudo -iu ghrunner bash -c 'cd /opt/actions-runner-ms && ./config.sh --url https://github.com/michael4inspur-bot/Massage-Starter --token <页面上的 token> --name ms-pilot --labels pilot --unattended'
   cd /opt/actions-runner-ms && sudo ./svc.sh install ghrunner && sudo ./svc.sh start && sudo ./svc.sh status
   ```
   验收判据：`systemctl list-units 'actions.runner.*'` 里多了一条、GitHub 页面 Runners 显示 `ms-pilot` Idle。手工 `./run.sh` 起的 runner 终端一断就死（evcharger RUNBOOK §5.1）。

### 2.3 引导（root，一次）
1. GitHub → Actions → **Deploy to pilot** → Run workflow（分支 main，`dry_run=true`）。Preflight 会把 `tools/ops/` 复制到联调机 `/tmp/ms-ops/`，然后因为 `/mnt/data/massage-starter` 不存在而报错停下——这是预期的。
2. 联调机 root：
   ```bash
   sudo bash /tmp/ms-ops/bootstrap-server.sh
   sudo systemctl restart 'actions.runner.*'      # 让 ghrunner 的新附加组 msdeploy 生效
   ```
   脚本幂等，打印 node 路径、OpenSSL 版本、端口 9600 是否空闲。

### 2.4 首次部署（Actions）
Actions → Deploy to pilot → `dry_run=false`、`build_on=hosted`。build 任务在 GitHub 托管 runner 上构建，deploy 任务在 `ms-pilot` 上：clone → `npm ci` → `prisma db push` → 换入产物 → `systemctl restart evidence-tuina` → `/api/health` 200。
此时只有本机 127.0.0.1:9600 能访问，nginx 还没配。

### 2.5 nginx + 证书（root）
```bash
python3 /mnt/data/massage-starter/tools/ops/nginx-site.py --dry-run     # 看 diff；候选已过 nginx -t
python3 /mnt/data/massage-starter/tools/ops/nginx-site.py && systemctl reload nginx     # 此时只写 80 块（还没证书）
certbot certonly --nginx -d ms.port.et                                                  # 单条执行；沿用机器上已有的 Let's Encrypt 账号
python3 /mnt/data/massage-starter/tools/ops/nginx-site.py && systemctl reload nginx     # 证书已存在 → 受管块升级为 443 + 80 跳转
```
受管块会把 http 块里的 `add_header` 原样搬进 server 层、只替换 CSP（Next.js 的内联 hydration 脚本需要 `'unsafe-inline'`）。
续期不用管：`certbot renew` 沿用 nginx 插件，80 块里保持 `server_name ms.port.et` 即可。

### 2.6 验收
```bash
bash /mnt/data/massage-starter/tools/ops/ms-status.sh
curl -s https://ms.port.et/api/health      # {"ok":true,"commit":"<main 的 sha>","db":"ok",...}
```
手机 / 电脑打开 `https://ms.port.et/`，首次进入应弹出红旗征筛查。

## 3. 以后更新（每次合并 main 后）
Actions → Deploy to pilot → `dry_run=false`。两分钟左右。失败时脚本已自动回滚到上一份 release 并重启，工作流末尾会打印巡检与失败段落。

手工（联调机，ghrunner 或 root）：
```bash
bash /mnt/data/massage-starter/tools/ops/deploy.sh --dry-run
bash /mnt/data/massage-starter/tools/ops/deploy.sh -y            # 本机构建（应急，很慢）
```

## 4. 回滚
```bash
bash /mnt/data/massage-starter/tools/ops/deploy.sh --rollback     # current 指回 current.prev，重启，探活
python3 /mnt/data/massage-starter/tools/ops/nginx-site.py --rollback && nginx -t && systemctl reload nginx   # 只回滚 nginx
```

## 5. 常见问题
| 现象 | 原因 / 处置 |
|---|---|
| 工作流 deploy 一直 Queued | 本仓库的 runner 不在线：`systemctl status 'actions.runner.*'`；或 `runs-on` 标签 `pilot` 没对上 |
| Preflight `不可写` | bootstrap 后没重启 runner 服务，附加组没生效 |
| `预构建产物的提交 ≠ 联调机 HEAD` | 构建与部署之间又合并了 main，重新触发一次 |
| `npm ci` 卡在下载 Prisma 引擎 | 联调机间歇性出网故障（evcharger RUNBOOK §1 已知风险），稍后重试；产物本身自带 RHEL 引擎，不依赖这一步的下载 |
| `/api/health` 503 `db: error` | `.env.production` 的 `DATABASE_URL` 路径对 ghrunner 不可写，或 `data/` 目录权限；`ls -la /mnt/data/massage-starter/data` |
| 页面空白、控制台 CSP 报错 | 受管块的 CSP 被 http 块新加的头覆盖？重跑 `nginx-site.py`，它会重新搬 http 块的头 |
| `certbot certonly --nginx` 找不到 server 块 | 先跑一次 `nginx-site.py`（80 块必须先存在） |
