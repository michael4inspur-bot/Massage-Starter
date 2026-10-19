/**
 * EvidenceTuina 核心数据结构
 * ------------------------------------------------------------
 * 课程树：Stage(阶段) -> 四个标准化子模块
 *   A PalpationModule      零基础触诊导航（SVG 骨骼肌定位）
 *   B PracticeModule       交互式物理量化练功房（节拍器 / 压力计 / 呼吸引导）
 *   C LiteratureCard[]     文献与机制微卡片（三层展示）
 *   D CheckpointQuiz       通关体感自测（3 道场景题 + 实操时长校验）
 * 安全门禁：RedFlagItem[]  任一高危项勾选即阻断
 */

// ---------- 通用 ----------

export type StageId = "stage-1" | "stage-2" | "stage-3" | "stage-4";

/** 视觉模拟痛感标尺 0-10（VAS, Visual Analogue Scale） */
export type VasScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface VasRange {
  min: VasScore;
  max: VasScore;
}

// ---------- 红旗征 ----------

export type RedFlagCategory =
  | "trauma" // 急性外伤 / 骨折
  | "neuro" // 神经放射症状
  | "vascular" // 血管（椎动脉 / 深静脉血栓）
  | "systemic" // 全身性（感染 / 肿瘤 / 不明原因体重下降）
  | "visceral" // 内脏相关（腹部手法禁忌）
  | "skin" // 皮肤 / 局部病变
  | "general"; // 一般注意事项（不阻断）

export type RedFlagSeverity = "block" | "caution";

export interface RedFlagItem {
  id: string;
  category: RedFlagCategory;
  /** 面向小白的问句 */
  question: string;
  /** 为什么这是红旗（一句话医学依据） */
  rationale: string;
  /** block = 勾选即锁死实操面板；caution = 提示但不阻断 */
  severity: RedFlagSeverity;
  /** 建议转诊科室 */
  referral: string;
}

export type SafetyGateStatus = "unscreened" | "cleared" | "blocked";

// ---------- 模块 A：触诊导航 ----------

/** SVG 画布坐标（viewBox 0 0 400 600，正面/背面两张图） */
export interface SvgPoint {
  x: number;
  y: number;
}

export type BodyView = "anterior" | "posterior";

export interface AnatomyLandmark {
  id: string;
  /** 骨性标志或肌肉/激痛点名称 */
  name: string;
  latin: string;
  kind: "bone" | "muscle" | "triggerPoint" | "fascia";
  view: BodyView;
  position: SvgPoint;
  /** 手指怎么找到它：一步一步 */
  howToFind: string[];
  /** 找到后的触感描述（硬/有弹性/条索/跳动） */
  feel: string;
  /** 常见错误 */
  pitfalls: string;
}

export interface PalpationModule {
  title: string;
  intro: string;
  landmarks: AnatomyLandmark[];
  /** 自检：找到全部标志后的确认题 */
  selfCheck: string;
}

// ---------- 模块 B：物理量化练功房 ----------

/**
 * 三种手法模式对应三种物理参数化引导：
 *  rhythmic      节律型（揉/滚/推/摩）：锁定频率 + 目标形变深度
 *  holdRelease   静态持续按压（缺血性按压）：Hold/Release 计时 + 呼吸引导
 *  strum         横向弹拨（触变模式）：低频 + 垂直于肌纤维方向
 */
export type MechanicsMode = "rhythmic" | "holdRelease" | "strum";

export type ForceDirection =
  | "tangential" // 切向（推拉、滚动）
  | "perpendicular" // 垂直（持续按压）
  | "transverse" // 横向（垂直于肌纤维弹拨）
  | "centripetal" // 向心（向心脏方向挤压引流）
  | "clockwise" // 顺时针（摩腹）
  | "longitudinal"; // 纵向（沿肌纤维方向被动牵拉）

export interface BreathingPattern {
  inhaleSeconds: number;
  exhaleSeconds: number;
  /** 呼气时加压（下沉）还是保持 */
  exhaleAction: "sink" | "hold";
}

export interface MechanicsParams {
  mode: MechanicsMode;
  /** 节律型/弹拨型必填：目标频率（Hz） */
  frequencyHz?: number;
  /** 静态按压必填 */
  holdSeconds?: number;
  releaseSeconds?: number;
  /** 目标形变深度 0-1（"按压海绵至 50% 形变" = 0.5） */
  targetDepth: number;
  /** 允许的痛感区间 */
  vas: VasRange;
  direction: ForceDirection;
  /** 神经生理目标（用于界面标签，如 "Ruffini 激活模式"） */
  neuroTarget: string;
  breathing?: BreathingPattern;
  /** 单次练习达标时长（秒） */
  requiredSeconds: number;
}

export interface Technique {
  id: string;
  /** 中文名 + 现代命名，如 "慢速掌揉法（Ruffini 激活模式）" */
  name: string;
  modernName: string;
  summary: string;
  mechanics: MechanicsParams;
  /** 小白可执行步骤 */
  steps: string[];
  /** 手部姿势 / 体位 */
  handPosition: string;
  /** 做错的信号（立即停止） */
  stopSignals: string[];
  /** 绑定的文献卡片 id */
  literatureIds: string[];
}

export interface PracticeModule {
  title: string;
  intro: string;
  techniques: Technique[];
  /** 本阶段绝对禁止的动作 */
  forbidden: string[];
}

// ---------- 模块 C：文献微卡片 ----------

export interface Citation {
  authors: string;
  title: string;
  journal: string;
  year: number;
  volumeIssuePages: string;
  doi?: string;
  pmid?: string;
}

export interface LiteratureCard {
  id: string;
  /** 卡片标题（机制名） */
  title: string;
  /** 💡 小白秒懂一句话（生活物理比喻） */
  laymanAnalogy: string;
  /** 🧬 生理机制解析 */
  mechanism: {
    nerveFibers: string[];
    receptors: string[];
    biomarkers: string[];
    explanation: string;
  };
  /** 📄 原始文献溯源 */
  citation: Citation;
  /** 核心实验数据摘要 */
  keyData: string[];
  /** 对实操参数的直接指导意义 */
  practiceImplication: string;
}

// ---------- 模块 D：通关自测 ----------

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  /** 场景描述 */
  scenario: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface CheckpointQuiz {
  title: string;
  questions: QuizQuestion[];
  /** 需答对题数 */
  passScore: number;
  /** 本阶段所有技术累计实操达标秒数 */
  requiredPracticeSeconds: number;
}

// ---------- 阶段 ----------

export interface Stage {
  id: StageId;
  order: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  durationMinutes: number;
  goals: string[];
  /** 本阶段相关的红旗征 id（门禁中高亮） */
  relevantRedFlagIds: string[];
  palpation: PalpationModule;
  practice: PracticeModule;
  literature: LiteratureCard[];
  quiz: CheckpointQuiz;
}

export interface Curriculum {
  title: string;
  tagline: string;
  stages: Stage[];
}

// ---------- 进度（Zustand / Prisma 共用） ----------

export interface StageProgressState {
  /** 每个技术累计实操秒数 */
  practiceSeconds: Record<string, number>;
  quizBestScore: number;
  quizPassed: boolean;
  completedAt: string | null;
  literatureRead: string[];
  landmarksFound: string[];
}

export interface ProgressSnapshot {
  learnerId: string;
  safety: {
    status: SafetyGateStatus;
    flaggedIds: string[];
    screenedAt: string | null;
  };
  stages: Record<StageId, StageProgressState>;
}
