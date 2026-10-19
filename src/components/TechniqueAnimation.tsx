"use client";

import { useMemo } from "react";
import { motion, type Transition } from "framer-motion";
import type { Technique, TechniqueDemo } from "@/types/tuina";

/* ----------------------------------------------------------------------------
 * TechniqueAnimation：每个手法的 SVG 循环动画（Framer Motion）
 * 动画周期与手法参数同步：节律 / 弹拨 = 1/frequencyHz；静态 = hold + release。
 * viewBox 0 0 320 200
 * -------------------------------------------------------------------------- */

const SKIN = "rgba(255,255,255,0.05)";
const SKIN_STROKE = "rgba(255,255,255,0.35)";
const MUSCLE = "rgba(90,169,246,0.18)";
const MUSCLE_STROKE = "rgba(90,169,246,0.7)";
const FASCIA = "rgba(246,183,60,0.9)";
const HAND = "#f3c88a";
const HAND_STROKE = "#b9834a";
const MINT = "#4fd1b5";
const CORAL = "#ef5a5a";

function loop(duration: number, times?: number[]): Transition {
  return { duration, repeat: Infinity, ease: "easeInOut", ...(times ? { times } : {}) };
}

/** 手掌（指尖朝上） */
function Palm({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale})`} fill={HAND} stroke={HAND_STROKE} strokeWidth={1.5}>
      <rect x={-24} y={-10} width={48} height={46} rx={14} />
      <rect x={-22} y={-40} width={10} height={34} rx={5} />
      <rect x={-9} y={-46} width={10} height={40} rx={5} />
      <rect x={4} y={-44} width={10} height={38} rx={5} />
      <rect x={16} y={-34} width={9} height={30} rx={4.5} />
      <rect x={-40} y={-4} width={11} height={30} rx={5.5} transform="rotate(-35 -34 10)" />
    </g>
  );
}

/** 拇指（指尖朝下，用于垂直按压 / 弹拨） */
function Thumb({ rotate = 0 }: { rotate?: number }) {
  return (
    <g transform={`rotate(${rotate})`} fill={HAND} stroke={HAND_STROKE} strokeWidth={1.5}>
      <rect x={-12} y={-70} width={24} height={76} rx={12} />
      <ellipse cx={0} cy={-6} rx={7} ry={4} fill="rgba(255,255,255,0.5)" stroke="none" />
    </g>
  );
}

function Tissue({ y = 120, h = 62, fibers = "horizontal" }: { y?: number; h?: number; fibers?: "horizontal" | "vertical" }) {
  return (
    <g>
      <rect x={20} y={y} width={280} height={h} rx={16} fill={MUSCLE} stroke={MUSCLE_STROKE} strokeWidth={1.2} />
      {fibers === "horizontal"
        ? [0.3, 0.5, 0.7].map((f) => (
            <line key={f} x1={34} x2={286} y1={y + h * f} y2={y + h * f} stroke={MUSCLE_STROKE} strokeWidth={0.8} opacity={0.5} />
          ))
        : [60, 100, 140, 180, 220, 260].map((x) => (
            <line key={x} x1={x} x2={x} y1={y + 8} y2={y + h - 8} stroke={MUSCLE_STROKE} strokeWidth={0.8} opacity={0.5} />
          ))}
    </g>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <text x={160} y={192} fontSize={11} textAnchor="middle" fill="rgba(255,255,255,0.55)">
      {text}
    </text>
  );
}

/* ---------------- 各手法 ---------------- */

function Knead({ period, depth }: { period: number; depth: number }) {
  const r = 12;
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6 };
  });
  return (
    <>
      <Tissue y={118} h={60} />
      {/* 皮肤层随手移动 */}
      <motion.rect
        x={20}
        y={110}
        width={280}
        height={14}
        rx={7}
        fill={SKIN}
        stroke={SKIN_STROKE}
        animate={{ x: pts.map((p) => p.x * 0.6) }}
        transition={loop(period)}
      />
      <motion.ellipse cx={160} cy={126} rx={34} ry={8 + depth * 10} fill="rgba(0,0,0,0.35)" animate={{ x: pts.map((p) => p.x), y: pts.map((p) => p.y) }} transition={loop(period)} />
      <motion.g animate={{ x: pts.map((p) => p.x), y: pts.map((p) => p.y) }} transition={loop(period)} style={{ x: 160, y: 118 }}>
        <g transform="translate(160 118) rotate(-90)">
          <Palm />
        </g>
      </motion.g>
      <motion.path
        d="M118 70 A42 42 0 1 1 118 71"
        fill="none"
        stroke={MINT}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        animate={{ rotate: 360 }}
        transition={{ duration: period, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "160px 70px", transformBox: "view-box" }}
      />
      <Caption text="掌根贴住 · 带着皮肤画小圆（切向） · 不在皮肤表面摩擦" />
    </>
  );
}

function Press({ hold, release, depth, breathing }: { hold: number; release: number; depth: number; breathing: boolean }) {
  const T = hold + release;
  const ramp = Math.min(3, hold);
  const sink = 14 + depth * 10;
  const times = [0, ramp / T, hold / T, Math.min(1, hold / T + 0.03), Math.min(1, (hold + 2) / T), 1];
  const ys = [0, sink, sink, 0, 0, 0];
  return (
    <>
      <Tissue y={128} h={52} />
      {/* 紧张带 + 激痛点 */}
      <path d="M40 148 Q160 140 280 150" stroke={CORAL} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.6} />
      <circle cx={160} cy={144} r={6} fill={CORAL} />
      <motion.ellipse cx={160} cy={140} rx={28} ry={6} fill="rgba(0,0,0,0.4)" animate={{ scaleY: ys.map((y) => 1 + y / 8), scaleX: ys.map((y) => 1 + y / 40) }} transition={loop(T, times)} style={{ transformOrigin: "160px 140px", transformBox: "view-box" }} />
      <motion.g animate={{ y: ys }} transition={loop(T, times)}>
        <g transform="translate(160 146)">
          <Thumb />
        </g>
      </motion.g>
      {/* 相位条 */}
      <rect x={40} y={20} width={240} height={10} rx={5} fill="rgba(255,255,255,0.08)" />
      <rect x={40} y={20} width={(240 * hold) / T} height={10} rx={5} fill="rgba(79,209,181,0.5)" />
      <motion.circle cy={25} r={6} fill="#fff" animate={{ cx: [40, 280] }} transition={{ duration: T, repeat: Infinity, ease: "linear" }} />
      <text x={40} y={44} fontSize={10} fill={MINT}>
        HOLD {hold}s
      </text>
      <text x={280} y={44} fontSize={10} textAnchor="end" fill="#5aa9f6">
        RELEASE {release}s
      </text>
      <Caption text={breathing ? "垂直按压 · 呼气时下沉 1–2 mm · 吸气保持 · 松开后反应性充血" : "垂直按压 · 保持后完全松开"} />
    </>
  );
}

function Pincer({ period }: { period: number }) {
  const t = [0, 0.3, 0.6, 0.8, 1];
  return (
    <>
      <rect x={20} y={150} width={280} height={30} rx={12} fill={MUSCLE} stroke={MUSCLE_STROKE} strokeWidth={1} opacity={0.5} />
      {/* 被捏起的肌束 */}
      <motion.rect
        x={90}
        y={116}
        width={140}
        height={40}
        rx={20}
        fill={MUSCLE}
        stroke={MUSCLE_STROKE}
        strokeWidth={1.5}
        animate={{ scaleY: [1, 0.6, 0.6, 1, 1], y: [0, 2, -12, -2, 0] }}
        transition={loop(period, t)}
        style={{ transformOrigin: "160px 136px", transformBox: "view-box" }}
      />
      {/* 四指（上）与拇指（下） */}
      <motion.g animate={{ y: [0, 10, -4, -2, 0] }} transition={loop(period, t)}>
        <g transform="translate(160 118) rotate(180)">
          <Palm scale={0.9} />
        </g>
      </motion.g>
      <motion.g animate={{ y: [0, -10, -22, -8, 0] }} transition={loop(period, t)}>
        <g transform="translate(160 160) rotate(180)">
          <Thumb />
        </g>
      </motion.g>
      <Caption text="捏紧 → 提起 1 cm → 放下 · 用整个指腹 · 一拍一个周期" />
    </>
  );
}

function Strum({ period }: { period: number }) {
  const t = [0, 0.3, 0.45, 0.6, 1];
  return (
    <>
      <Tissue y={118} h={62} fibers="vertical" />
      {/* 条索（垂直于拨动方向） */}
      <path d="M160 120 Q160 150 160 178" stroke={CORAL} strokeWidth={6} strokeLinecap="round" fill="none">
        <animate
          attributeName="d"
          values="M160 120 Q160 150 160 178;M160 120 Q174 150 160 178;M160 120 Q152 150 160 178;M160 120 Q160 150 160 178;M160 120 Q160 150 160 178"
          keyTimes={t.join(";")}
          dur={`${period}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
        />
      </path>
      <motion.g animate={{ x: [-40, 8, 24, 40, -40], y: [0, 0, 0, -16, 0], opacity: [1, 1, 1, 0.8, 1] }} transition={loop(period, t)}>
        <g transform="translate(160 150) rotate(-90)">
          <Thumb />
        </g>
      </motion.g>
      <path d="M100 100 L220 100" stroke={MINT} strokeWidth={1.5} markerEnd="url(#arrowMintAnim)" fill="none" strokeDasharray="4 3" />
      <Caption text="横向拨过条索（垂直于肌纤维） · 像拨琴弦 · 快去慢回" />
    </>
  );
}

function Shear({ period }: { period: number }) {
  const t = [0, 0.5, 0.55, 1];
  return (
    <>
      {/* 深层肌肉不动 */}
      <Tissue y={140} h={40} />
      {/* 筋膜层 + 皮肤随掌根一起走 */}
      <motion.g animate={{ x: [0, 44, 44, 0] }} transition={loop(period, t)}>
        <rect x={20} y={126} width={240} height={12} rx={6} fill="rgba(246,183,60,0.25)" stroke={FASCIA} strokeWidth={1} />
        <rect x={20} y={114} width={240} height={12} rx={6} fill={SKIN} stroke={SKIN_STROKE} strokeWidth={1} />
      </motion.g>
      <motion.g animate={{ x: [0, 50, 50, 0] }} transition={loop(period, t)}>
        <g transform="translate(120 100) rotate(60)">
          <Palm />
        </g>
      </motion.g>
      {/* 剪切示意箭头 */}
      <path d="M60 70 L130 70" stroke={MINT} strokeWidth={1.5} markerEnd="url(#arrowMintAnim)" fill="none" />
      <text x={64} y={62} fontSize={10} fill={MINT}>
        皮肤 + 筋膜一起走
      </text>
      <text x={200} y={172} fontSize={10} fill="rgba(90,169,246,0.9)">
        深层不动 → 层间剪切
      </text>
      <Caption text="掌根压实 40% · 慢推 3–5 cm · 回程不离皮肤 · 0.5 Hz" />
    </>
  );
}

function Stretch({ hold, release }: { hold: number; release: number }) {
  const T = hold + release;
  const times = [0, Math.min(0.25, 3 / T), hold / T, Math.min(1, hold / T + 0.08), 1];
  const angles = [-60, -100, -100, -75, -60];
  const values = angles.map((a) => `${a} 182 146`).join(";");
  return (
    <>
      {/* 床面 */}
      <line x1={20} y1={160} x2={300} y2={160} stroke={SKIN_STROKE} strokeWidth={2} />
      {/* 仰卧者：头、躯干 */}
      <circle cx={48} cy={146} r={13} fill={SKIN} stroke={SKIN_STROKE} strokeWidth={1.5} />
      <rect x={62} y={134} width={120} height={24} rx={12} fill={SKIN} stroke={SKIN_STROKE} strokeWidth={1.5} />
      {/* 大腿 + 小腿绕髋旋转（SMIL，显式旋转中心） */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={values}
          keyTimes={times.join(";")}
          dur={`${T}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
        />
        <rect x={182} y={136} width={70} height={20} rx={10} fill={MUSCLE} stroke={MUSCLE_STROKE} strokeWidth={1.5} />
        <circle cx={182} cy={146} r={6} fill={SKIN_STROKE} />
        <g transform="translate(250 146) rotate(110)">
          <rect x={0} y={-8} width={58} height={16} rx={8} fill={MUSCLE} stroke={MUSCLE_STROKE} strokeWidth={1.5} />
        </g>
        {/* 操作者手压在膝上 */}
        <g transform="translate(256 130) rotate(-110)">
          <Palm scale={0.6} />
        </g>
      </g>
      <text x={30} y={40} fontSize={10} fill={MINT}>
        呼气 → 多弯一点 · 吸气保持
      </text>
      <Caption text={`抱膝屈髋 · 腰部"拉开"感 VAS 2–3 · 保持 ${hold}s / 放回一半 ${release}s`} />
    </>
  );
}

function Drain({ period }: { period: number }) {
  // 一趟 10 拍：从踝到腘窝下，逐拍挤压 + 上移
  const n = 10;
  const trip = period * n;
  const xs: number[] = [];
  const sx: number[] = [];
  const times: number[] = [];
  // 手的中心从踝侧 x=70 逐拍向膝侧移动到 x=240（腘窝下方停止）
  for (let i = 0; i < n; i++) {
    const base = 70 + i * 19 - 160;
    xs.push(base, base + 8);
    sx.push(1, 0.8);
    times.push((i / n) * 0.86, ((i + 0.5) / n) * 0.86);
  }
  xs.push(xs[xs.length - 1] ?? 80, 70 - 160, 70 - 160);
  sx.push(1, 1, 1);
  times.push(0.88, 0.98, 1);
  return (
    <>
      {/* 小腿（横向摆放：左踝 → 右膝） */}
      <path d="M40 120 Q120 90 220 92 Q270 94 290 110 L290 150 Q270 170 220 170 Q120 172 40 150 Z" fill={MUSCLE} stroke={MUSCLE_STROKE} strokeWidth={1.5} />
      <ellipse cx={288} cy={130} rx={18} ry={16} fill="rgba(239,90,90,0.12)" stroke={CORAL} strokeWidth={1} strokeDasharray="3 3" />
      <text x={272} y={106} fontSize={9} fill={CORAL}>
        腘窝
      </text>
      <path d="M40 120 L40 150" stroke={FASCIA} strokeWidth={6} strokeLinecap="round" />
      {/* 双手环握：上下两块 */}
      <motion.g animate={{ x: xs, scaleY: sx }} transition={{ duration: trip, repeat: Infinity, ease: "easeInOut", times }} style={{ transformOrigin: "160px 130px", transformBox: "view-box" }}>
        <rect x={130} y={78} width={60} height={36} rx={14} fill={HAND} stroke={HAND_STROKE} strokeWidth={1.5} />
        <rect x={130} y={146} width={60} height={36} rx={14} fill={HAND} stroke={HAND_STROKE} strokeWidth={1.5} />
      </motion.g>
      <path d="M60 40 L250 40" stroke={MINT} strokeWidth={1.5} markerEnd="url(#arrowMintAnim)" fill="none" />
      <text x={64} y={32} fontSize={10} fill={MINT}>
        向心：踝 → 膝（到腘窝下 3 指抬手）
      </text>
      <Caption text="每拍挤压 40% 并上移 2 cm · 一趟约 10 拍 · 中等压力不疼" />
    </>
  );
}

function Circle({ period }: { period: number }) {
  const r = 42;
  const cx = 160;
  const cy = 112;
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI + (i / 8) * Math.PI * 2; // 画面左 → 上 → 右 → 下（顺时针）
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return (
    <>
      <rect x={70} y={30} width={180} height={160} rx={30} fill={SKIN} stroke={SKIN_STROKE} strokeWidth={1.5} />
      <path d="M110 160 L110 72 Q160 84 210 72 L210 158 Q196 176 176 180" stroke={FASCIA} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
      <path d="M110 160 L110 72 Q160 84 210 72 L210 158 Q196 176 176 180" stroke={FASCIA} strokeWidth={1.2} strokeDasharray="5 4" fill="none" markerEnd="url(#arrowAmberAnim)" />
      <circle cx={cx} cy={cy} r={4} fill="none" stroke={SKIN_STROKE} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={MINT} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
      <motion.g animate={{ x: pts.map((p) => p.x - cx), y: pts.map((p) => p.y - cy) }} transition={{ duration: period, repeat: Infinity, ease: "linear" }}>
        <g transform={`translate(${cx} ${cy}) rotate(-20)`}>
          <Palm scale={0.85} />
        </g>
      </motion.g>
      <text x={262} y={60} fontSize={10} fill={FASCIA}>
        升→横→降
      </text>
      <Caption text="以脐为圆心 · 对象的顺时针 · 腹壁下陷 1–2 cm 即可 · 一圈 2 秒" />
    </>
  );
}

function Stroke({ period }: { period: number }) {
  const t = [0, 0.78, 0.82, 0.98, 1];
  return (
    <>
      {/* 背部（横放：左肩 → 右骶） */}
      <path d="M30 70 Q160 56 290 74 L290 150 Q160 166 30 152 Z" fill={SKIN} stroke={SKIN_STROKE} strokeWidth={1.5} />
      <line x1={36} y1={112} x2={286} y2={112} stroke={SKIN_STROKE} strokeWidth={1} strokeDasharray="4 4" />
      <path d="M40 96 Q160 90 282 96" stroke={MUSCLE_STROKE} strokeWidth={1} opacity={0.5} fill="none" />
      <path d="M40 128 Q160 134 282 128" stroke={MUSCLE_STROKE} strokeWidth={1} opacity={0.5} fill="none" />
      <motion.g animate={{ x: [0, 190, 190, 0, 0], y: [0, 0, -30, -30, 0], opacity: [1, 1, 0.4, 0.4, 1] }} transition={loop(period, t)}>
        <g transform="translate(70 92) rotate(90)">
          <Palm scale={0.8} />
        </g>
        <g transform="translate(70 132) rotate(90)">
          <Palm scale={0.8} />
        </g>
      </motion.g>
      <text x={36} y={46} fontSize={10} fill={MINT}>
        肩胛间 → 骶骨 · 一趟 4 秒 · 回程抬手
      </text>
      <Caption text="中等压力不疼 · 皮肤与浅筋膜一起带动 · 最后 1 分钟逐渐减轻" />
    </>
  );
}

/* ---------------- 入口 ---------------- */

const DEMO_LABEL: Record<TechniqueDemo, string> = {
  knead: "揉法 · 切向小圆周",
  press: "静态垂直按压",
  pincer: "拿法 · 捏提",
  strum: "横向弹拨",
  shear: "掌根剪切推",
  stretch: "被动牵拉",
  drain: "向心挤压引流",
  circle: "顺时针摩腹",
  stroke: "慢速轻抚",
};

export default function TechniqueAnimation({ technique }: { technique: Technique }) {
  const m = technique.mechanics;
  const period = useMemo(() => {
    if (m.mode === "holdRelease") return (m.holdSeconds ?? 45) + (m.releaseSeconds ?? 15);
    return 1 / (m.frequencyHz ?? 1);
  }, [m]);

  const body = (() => {
    switch (technique.demo) {
      case "knead":
        return <Knead period={period} depth={m.targetDepth} />;
      case "press":
        return <Press hold={m.holdSeconds ?? 45} release={m.releaseSeconds ?? 15} depth={m.targetDepth} breathing={Boolean(m.breathing)} />;
      case "pincer":
        return <Pincer period={period} />;
      case "strum":
        return <Strum period={period} />;
      case "shear":
        return <Shear period={period} />;
      case "stretch":
        return <Stretch hold={m.holdSeconds ?? 30} release={m.releaseSeconds ?? 10} />;
      case "drain":
        return <Drain period={period} />;
      case "circle":
        return <Circle period={period} />;
      case "stroke":
        return <Stroke period={period} />;
    }
  })();

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <p className="text-xs uppercase tracking-widest text-white/40">动作演示 · {DEMO_LABEL[technique.demo]}</p>
        <span className="pill text-white/60">
          {m.mode === "holdRelease" ? `周期 ${period}s` : `${(m.frequencyHz ?? 1).toFixed(2)} Hz 同步`}
        </span>
      </div>
      <svg key={technique.id} viewBox="0 0 320 200" className="h-auto w-full bg-ink-950/60" role="img" aria-label={`${technique.name} 动作演示`}>
        <defs>
          <marker id="arrowMintAnim" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill={MINT} />
          </marker>
          <marker id="arrowAmberAnim" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill={FASCIA} />
          </marker>
        </defs>
        {body}
      </svg>
    </div>
  );
}
