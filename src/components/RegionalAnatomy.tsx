"use client";

import type { AnatomyRegion, BodyView } from "@/types/tuina";

/* ----------------------------------------------------------------------------
 * 局部解剖图（每张 viewBox 0 0 400 300）+ 全身缩略定位图
 * 只画轮廓、骨骼、肌肉与筋膜走向，不画文字——文字由 PalpationNavigator 的
 * 数字标点与选中标注负责，避免覆盖。
 * -------------------------------------------------------------------------- */

export const REGION_META: Record<
  AnatomyRegion,
  {
    label: string;
    view: BodyView;
    /** 局部图实际显示的 viewBox（裁掉空白区域，让部位尽量放大） */
    viewBox: { x: number; y: number; w: number; h: number };
    inset: { x: number; y: number; w: number; h: number };
  }
> = {
  "forearm-posterior": { label: "前臂背侧", view: "posterior", viewBox: { x: 0, y: 70, w: 400, h: 170 }, inset: { x: 268, y: 236, w: 66, h: 126 } },
  "neck-shoulder-posterior": { label: "颈肩背面", view: "posterior", viewBox: { x: 0, y: 0, w: 400, h: 232 }, inset: { x: 120, y: 84, w: 190, h: 120 } },
  "lumbar-posterior": { label: "腰骶背面", view: "posterior", viewBox: { x: 0, y: 30, w: 400, h: 270 }, inset: { x: 130, y: 236, w: 140, h: 124 } },
  "calf-posterior": { label: "小腿后侧", view: "posterior", viewBox: { x: 40, y: 0, w: 320, h: 300 }, inset: { x: 196, y: 404, w: 64, h: 164 } },
  "abdomen-anterior": { label: "腹部正面", view: "anterior", viewBox: { x: 60, y: 20, w: 280, h: 270 }, inset: { x: 132, y: 226, w: 136, h: 134 } },
};

const bone = { stroke: "rgba(230,234,244,0.55)", fill: "rgba(230,234,244,0.06)" };
const muscle = { stroke: "rgba(90,169,246,0.7)", fill: "rgba(90,169,246,0.14)" };
const fascia = { stroke: "rgba(246,183,60,0.75)", fill: "rgba(246,183,60,0.10)" };
const skin = { stroke: "rgba(255,255,255,0.35)", fill: "rgba(255,255,255,0.03)" };

function Fibers({ d, n, dx, dy, color = muscle.stroke }: { d: string; n: number; dx: number; dy: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth={0.8} opacity={0.5} fill="none">
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={d} transform={`translate(${dx * i} ${dy * i})`} />
      ))}
    </g>
  );
}

function ForearmPosterior() {
  return (
    <g>
      {/* 上臂残端 + 前臂 + 手 */}
      <path d="M0 96 L92 96 Q104 150 92 204 L0 204 Z" {...skin} strokeWidth={1.5} />
      <path d="M92 96 Q200 104 340 118 L340 182 Q200 196 92 204 Q104 150 92 96 Z" {...skin} strokeWidth={1.5} />
      <path d="M340 118 L372 112 Q400 125 400 150 Q400 175 372 188 L340 182 Z" {...skin} strokeWidth={1.5} />
      {/* 肘部骨性：鹰嘴、外上髁 */}
      <path d="M72 140 Q88 134 100 150 Q88 166 72 160 Z" {...bone} strokeWidth={1.4} />
      <circle cx={112} cy={118} r={9} {...bone} strokeWidth={1.4} />
      {/* 桡骨（上/拇指侧）与尺骨（下） */}
      <path d="M118 124 Q230 128 346 132" stroke={bone.stroke} strokeWidth={1.2} strokeDasharray="5 4" fill="none" />
      <path d="M100 156 Q230 166 346 170" stroke={bone.stroke} strokeWidth={1.2} strokeDasharray="5 4" fill="none" />
      {/* 伸肌群肌腹 */}
      <path d="M116 120 Q150 104 200 112 Q260 122 296 134 Q250 150 190 146 Q140 142 116 120 Z" {...muscle} strokeWidth={1.4} />
      <Fibers d="M124 124 Q200 118 290 136" n={4} dx={0} dy={6} />
      {/* 伸肌肌腱 */}
      <path d="M296 132 L372 136" stroke={fascia.stroke} strokeWidth={2.4} fill="none" />
      <path d="M298 138 L372 146" stroke={fascia.stroke} strokeWidth={2} fill="none" opacity={0.8} />
      <path d="M300 144 L370 156" stroke={fascia.stroke} strokeWidth={1.6} fill="none" opacity={0.6} />
      {/* 方向提示 */}
      <text x={8} y={230} fontSize={10} fill="rgba(255,255,255,0.4)">肘 ←</text>
      <text x={352} y={230} fontSize={10} fill="rgba(255,255,255,0.4)">→ 腕</text>
      <text x={120} y={92} fontSize={10} fill="rgba(255,255,255,0.4)">拇指侧（桡侧）</text>
    </g>
  );
}

function NeckShoulderPosterior() {
  return (
    <g>
      {/* 头底 / 颈 / 肩与上背 */}
      <path d="M160 0 Q200 44 240 0 Z" {...skin} strokeWidth={1.5} />
      <path d="M180 26 L180 82 L220 82 L220 26" {...skin} strokeWidth={1.5} />
      <path d="M180 82 Q110 94 56 128 L62 300 L338 300 L344 128 Q290 94 220 82 Z" {...skin} strokeWidth={1.5} />
      {/* 肩峰 */}
      <path d="M326 108 Q342 104 356 116 Q344 126 326 120 Z" {...bone} strokeWidth={1.4} />
      <path d="M74 108 Q58 104 44 116 Q56 126 74 120 Z" {...bone} strokeWidth={1.4} />
      {/* 肩胛骨 + 肩胛冈 */}
      <path d="M240 112 L330 118 L302 214 L244 204 Z" {...bone} strokeWidth={1.2} />
      <path d="M160 112 L70 118 L98 214 L156 204 Z" {...bone} strokeWidth={1.2} />
      <path d="M242 128 L332 114" stroke={bone.stroke} strokeWidth={2.2} fill="none" />
      <path d="M158 128 L68 114" stroke={bone.stroke} strokeWidth={2.2} fill="none" />
      {/* 脊柱与棘突 */}
      <path d="M200 30 L200 300" stroke={bone.stroke} strokeWidth={1} strokeDasharray="3 4" fill="none" />
      {[72, 100, 128, 156, 184, 212, 240, 268].map((y, i) => (
        <circle key={y} cx={200} cy={y} r={i === 0 ? 6 : 4} {...bone} strokeWidth={1.3} />
      ))}
      {/* 上斜方肌游离缘（C7/枕 → 肩峰） */}
      <path d="M204 60 Q252 76 334 110 Q300 128 250 110 Q218 94 204 60 Z" {...muscle} strokeWidth={1.4} />
      <path d="M196 60 Q148 76 66 110 Q100 128 150 110 Q182 94 196 60 Z" {...muscle} strokeWidth={1.4} />
      <Fibers d="M210 66 Q260 84 326 112" n={3} dx={0} dy={7} />
      {/* 紧张带（激痛点所在） */}
      <path d="M232 78 Q258 84 300 102" stroke="rgba(239,90,90,0.7)" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* 肩胛提肌：肩胛上角 → 颈上段 */}
      <path d="M240 108 L212 40" stroke={fascia.stroke} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d="M160 108 L188 40" stroke={fascia.stroke} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.35} />
      {/* 锁骨上窝禁区 */}
      <path d="M300 96 Q318 86 338 98" stroke="rgba(239,90,90,0.5)" strokeWidth={1} strokeDasharray="3 3" fill="rgba(239,90,90,0.08)" />
      <text x={296} y={82} fontSize={9} fill="rgba(239,90,90,0.7)">禁区</text>
      <text x={8} y={226} fontSize={10} fill="rgba(255,255,255,0.4)">背面观 · 右侧为对象右肩</text>
    </g>
  );
}

function LumbarPosterior() {
  return (
    <g>
      {/* 躯干下段与骨盆轮廓 */}
      <path d="M112 0 L104 220 Q140 262 200 268 Q260 262 296 220 L288 0 Z" {...skin} strokeWidth={1.5} />
      <path d="M104 220 L92 300 M296 220 L308 300" stroke={skin.stroke} strokeWidth={1.5} fill="none" />
      {/* 第 12 肋 */}
      <path d="M200 56 Q250 60 296 84" stroke={bone.stroke} strokeWidth={1.2} strokeDasharray="4 3" fill="none" />
      <path d="M200 56 Q150 60 104 84" stroke={bone.stroke} strokeWidth={1.2} strokeDasharray="4 3" fill="none" />
      {/* 脊柱 + 棘突 L1–L5 + 骶骨 */}
      <path d="M200 0 L200 260" stroke={bone.stroke} strokeWidth={1} strokeDasharray="3 4" fill="none" />
      {[100, 136, 172, 208, 240].map((y) => (
        <circle key={y} cx={200} cy={y} r={5} {...bone} strokeWidth={1.3} />
      ))}
      <path d="M176 252 L224 252 L206 296 L194 296 Z" {...bone} strokeWidth={1.2} />
      {/* 髂嵴 + 髂后上棘 */}
      <path d="M200 236 Q232 206 272 214 Q290 228 300 262" stroke={bone.stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d="M200 236 Q168 206 128 214 Q110 228 100 262" stroke={bone.stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <circle cx={230} cy={246} r={7} {...bone} strokeWidth={1.4} />
      <circle cx={170} cy={246} r={7} {...bone} strokeWidth={1.4} />
      {/* 竖脊肌双柱 */}
      <path d="M222 50 Q252 60 250 150 Q248 230 226 244 Q216 150 222 50 Z" {...muscle} strokeWidth={1.4} />
      <path d="M178 50 Q148 60 150 150 Q152 230 174 244 Q184 150 178 50 Z" {...muscle} strokeWidth={1.4} />
      <Fibers d="M230 60 Q238 150 230 236" n={3} dx={5} dy={0} />
      <Fibers d="M170 60 Q162 150 170 236" n={3} dx={-5} dy={0} />
      {/* 胸腰筋膜菱形区 */}
      <path d="M200 92 L268 176 L200 262 L132 176 Z" {...fascia} strokeWidth={1.4} strokeDasharray="6 4" />
      {/* 肾区（禁深压） */}
      <path d="M232 64 Q262 60 276 92 Q262 104 236 96 Z" stroke="rgba(239,90,90,0.5)" strokeWidth={1} strokeDasharray="3 3" fill="rgba(239,90,90,0.08)" />
      <text x={280} y={70} fontSize={9} fill="rgba(239,90,90,0.7)">肾区</text>
      <text x={8} y={292} fontSize={10} fill="rgba(255,255,255,0.4)">背面观 · 俯卧</text>
    </g>
  );
}

function CalfPosterior() {
  return (
    <g>
      {/* 大腿远端、小腿、足跟 */}
      <path d="M142 0 L258 0 L252 40 L148 40 Z" {...skin} strokeWidth={1.5} />
      <path d="M148 40 Q120 110 150 200 Q172 250 178 290 L222 290 Q228 250 250 200 Q280 110 252 40 Z" {...skin} strokeWidth={1.5} />
      {/* 腘窝（禁压区） */}
      <ellipse cx={200} cy={44} rx={26} ry={14} stroke="rgba(239,90,90,0.6)" strokeWidth={1.2} strokeDasharray="4 3" fill="rgba(239,90,90,0.1)" />
      <text x={236} y={40} fontSize={9} fill="rgba(239,90,90,0.75)">禁压</text>
      {/* 腓肠肌内外侧头 */}
      <path d="M200 60 Q162 70 158 120 Q160 160 200 176 Z" {...muscle} strokeWidth={1.4} />
      <path d="M200 60 Q238 70 242 120 Q240 160 200 176 Z" {...muscle} strokeWidth={1.4} />
      <Fibers d="M172 80 Q168 120 196 166" n={2} dx={10} dy={0} />
      <Fibers d="M228 80 Q232 120 204 166" n={2} dx={-10} dy={0} />
      {/* 比目鱼肌（深层、更宽） */}
      <path d="M156 150 Q154 200 176 230 Q200 238 224 230 Q246 200 244 150 Q222 196 200 200 Q178 196 156 150 Z" {...muscle} strokeWidth={1.2} opacity={0.6} />
      {/* 跟腱 */}
      <path d="M200 208 L200 286" stroke={fascia.stroke} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.8} />
      {/* 引流方向 */}
      <path d="M300 250 L300 70" stroke="rgba(79,209,181,0.6)" strokeWidth={1.5} fill="none" markerEnd="url(#arrowMint)" />
      <text x={306} y={160} fontSize={10} fill="rgba(79,209,181,0.8)">向心</text>
      <text x={48} y={292} fontSize={10} fill="rgba(255,255,255,0.4)">后面观 · 俯卧</text>
    </g>
  );
}

function AbdomenAnterior() {
  return (
    <g>
      {/* 躯干 */}
      <path d="M118 0 L108 300 L292 300 L282 0 Z" {...skin} strokeWidth={1.5} />
      {/* 肋弓 */}
      <path d="M200 40 Q168 48 134 100" stroke={bone.stroke} strokeWidth={1.4} fill="none" />
      <path d="M200 40 Q232 48 266 100" stroke={bone.stroke} strokeWidth={1.4} fill="none" />
      {/* 髂前上棘 */}
      <circle cx={118} cy={222} r={6} {...bone} strokeWidth={1.4} />
      <circle cx={282} cy={222} r={6} {...bone} strokeWidth={1.4} />
      {/* 结肠：升（画面左 = 对象右）→ 横 → 降 → 乙状 */}
      <path
        d="M132 226 L132 116 Q200 134 268 116 L268 220 Q252 246 230 252"
        stroke={fascia.stroke}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.35}
      />
      <path
        d="M132 226 L132 116 Q200 134 268 116 L268 220 Q252 246 230 252"
        stroke={fascia.stroke}
        strokeWidth={1.4}
        strokeDasharray="6 4"
        fill="none"
        markerEnd="url(#arrowAmber)"
      />
      {/* 脐 + 顺时针圆 */}
      <circle cx={200} cy={150} r={5} {...bone} strokeWidth={1.4} />
      <circle cx={200} cy={158} r={54} stroke="rgba(79,209,181,0.45)" strokeWidth={1} strokeDasharray="3 4" fill="none" />
      <text x={68} y={284} fontSize={10} fill="rgba(255,255,255,0.4)">正面观 · 仰卧屈膝 · 画面左 = 对象右侧</text>
    </g>
  );
}

export function RegionalAnatomyScene({ region }: { region: AnatomyRegion }) {
  return (
    <>
      <defs>
        <marker id="arrowMint" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="rgba(79,209,181,0.8)" />
        </marker>
        <marker id="arrowAmber" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="rgba(246,183,60,0.9)" />
        </marker>
      </defs>
      {region === "forearm-posterior" && <ForearmPosterior />}
      {region === "neck-shoulder-posterior" && <NeckShoulderPosterior />}
      {region === "lumbar-posterior" && <LumbarPosterior />}
      {region === "calf-posterior" && <CalfPosterior />}
      {region === "abdomen-anterior" && <AbdomenAnterior />}
    </>
  );
}

/** 全身缩略图（viewBox 0 0 400 600），高亮当前局部图所在范围 */
export function BodyInset({ region }: { region: AnatomyRegion }) {
  const meta = REGION_META[region];
  const r = meta.inset;
  return (
    <svg viewBox="0 0 400 600" className="h-full w-auto" aria-hidden>
      <g stroke="rgba(255,255,255,0.4)" strokeWidth={4} fill="rgba(255,255,255,0.05)">
        <ellipse cx={200} cy={52} rx={30} ry={38} />
        <path d="M186 88 L186 108 L214 108 L214 88" />
        <path d="M140 112 Q200 98 260 112 L290 150 L270 160 L262 230 L262 330 Q262 352 240 356 L160 356 Q138 352 138 330 L138 230 L130 160 L110 150 Z" />
        <path d="M110 150 L84 262 L96 352 L112 352 L120 262 L138 196" />
        <path d="M290 150 L316 262 L304 352 L288 352 L280 262 L262 196" />
        <path d="M160 356 L156 440 L160 560 L186 560 L194 440 L200 372" />
        <path d="M240 356 L244 440 L240 560 L214 560 L206 440 L200 372" />
        {meta.view === "posterior" && <path d="M200 108 L200 356" strokeDasharray="8 8" />}
      </g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} fill="rgba(79,209,181,0.18)" stroke="#4fd1b5" strokeWidth={6} />
      <text x={200} y={592} fontSize={34} textAnchor="middle" fill="rgba(255,255,255,0.6)">
        {meta.view === "anterior" ? "正面" : "背面"}
      </text>
    </svg>
  );
}
