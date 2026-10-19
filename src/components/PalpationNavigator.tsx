"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bone, CheckCircle2, Crosshair, Hand, Layers } from "lucide-react";
import type { AnatomyLandmark, AnatomyRegion, PalpationModule } from "@/types/tuina";
import { BodyInset, REGION_META, RegionalAnatomyScene } from "@/components/RegionalAnatomy";

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

/** 选中标注：固定在画面左上角的标签条 + 引线指向标点，永远不会盖住其他标点 */
function Callout({ landmark, index, origin }: { landmark: AnatomyLandmark; index: number; origin: { x: number; y: number } }) {
  const { x, y } = landmark.position;
  const color = KIND_META[landmark.kind].color;
  const label = `${index} ${landmark.name}`;
  const w = Math.min(230, label.length * 12 + 22);
  const h = 26;
  const bx = origin.x + 8;
  const by = origin.y + 8;
  const ax = Math.max(bx + 8, Math.min(bx + w - 8, x));
  return (
    <g pointerEvents="none">
      <line x1={ax} y1={by + h} x2={x} y2={y} stroke={color} strokeWidth={1.2} strokeDasharray="3 2" />
      <rect x={bx} y={by} width={w} height={h} rx={6} fill="#0b1020" stroke={color} strokeWidth={1.2} />
      <text x={bx + 10} y={by + 17} fontSize={12} fontWeight={600} fill="#fff">
        {label}
      </text>
    </g>
  );
}

export default function PalpationNavigator({ module, foundIds, onFound }: PalpationNavigatorProps) {
  const first = module.landmarks[0];
  const [selectedId, setSelectedId] = useState<string | null>(first ? first.id : null);
  const [region, setRegion] = useState<AnatomyRegion>(first ? first.region : (module.regions[0] ?? "forearm-posterior"));
  const selected = module.landmarks.find((l) => l.id === selectedId) ?? null;
  const visible = module.landmarks.filter((l) => l.region === region);
  const indexOf = (l: AnatomyLandmark) => module.landmarks.indexOf(l) + 1;

  const select = (l: AnatomyLandmark) => {
    setSelectedId(l.id);
    setRegion(l.region);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="card p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-white/40">局部定位图 · {REGION_META[region].label}</p>
          {module.regions.length > 1 && (
            <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 text-xs">
              {module.regions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRegion(r);
                    const firstInRegion = module.landmarks.find((l) => l.region === r);
                    if (firstInRegion) setSelectedId(firstInRegion.id);
                  }}
                  className={`rounded-md px-2 py-1 ${region === r ? "bg-mint-400 text-ink-950" : "text-white/70"}`}
                >
                  {REGION_META[r].label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-950/60">
          <svg
            viewBox={`${REGION_META[region].viewBox.x} ${REGION_META[region].viewBox.y} ${REGION_META[region].viewBox.w} ${REGION_META[region].viewBox.h}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${REGION_META[region].label}局部解剖定位图`}
          >
            <RegionalAnatomyScene region={region} />
            {visible.map((l) => {
              const meta = KIND_META[l.kind];
              const active = l.id === selectedId;
              const found = foundIds.includes(l.id);
              const n = indexOf(l);
              return (
                <g key={l.id} onClick={() => select(l)} className="cursor-pointer">
                  {active && (
                    <circle cx={l.position.x} cy={l.position.y} r={14} fill="none" stroke={meta.color} strokeWidth={1.5}>
                      <animate attributeName="r" values="11;20;11" dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={l.position.x}
                    cy={l.position.y}
                    r={active ? 10 : 8}
                    fill={meta.color}
                    stroke={found ? "#4fd1b5" : "#0b1020"}
                    strokeWidth={found ? 3 : 2}
                  />
                  <text
                    x={l.position.x}
                    y={l.position.y + 4}
                    fontSize={11}
                    fontWeight={700}
                    textAnchor="middle"
                    fill={l.kind === "bone" ? "#0b1020" : "#fff"}
                    pointerEvents="none"
                  >
                    {n}
                  </text>
                </g>
              );
            })}
            {selected && selected.region === region && (
              <Callout landmark={selected} index={indexOf(selected)} origin={{ x: REGION_META[region].viewBox.x, y: REGION_META[region].viewBox.y }} />
            )}
          </svg>
          {/* 全身缩略定位 */}
          <div className="absolute right-2 top-2 h-24 rounded-lg border border-white/10 bg-ink-900/80 p-1">
            <BodyInset region={region} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60">
          {(Object.keys(KIND_META) as AnatomyLandmark["kind"][]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: KIND_META[k].color }} />
              {KIND_META[k].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-mint-400" /> 已找到
          </span>
          <span className="text-white/40">点击数字标点查看找法</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="card p-4">
          <h3 className="font-semibold">{module.title}</h3>
          <p className="mt-1 text-sm text-white/70">{module.intro}</p>
        </div>

        <ol className="flex flex-wrap gap-2">
          {module.landmarks.map((l, i) => {
            const Icon = KIND_META[l.kind].icon;
            const found = foundIds.includes(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => select(l)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                    l.id === selectedId ? "border-mint-400 bg-mint-400/10 text-mint-400" : "border-white/15 text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span className="font-bold">{i + 1}</span>
                  {found ? <CheckCircle2 size={13} className="text-mint-400" /> : <Icon size={13} />}
                  {l.name}
                </button>
              </li>
            );
          })}
        </ol>

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
                <h4 className="text-base font-semibold">
                  {indexOf(selected)}. {selected.name}
                </h4>
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
