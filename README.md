# EvidenceTuina · 循证推拿实验室

面向零基础用户的现代循证推拿（手法治疗）速成训练 Web App。
科学闭环：**解剖定位 → 安全筛查 → 物理参数化实操 → 机制文献内化**。

## 技术栈

- Next.js 15（App Router）· TypeScript strict · Tailwind CSS 4 · Lucide Icons · Framer Motion
- Zustand（闯关进度 / 实操计时，localStorage 持久化）+ Prisma ORM（SQLite 默认，可切 PostgreSQL）
- Web Audio API 节拍器（lookahead 调度）+ Canvas 压力波形 + 呼吸引导动画
- 端口固定 **9600**（`npm run dev` / `npm start` / Docker）

## 快速开始

```bash
npm install            # postinstall 自动 prisma generate
npx prisma db push     # 创建 SQLite（prisma/dev.db）
npm run dev            # http://localhost:9600
```

生产：

```bash
npm run build && npm start        # 同样绑定 9600
docker compose up --build         # 容器端口 9600，数据卷 tuina-data
```

门禁检查：`npm run typecheck`、`npm run build`。

## 目录结构

```
.
├── Dockerfile / docker-compose.yml        # 端口 9600
├── package.json                           # dev/start 强制 -p 9600
├── prisma/schema.prisma                   # Learner / SafetyScreening / StageProgress / PracticeLog
└── src
    ├── app
    │   ├── layout.tsx · globals.css · icon.svg
    │   ├── page.tsx                       # 主控制台：闯关地图 + 安全门禁 + 练功房 + 文献抽屉
    │   └── api/progress/route.ts          # 进度快照 upsert；api/progress/log 实操日志
    ├── components
    │   ├── PracticeMetronome.tsx          # Web Audio 节拍器 / Canvas 压力计 / Hold-Release / 呼吸引导 / 跟拍偏差
    │   ├── SafetyGate.tsx                 # 红旗征清单状态机（勾选高危项即阻断 + 转诊建议）
    │   ├── StageMap.tsx                   # 四阶段线性解锁地图
    │   ├── PalpationNavigator.tsx         # SVG 骨骼肌 / 激痛点定位
    │   ├── LiteratureDrawer.tsx           # 💡 / 🧬 / 📄 三层文献卡片
    │   └── CheckpointQuiz.tsx             # 3 道场景题 + 每手法实操时长校验
    ├── data
    │   ├── curriculum.ts                  # 4 阶段完整课程数据 + 13 张真实文献卡片
    │   └── redFlags.ts                    # 临床红旗征清单
    ├── lib/prisma.ts · lib/progress.ts    # Prisma 单例 / 解锁与完成度计算
    ├── store/useTuinaStore.ts             # Zustand + persist
    ├── store/useProgressSync.ts           # 防抖同步到数据库（失败静默）
    └── types/tuina.ts                     # 课程 / 力学参数 / 红旗征 / 文献 Schema
```

## 核心规则

1. **安全熔断前置**：首次进入自动弹出红旗征清单；任一 `severity: "block"` 条目勾选 → 状态 `blocked`，练功房与考核锁死，显示转诊科室。
2. **四阶线性解锁**：阶段 N 的 `completedAt` 非空才解锁阶段 N+1；完成 = 通关题答对 ≥ passScore **且** 每个手法累计实操 ≥ 各自 `requiredSeconds`。
3. **物理参数化**：每个手法声明 `mode`（rhythmic / holdRelease / strum）、频率或 Hold/Release、目标形变深度、VAS 区间、力方向、呼吸模式。
4. **文献三层展示**：每张卡片含生活比喻、神经纤维 / 感受器 / 生化指标、标准 citation（DOI / PMID 可点击）与核心数据摘要。

## 课程内容

| 阶段 | 主题 | 手法 | 文献 |
| --- | --- | --- | --- |
| 1 | 破除玄学与手感建立（30 min） | 压强标定 10s/5s · 掌揉 2.0 Hz | Melzack & Wall 1965 *Science*；Bialosky 2009；Schleip 2003 |
| 2 | 久坐族颈肩拯救（45 min） | 缺血性按压 45s/15s · 拿法 1.0 Hz · 弹拨 1.0 Hz | Simons 2004；Schleip 2003；Shah 2008；Hou 2002 |
| 3 | 慢性下背痛核心解法（45 min） | 掌根剪切推 0.5 Hz · 弹拨 1.0 Hz · GTO 牵拉 30s/10s | Stecco 2011 *Surg Radiol Anat*；ACP 2017 *Ann Intern Med*；Langevin 2005 |
| 4 | 运动后恢复与助眠（30 min） | 向心引流 1.0 Hz · 摩腹 0.5 Hz · 慢速轻抚 0.25 Hz | Crane 2012 *Sci Transl Med*；Diego & Field 2009；Guo 2017；Sinclair 2011 |

> 本应用为教学辅助，不替代医疗诊断。全程禁止颈椎 / 腰椎旋转扳法。
