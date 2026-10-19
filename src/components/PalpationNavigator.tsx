"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bone, CheckCircle2, Crosshair, Hand, Layers } from "lucide-react";
import type { AnatomyLandmark, BodyView, PalpationModule } from "@/types/tuina";

interface PalpationNavigatorProps {
  module: PalpationModule;
  foundIds: string[];
  onFound: (landmarkId: string) => void;
}

const KIND_META: Record<AnatomyLandmark["kind"], { label: string; color: string; icon: typeof Bone }> = {
  bone: { label: "骨性标志", color: "#e6eaf4", icon: Bone },
  muscle: { label: "肌肉 / 肌腱", color: "#5aa9f6", icon: Layers },
  triggerPoint: { label: "激痛点", color: "#ef5a5a", icon: Crosshair },
  fascia: { label: "筋膜 / 路径", color: "#f6b73c", icon: Hand },
};

/** 简化人体轮廓（viewBox 0 0 400 600），正面 / 背面共用同一轮廓，背面叠加脊柱与肩胛线 */
function BodyOutline({ view }: { view: BodyView }) {
  return (
    <g stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} fill="rgba(255,255,255,0.03)">
      {/* 头 */}
      <ellipse cx={200} cy={52} rx={30} ry={38} />
      {/* 颈 */}
      <path d="M186 88 L186 108 L214 108 L214 88" />
      {/* 躯干 */}
      <path d="M140 112 Q200 98 260 112 L290 150 L270 160 L262 230 L262 330 Q262 352 240 356 L160 356 Q138 352 138 330 L138 230 L130 160 L110 150 Z" />
      {/* 手臂 */}
      <path d="M110 150 L84 262 L96 352 L112 352 L120 262 L138 196" />
      <path d="M290 150 L316 262 L304 352 L288 352 L280 262 L262 196" />
      {/* 腿 */}
      <path d="M160 356 L156 440 L160 560 L186 560 L194 440 L200 372" />
      <path d="M240 356 L244 440 L240 560 L214 560 L206 440 L200 372" />
      {view === "posterior" ? (
        <>
          {/* 脊柱 */}
          <path d="M200 108 L200 356" strokeDasharray="4 4" />
          {/* 肩胛骨 */}
          <path d="M232 150 L262 168 L256 215 L232 205 Z" />
          <path d="M168 150 L138 168 L144 215 L168 205 Z" />
          {/* 肩胛冈 */}
          <path d="M234 152 L290 150" />
          <path d="M166 152 L110 150" />
          {/* 髂嵴 */}
          <path d="M150 312 Q200 300 250 312" />
          {/* 腘窝 */}
          <ellipse cx={178} cy={428} rx={10} ry={8} strokeDasharray="3 3" />
          <ellipse cx={222} cy={428} rx={10} ry={8} strokeDasharray="3 3" />
          {/* 腓肠肌 */}
          <path d="M164 445 Q178 500 182 540" opacity={0.6} />
          <path d="M236 445 Q222 500 218 540" opacity={0.6} />
        </>
      ) : (
        <>
          {/* 锁骨 */}
          <path d="M150 128 Q200 140 250 128" />
          {/* 胸骨 / 肋弓 */}
          <path d="M200 130 L200 230" strokeDasharray="4 4" />
          <path d="M160 240 Q200 262 240 240" />
          {/* 脐 */}
          <circle cx={200} cy={300} r={4} />
          {/* 结肠路径（对象的右侧在画面左侧） */}
          <path d="M240 340 L240 262 Q200 250 160 262 L160 340" strokeDasharray="5 4" stroke="rgba(246,183,60,0.6)" fill="none" />
          {/* ASIS */}
          <circle cx={164} cy={338} r={3} />
          <circle cx={236} cy={338} r={3} />
        </>
      )}
    </g>
  );
}

export default function PalpationNavigator({ module, foundIds, onFound }: PalpationNavigatorProps) {
  const first = module.landmarks[0];
  const [selectedId, setSelectedId] = useState<string | null>(first ? first.id : null);
  const views: BodyView[] = Array.from(new Set(module.landmarks.map((l) => l.view)));
  const [view, setView] = useState<BodyView>(first ? first.view : "posterior");
  const selected = module.landmarks.find((l) => l.id === selectedId) ?? null;
  const visible = module.landmarks.filter((l) => l.view === view);

  const select = (l: AnatomyLandmark) => {
    setSelectedId(l.id);
    setView(l.view);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="card p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-white/40">SVG 定位图</p>
          {views.length > 1 && (
            <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 text-xs">
              {views.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-md px-2 py-1 ${view === v ? "bg-mint-400 text-ink-950" : "text-white/70"}`}
                >
                  {v === "anterior" ? "正面" : "背面"}
                </button>
              ))}
            </div>
          )}
        </div>
        <svg viewBox="0 0 400 600" className="mt-2 h-auto w-full" role="img" aria-label={`${view === "anterior" ? "正面" : "背面"}人体定位图`}>
          <BodyOutline view={view} />
          {visible.map((l) => {
            const meta = KIND_META[l.kind];
            const active = l.id === selectedId;
            const found = foundIds.includes(l.id);
            return (
              <g key={l.id} onClick={() => select(l)} className="cursor-pointer">
                {active && (
                  <circle cx={l.position.x} cy={l.position.y} r={14} fill="none" stroke={meta.color} strokeWidth={1.5} opacity={0.6}>
                    <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={l.position.x}
                  cy={l.position.y}
                  r={active ? 8 : 6}
                  fill={found ? "#4fd1b5" : meta.color}
                  stroke="#0b1020"
                  strokeWidth={2}
                />
                <text
                  x={l.position.x + 11}
                  y={l.position.y + 4}
                  fontSize={11}
                  fill={active ? "#fff" : "rgba(255,255,255,0.7)"}
                  style={{ paintOrder: "stroke", stroke: "#0b1020", strokeWidth: 3 }}
                >
                  {l.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/60">
          {(Object.keys(KIND_META) as AnatomyLandmark["kind"][]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: KIND_META[k].color }} />
              {KIND_META[k].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-mint-400" /> 已找到
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="card p-4">
          <h3 className="font-semibold">{module.title}</h3>
          <p className="mt-1 text-sm text-white/70">{module.intro}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {module.landmarks.map((l) => {
            const Icon = KIND_META[l.kind].icon;
            const found = foundIds.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => select(l)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                  l.id === selectedId ? "border-mint-400 bg-mint-400/10 text-mint-400" : "border-white/15 text-white/70 hover:bg-white/5"
                }`}
              >
                {found ? <CheckCircle2 size={13} className="text-mint-400" /> : <Icon size={13} />}
                {l.name}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill" style={{ color: KIND_META[selected.kind].color, borderColor: `${KIND_META[selected.kind].color}66` }}>
                  {KIND_META[selected.kind].label}
                </span>
                <h4 className="text-base font-semibold">{selected.name}</h4>
                <span className="text-xs italic text-white/40">{selected.latin}</span>
              </div>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-white/85">
                {selected.howToFind.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-sky-400/10 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-400">触感</p>
                  <p className="mt-1 text-white/85">{selected.feel}</p>
                </div>
                <div className="rounded-lg bg-amber-400/10 p-3 text-sm">
                  <p className="text-xs font-medium text-amber-400">常见错误</p>
                  <p className="mt-1 text-white/85">{selected.pitfalls}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-white/50">
                  已找到 {foundIds.filter((id) => module.landmarks.some((l) => l.id === id)).length} / {module.landmarks.length}
                </p>
                <button
                  type="button"
                  onClick={() => onFound(selected.id)}
                  disabled={foundIds.includes(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-3 py-1.5 text-sm font-semibold text-ink-950 hover:bg-mint-400 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> {foundIds.includes(selected.id) ? "已标记找到" : "我找到了"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-xl border border-dashed border-white/15 p-3 text-sm text-white/70">
          <p className="text-xs font-medium text-white/50">自检</p>
          <p className="mt-1">{module.selfCheck}</p>
        </div>
      </div>
    </div>
  );
}
