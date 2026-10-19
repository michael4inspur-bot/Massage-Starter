"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Lock, Timer, XCircle } from "lucide-react";
import type { CheckpointQuiz as Quiz, Stage, StageProgressState } from "@/types/tuina";
import { practiceRequirementMet, totalPracticeSeconds } from "@/lib/progress";

interface CheckpointQuizProps {
  stage: Stage;
  quiz: Quiz;
  progress: StageProgressState;
  isLast: boolean;
  onSubmit: (score: number) => boolean;
}

export default function CheckpointQuiz({ stage, quiz, progress, isLast, onSubmit }: CheckpointQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const practiceOk = practiceRequirementMet(stage, progress);
  const practiced = totalPracticeSeconds(progress);
  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  const perTechnique = useMemo(
    () =>
      stage.practice.techniques.map((t) => ({
        id: t.id,
        name: t.name,
        done: progress.practiceSeconds[t.id] ?? 0,
        need: t.mechanics.requiredSeconds,
      })),
    [progress.practiceSeconds, stage.practice.techniques],
  );

  const submit = () => {
    const score = quiz.questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    const passed = onSubmit(score);
    setResult({ score, passed });
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* 实操时长校验 */}
      <div className={`card p-4 ${practiceOk ? "border-mint-400/40" : "border-amber-400/40"}`}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Timer size={16} className={practiceOk ? "text-mint-400" : "text-amber-400"} />
          实操时长达标校验 · 累计 {fmt(practiced)} / {fmt(quiz.requiredPracticeSeconds)}
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {perTechnique.map((t) => {
            const ok = t.done >= t.need;
            return (
              <li key={t.id} className="rounded-lg bg-black/30 p-2 text-xs">
                <p className="flex items-center gap-1 text-white/80">
                  {ok ? <CheckCircle2 size={13} className="text-mint-400" /> : <XCircle size={13} className="text-amber-400" />}
                  <span className="truncate">{t.name}</span>
                </p>
                <p className="mt-1 tabular-nums text-white/50">
                  {fmt(Math.min(t.done, t.need))} / {fmt(t.need)}
                </p>
              </li>
            );
          })}
        </ul>
        {!practiceOk && <p className="mt-2 text-xs text-amber-400">每个手法都要练到各自达标时长，才能提交通关考核。</p>}
      </div>

      {/* 题目 */}
      <ol className="space-y-3">
        {quiz.questions.map((q, i) => {
          const chosen = answers[q.id];
          const showResult = result !== null;
          return (
            <li key={q.id} className="card p-4">
              <p className="text-xs uppercase tracking-widest text-white/40">场景 {i + 1}</p>
              <p className="mt-1 text-sm text-white/80">{q.scenario}</p>
              <p className="mt-2 font-semibold">{q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const isChosen = chosen === o.id;
                  const isCorrect = o.id === q.correctOptionId;
                  let cls = "border-white/10 hover:bg-white/5";
                  if (showResult) {
                    if (isCorrect) cls = "border-mint-400/70 bg-mint-400/10";
                    else if (isChosen) cls = "border-coral-500/70 bg-coral-500/10";
                  } else if (isChosen) cls = "border-mint-400/60 bg-mint-400/10";
                  return (
                    <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${cls}`}>
                      <input
                        type="radio"
                        name={q.id}
                        className="mt-0.5 accent-mint-400"
                        disabled={showResult}
                        checked={isChosen}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      />
                      <span>{o.text}</span>
                    </label>
                  );
                })}
              </div>
              {showResult && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg bg-black/30 p-3 text-sm text-white/85">
                  <span className={chosen === q.correctOptionId ? "text-mint-400" : "text-coral-500"}>
                    {chosen === q.correctOptionId ? "正确。" : "不正确。"}
                  </span>{" "}
                  {q.explanation}
                </motion.p>
              )}
            </li>
          );
        })}
      </ol>

      {/* 提交 / 结果 */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-white/70">
          需答对 {quiz.passScore} / {quiz.questions.length} 题 · 历史最佳 {progress.quizBestScore} 题
          {progress.quizPassed && <span className="ml-2 text-mint-400">已通过考核</span>}
        </div>
        {result === null ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || !practiceOk}
            className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-mint-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {practiceOk ? <Award size={16} /> : <Lock size={16} />}
            提交通关考核
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className={`font-semibold ${result.passed ? "text-mint-400" : "text-coral-500"}`}>
              {result.passed
                ? isLast
                  ? `通关！${result.score}/${quiz.questions.length} · 四阶段课程全部完成`
                  : `通关！${result.score}/${quiz.questions.length} · 下一阶段已解锁`
                : `未通过：${result.score}/${quiz.questions.length}，回看文献卡片后再试`}
            </p>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setResult(null);
              }}
              className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              重做
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
