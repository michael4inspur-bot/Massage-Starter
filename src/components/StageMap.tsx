"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Lock, Unlock } from "lucide-react";
import type { Stage, StageId, StageProgressState } from "@/types/tuina";
import { isStageUnlocked, stageCompletion } from "@/lib/progress";

interface StageMapProps {
  stages: Stage[];
  progress: Record<StageId, StageProgressState>;
  activeStageId: StageId;
  onSelect: (id: StageId) => void;
}

/** 闯关地图：四阶段线性解锁 */
export default function StageMap({ stages, progress, activeStageId, onSelect }: StageMapProps) {
  return (
    <nav aria-label="闯关地图" className="card p-4">
      <p className="text-xs uppercase tracking-widest text-white/40">Fast-Track Curriculum</p>
      <h2 className="mt-1 text-base font-semibold">四阶闯关地图</h2>
      <ol className="mt-4 space-y-3">
        {stages.map((stage, i) => {
          const p = progress[stage.id];
          const unlocked = isStageUnlocked(stage.id, progress);
          const done = p.completedAt !== null;
          const active = stage.id === activeStageId;
          const pct = stageCompletion(stage, p);
          return (
            <li key={stage.id} className="relative">
              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[19px] top-10 h-[calc(100%-8px)] w-0.5 ${done ? "bg-mint-400/60" : "bg-white/10"}`}
                />
              )}
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onSelect(stage.id)}
                className={`relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  active ? "border-mint-400/60 bg-mint-400/10" : "border-white/10 hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    done
                      ? "border-mint-400 bg-mint-400 text-ink-950"
                      : unlocked
                        ? "border-mint-400/60 text-mint-400"
                        : "border-white/20 text-white/40"
                  }`}
                >
                  {done ? <CheckCircle2 size={18} /> : unlocked ? stage.order : <Lock size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{stage.title}</span>
                    <span className="pill text-white/50">
                      <Clock size={11} /> {stage.durationMinutes} 分钟
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/50">{stage.subtitle}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      className={`block h-full ${done ? "bg-mint-400" : "bg-amber-400"}`}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 20 }}
                    />
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
                    {done ? (
                      <>已通关 · {pct}%</>
                    ) : unlocked ? (
                      <>
                        <Unlock size={11} /> 已解锁 · 进度 {pct}%
                      </>
                    ) : (
                      <>完成上一阶段考核后解锁</>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
