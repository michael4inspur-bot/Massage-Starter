"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ExternalLink, FlaskConical, Lightbulb, X } from "lucide-react";
import type { LiteratureCard } from "@/types/tuina";

interface LiteratureDrawerProps {
  card: LiteratureCard | null;
  onClose: () => void;
  onRead: (id: string) => void;
}

/** 文献阅读抽屉：三层结构 💡 / 🧬 / 📄 */
export default function LiteratureDrawer({ card, onClose, onRead }: LiteratureDrawerProps) {
  useEffect(() => {
    if (!card) return;
    const t = window.setTimeout(() => onRead(card.id), 4000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [card, onClose, onRead]);

  return (
    <AnimatePresence>
      {card && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-ink-900 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            role="dialog"
            aria-label={card.title}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Bite-Sized Literature Card</p>
                <h3 className="mt-1 text-lg font-semibold">{card.title}</h3>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10" aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <section className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <Lightbulb size={16} /> 💡 小白秒懂一句话
                </p>
                <p className="mt-2 text-base leading-relaxed text-white">{card.laymanAnalogy}</p>
              </section>

              <section className="rounded-xl border border-sky-400/40 bg-sky-400/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-sky-400">
                  <FlaskConical size={16} /> 🧬 生理机制解析
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/90">{card.mechanism.explanation}</p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-black/30 p-2">
                    <dt className="font-medium text-white/60">神经纤维</dt>
                    <dd className="mt-1 space-y-0.5 text-white/85">
                      {card.mechanism.nerveFibers.map((x) => (
                        <p key={x}>{x}</p>
                      ))}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-black/30 p-2">
                    <dt className="font-medium text-white/60">感受器 / 通路</dt>
                    <dd className="mt-1 space-y-0.5 text-white/85">
                      {card.mechanism.receptors.map((x) => (
                        <p key={x}>{x}</p>
                      ))}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-black/30 p-2">
                    <dt className="font-medium text-white/60">生化 / 生理指标</dt>
                    <dd className="mt-1 space-y-0.5 text-white/85">
                      {card.mechanism.biomarkers.map((x) => (
                        <p key={x}>{x}</p>
                      ))}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen size={16} /> 📄 原始文献溯源
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  {card.citation.authors}. <em>{card.citation.title}</em>. <strong>{card.citation.journal}</strong>.{" "}
                  {card.citation.year};{card.citation.volumeIssuePages}.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {card.citation.doi && (
                    <a
                      href={`https://doi.org/${card.citation.doi}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="pill border-mint-400/40 text-mint-400 hover:bg-mint-400/10"
                    >
                      DOI {card.citation.doi} <ExternalLink size={11} />
                    </a>
                  )}
                  {card.citation.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${card.citation.pmid}/`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="pill border-sky-400/40 text-sky-400 hover:bg-sky-400/10"
                    >
                      PMID {card.citation.pmid} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <p className="mt-3 text-xs font-medium text-white/60">核心实验数据摘要</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/85">
                  {card.keyData.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-mint-400/40 bg-mint-400/10 p-4 text-sm">
                <p className="font-semibold text-mint-400">对你实操的直接指导</p>
                <p className="mt-1 text-white/90">{card.practiceImplication}</p>
              </section>
            </div>

            <div className="border-t border-white/10 p-3 text-center text-xs text-white/40">停留 4 秒自动记为已读 · Esc 关闭</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
