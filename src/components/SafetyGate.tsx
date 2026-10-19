"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, CheckCircle2, ShieldAlert, ShieldCheck, Stethoscope, X } from "lucide-react";
import { RED_FLAGS } from "@/data/redFlags";
import type { RedFlagItem, SafetyGateStatus } from "@/types/tuina";

interface SafetyGateProps {
  open: boolean;
  status: SafetyGateStatus;
  previouslyFlagged: string[];
  highlightIds: string[];
  onClose: () => void;
  onSubmit: (flaggedIds: string[]) => void;
  onReset: () => void;
}

const CATEGORY_LABEL: Record<RedFlagItem["category"], string> = {
  trauma: "外伤 / 骨骼",
  neuro: "神经",
  vascular: "血管",
  systemic: "全身性",
  visceral: "内脏",
  skin: "皮肤",
  general: "一般注意",
};

/**
 * 红旗征安全门禁（状态机：unscreened -> cleared | blocked）
 * 任一 severity=block 的条目被勾选 => 立即阻断并显示转诊建议。
 */
export default function SafetyGate({ open, status, previouslyFlagged, highlightIds, onClose, onSubmit, onReset }: SafetyGateProps) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(previouslyFlagged));

  const blockingChecked = useMemo(
    () => RED_FLAGS.filter((f) => f.severity === "block" && checked.has(f.id)),
    [checked],
  );
  const cautionChecked = useMemo(
    () => RED_FLAGS.filter((f) => f.severity === "caution" && checked.has(f.id)),
    [checked],
  );
  const liveBlocked = blockingChecked.length > 0;

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="临床红旗征筛查"
        >
          <motion.div
            className={`card max-h-[92vh] w-full max-w-3xl overflow-hidden border-2 ${
              liveBlocked ? "border-coral-500/70" : "border-white/10"
            } bg-ink-900`}
            initial={{ y: 40, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.98 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {liveBlocked ? (
                  <ShieldAlert className="mt-0.5 shrink-0 text-coral-500" />
                ) : (
                  <ShieldCheck className="mt-0.5 shrink-0 text-mint-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold">临床红旗征筛查清单</h2>
                  <p className="text-sm text-white/60">
                    进入任何实操前必须完成。对<strong>被操作者</strong>逐条确认；只要有一项高危症状，系统将锁定实操面板。
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10" aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-5">
              {/* 阻断警告 */}
              <AnimatePresence>
                {liveBlocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden rounded-xl border border-coral-500/60 bg-coral-500/10 p-4"
                  >
                    <div className="flex items-center gap-2 text-coral-500">
                      <AlertOctagon />
                      <p className="font-bold">红色阻断：禁止实操，建议转诊</p>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {blockingChecked.map((f) => (
                        <li key={f.id} className="rounded-lg bg-black/30 p-3">
                          <p className="font-medium text-white">{f.question}</p>
                          <p className="mt-1 text-white/70">{f.rationale}</p>
                          <p className="mt-1 flex items-start gap-1 text-amber-400">
                            <Stethoscope size={14} className="mt-0.5 shrink-0" />
                            <span>{f.referral}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <ul className="space-y-2">
                {RED_FLAGS.map((f) => {
                  const on = checked.has(f.id);
                  const hl = highlightIds.includes(f.id);
                  return (
                    <li key={f.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          on
                            ? f.severity === "block"
                              ? "border-coral-500/70 bg-coral-500/10"
                              : "border-amber-400/60 bg-amber-400/10"
                            : hl
                              ? "border-sky-400/40 bg-sky-400/5 hover:bg-white/5"
                              : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-coral-500"
                          checked={on}
                          onChange={() => toggle(f.id)}
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="pill text-white/60">{CATEGORY_LABEL[f.category]}</span>
                            {f.severity === "block" ? (
                              <span className="pill border-coral-500/40 text-coral-500">勾选即阻断</span>
                            ) : (
                              <span className="pill border-amber-400/40 text-amber-400">提示</span>
                            )}
                            {hl && <span className="pill border-sky-400/40 text-sky-400">本阶段重点</span>}
                          </div>
                          <p className="mt-1 text-sm text-white">{f.question}</p>
                          <p className="mt-0.5 text-xs text-white/50">{f.rationale}</p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {cautionChecked.length > 0 && !liveBlocked && (
                <div className="mt-4 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm">
                  <p className="font-medium text-amber-400">注意事项（不阻断）</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-white/80">
                    {cautionChecked.map((f) => (
                      <li key={f.id}>{f.referral}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 p-4 sm:p-5">
              <p className="text-xs text-white/50">
                当前状态：
                {status === "cleared" && <span className="text-mint-400"> 已通过</span>}
                {status === "blocked" && <span className="text-coral-500"> 已阻断</span>}
                {status === "unscreened" && <span className="text-amber-400"> 未筛查</span>}
              </p>
              <div className="flex gap-2">
                {status !== "unscreened" && (
                  <button
                    type="button"
                    onClick={() => {
                      setChecked(new Set());
                      onReset();
                    }}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    重新筛查
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSubmit(Array.from(checked))}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                    liveBlocked ? "bg-coral-500 text-white hover:bg-coral-500/90" : "bg-mint-500 text-ink-950 hover:bg-mint-400"
                  }`}
                >
                  {liveBlocked ? (
                    <>
                      <AlertOctagon size={16} /> 确认阻断并锁定实操
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> 确认无红旗征，解锁实操
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
