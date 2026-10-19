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
| `bundle-installer.sh` | 开发机 | 把下面几个打成自包含的 `ms-install.sh`（首次安装用） |
| `bootstrap-server.sh` | root，一次 | 组 / 目录 / `.env.production` / systemd 单元 / sudoers；`--site` 再做 nginx + 证书 |
| `install-runner.sh` | root，一次 | 为本仓库注册 runner（`ms-pilot`，标签 `pilot`）并装成 systemd 服务 |
| `deploy.sh` | ghrunner（工作流）或 root | 拉代码 → `npm ci` → `prisma db push` → 换入产物 → 重启 → 探活 → 失败回滚；`--rollback` |
| `build-prebuilt.sh` | 托管 runner（工作流）或本机 | `next build` 并组装 standalone 产物 + `BUILD_INFO` |
| `nginx-site.py` | root | 写 / 更新 ms.port.et 受管块（候选校验、备份、`--rollback`），证书存在时自动带 443 |
| `ms-status.sh` | 任何人 | 只读巡检：产物提交、systemd、端口、本机 / 公网探活、证书到期、DNS |

## 2. 首次上线（按顺序，一次性）

服务器拉不了私有仓库、runner 又还没装，所以首次安装用一个**自包含安装包** `ms-install.sh`：
由 `tools/ops/bundle-installer.sh` 把 `bootstrap-server.sh` / `install-runner.sh` / `nginx-site.py` / 单元模板等打进一个文件，
在联调机上以 root 跑一次即可。可重复执行，已完成的步骤会跳过；**不碰 evcharger 的服务与 runner**。

### 2.1 DNS
`port.et` 加 A 记录 `ms.port.et → 47.91.93.223`（与 `ev.port.et` 同一台）。验证：`getent hosts ms.port.et`。

### 2.2 生成安装包（开发机 / Claude 会话里）
```bash
bash tools/ops/bundle-installer.sh ./ms-install.sh
```

### 2.3 在联调机上跑（root，一次）
1. 拿 runner 注册令牌：GitHub → Massage-Starter → Settings → Actions → Runners → **New self-hosted runner**，
   页面上 `./config.sh --url … --token XXXX` 那一行的 `XXXX`（1 小时内有效）。
2. 把 `ms-install.sh` 传到联调机（`scp ms-install.sh root@47.91.93.223:/root/`），然后：
   ```bash
   sudo bash /root/ms-install.sh --token XXXX
   ```

它依次做：

| 步 | 脚本 | 内容 |
|---|---|---|
| 1 | `bootstrap-server.sh --site` | 组 `msdeploy`、`/mnt/data/massage-starter/{releases,data}`、`.env.production`、systemd 单元 `evidence-tuina`、sudoers（只许 ghrunner 重启这一个服务） |
| 2 | 同上 | `nginx-site.py` 写 80 块 → reload → `certbot certonly --nginx -d ms.port.et --non-interactive`（沿用机器上已有的 Let's Encrypt 账号）→ 写 443 + 80 跳转 → reload。证书失败只告警，站点先以 http 提供 |
| 3 | `install-runner.sh --token` | runner 程序：从 GitHub 下最新版并按 release 里的 SHA256 校验；下载失败则从 `/opt/actions-runner` 拷程序文件（不拷凭据）。以 ghrunner 注册到 `/opt/actions-runner-ms`，名字 `ms-pilot`、标签 `pilot`，`svc.sh install` 成 systemd 服务 |

验收：GitHub → Settings → Actions → Runners 里 `ms-pilot` 显示 Idle；`systemctl list-units 'actions.runner.*'` 多出一条。

### 2.4 首次部署（Actions）
Actions → **Deploy to pilot** → `dry_run=false`、`build_on=hosted`。build 在 GitHub 托管 runner 上构建，deploy 在 `ms-pilot` 上：
clone → `npm ci` → `prisma db push` → 换入产物 → `systemctl restart evidence-tuina` → `/api/health` 200 → 部署后巡检（含公网 https 探活）。

### 2.5 验收
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
| Preflight `不可写` | runner 服务比 bootstrap 先起，附加组没生效：`systemctl restart "$(cat /opt/actions-runner-ms/.service)"`（只重启本仓库这台，别动 evcharger 的） |
| `预构建产物的提交 ≠ 联调机 HEAD` | 构建与部署之间又合并了 main，重新触发一次 |
| `npm ci` 卡在下载 Prisma 引擎 | 联调机间歇性出网故障（evcharger RUNBOOK §1 已知风险），稍后重试；产物本身自带 RHEL 引擎，不依赖这一步的下载 |
| `/api/health` 503 `db: error` | `.env.production` 的 `DATABASE_URL` 路径对 ghrunner 不可写，或 `data/` 目录权限；`ls -la /mnt/data/massage-starter/data` |
| 页面空白、控制台 CSP 报错 | 受管块的 CSP 被 http 块新加的头覆盖？重跑 `nginx-site.py`，它会重新搬 http 块的头 |
| 证书没签下来 | DNS 未生效或 80 端口不通；修好后重跑 `sudo bash /tmp/ms-ops/bootstrap-server.sh --site` |
| runner 注册报 token 无效 | 令牌 1 小时过期且只能用一次，回 Runners 页面重新生成 |
