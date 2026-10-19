"use client";

import { useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  BookOpen,
  Ban,
  ClipboardCheck,
  Crosshair,
  FlaskConical,
  Hand,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { CURRICULUM, STAGES, getLiterature } from "@/data/curriculum";
import { RED_FLAGS } from "@/data/redFlags";
import { stageById } from "@/lib/progress";
import { useProgressSync } from "@/store/useProgressSync";
import { useTuinaStore, type ActiveTab } from "@/store/useTuinaStore";
import type { StageId, Technique } from "@/types/tuina";
import PracticeMetronome from "@/components/PracticeMetronome";
import SafetyGate from "@/components/SafetyGate";
import StageMap from "@/components/StageMap";
import PalpationNavigator from "@/components/PalpationNavigator";
import LiteratureDrawer from "@/components/LiteratureDrawer";
import CheckpointQuiz from "@/components/CheckpointQuiz";

const TABS: { id: ActiveTab; label: string; tag: string; icon: typeof Hand }[] = [
  { id: "palpation", label: "触诊导航", tag: "模块 A", icon: Crosshair },
  { id: "practice", label: "量化练功房", tag: "模块 B", icon: Activity },
  { id: "literature", label: "机制文献", tag: "模块 C", icon: BookOpen },
  { id: "quiz", label: "通关自测", tag: "模块 D", icon: ClipboardCheck },
];

export default function HomePage() {
  useProgressSync();

  const hydrated = useTuinaStore((s) => s.hydrated);
  const learnerId = useTuinaStore((s) => s.learnerId);
  const safety = useTuinaStore((s) => s.safety);
  const stagesProgress = useTuinaStore((s) => s.stages);
  const activeStageId = useTuinaStore((s) => s.activeStageId);
  const activeTab = useTuinaStore((s) => s.activeTab);
  const activeTechniqueId = useTuinaStore((s) => s.activeTechniqueId);
  const literatureDrawerId = useTuinaStore((s) => s.literatureDrawerId);
  const safetyModalOpen = useTuinaStore((s) => s.safetyModalOpen);

  const submitScreening = useTuinaStore((s) => s.submitScreening);
  const resetScreening = useTuinaStore((s) => s.resetScreening);
  const openSafetyModal = useTuinaStore((s) => s.openSafetyModal);
  const selectStage = useTuinaStore((s) => s.selectStage);
  const setActiveTab = useTuinaStore((s) => s.setActiveTab);
  const selectTechnique = useTuinaStore((s) => s.selectTechnique);
  const openLiterature = useTuinaStore((s) => s.openLiterature);
  const addPracticeSeconds = useTuinaStore((s) => s.addPracticeSeconds);
  const markLandmarkFound = useTuinaStore((s) => s.markLandmarkFound);
  const markLiteratureRead = useTuinaStore((s) => s.markLiteratureRead);
  const recordQuiz = useTuinaStore((s) => s.recordQuiz);
  const setPracticeRunning = useTuinaStore((s) => s.setPracticeRunning);
  const resetAll = useTuinaStore((s) => s.resetAll);

  const stage = useMemo(() => stageById(activeStageId), [activeStageId]);
  const progress = stagesProgress[activeStageId];
  const gateCleared = safety.status === "cleared";
  const gateBlocked = safety.status === "blocked";

  const technique: Technique | null = useMemo(() => {
    const list = stage.practice.techniques;
    return list.find((t) => t.id === activeTechniqueId) ?? list[0] ?? null;
  }, [activeTechniqueId, stage]);

  const drawerCard = literatureDrawerId ? (getLiterature(literatureDrawerId) ?? null) : null;

  // 挂载后从 localStorage 恢复进度（persist.skipHydration）
  useEffect(() => {
    void useTuinaStore.persist.rehydrate();
  }, []);

  // 首次进入（未筛查）自动弹出门禁
  useEffect(() => {
    if (hydrated && safety.status === "unscreened") openSafetyModal(true);
  }, [hydrated, safety.status, openSafetyModal]);

  const handleSecondTick = useCallback(
    (sec: number) => {
      if (technique) addPracticeSeconds(stage.id, technique.id, sec);
    },
    [addPracticeSeconds, stage.id, technique],
  );

  const handleSessionEnd = useCallback(
    (sessionSeconds: number) => {
      if (!technique) return;
      fetch("/api/progress/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          stageId: stage.id,
          techniqueId: technique.id,
          seconds: sessionSeconds,
          frequencyHz: technique.mechanics.frequencyHz,
          holdSeconds: technique.mechanics.holdSeconds,
        }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [learnerId, stage.id, technique],
  );

  const handleQuizSubmit = useCallback((score: number) => recordQuiz(stage.id, score, stage.quiz.passScore), [recordQuiz, stage]);

  const flaggedItems = RED_FLAGS.filter((f) => safety.flaggedIds.includes(f.id) && f.severity === "block");
  const completedCount = STAGES.filter((s) => stagesProgress[s.id].completedAt !== null).length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-5 sm:px-6">
      {/* 顶栏 */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-400/15 text-mint-400">
            <Hand size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{CURRICULUM.title}</h1>
            <p className="text-xs text-white/50">{CURRICULUM.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill text-white/60">
            <Sparkles size={12} /> 已通关 {completedCount} / {STAGES.length}
          </span>
          <button
            type="button"
            onClick={() => openSafetyModal(true)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium ${
              gateCleared
                ? "border-mint-400/50 text-mint-400"
                : gateBlocked
                  ? "border-coral-500/60 bg-coral-500/10 text-coral-500"
                  : "border-amber-400/60 bg-amber-400/10 text-amber-400"
            }`}
          >
            {gateCleared ? <ShieldCheck size={16} /> : gateBlocked ? <ShieldAlert size={16} /> : <ShieldQuestion size={16} />}
            {gateCleared ? "安全门禁：已通过" : gateBlocked ? "安全门禁：已阻断" : "安全门禁：未筛查"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("清空全部进度（含筛查状态）？此操作不可恢复。")) resetAll();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5"
            title="重置进度"
          >
            <RotateCcw size={13} /> 重置
          </button>
        </div>
      </header>

      {/* 阻断横幅 */}
      <AnimatePresence>
        {gateBlocked && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-2xl border-2 border-coral-500/70 bg-coral-500/10 p-4"
            role="alert"
          >
            <div className="flex items-center gap-2 text-coral-500">
              <AlertOctagon />
              <p className="font-bold">红色阻断：检测到高危症状，实操面板已锁死</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-white/85">
              {flaggedItems.map((f) => (
                <li key={f.id}>
                  <span className="text-white">{f.question}</span>
                  <span className="text-amber-400"> → {f.referral}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/60">你仍可以学习触诊定位与文献卡片，但练功房与通关考核在转诊评估前不可用。</p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 主体：左地图 / 右阶段面板 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <StageMap stages={STAGES} progress={stagesProgress} activeStageId={activeStageId} onSelect={(id: StageId) => selectStage(id)} />
          <div className="card p-4 text-xs text-white/60">
            <p className="font-semibold text-white/80">科学闭环</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>解剖定位：先找骨性标志，再找肌肉与激痛点</li>
              <li>安全筛查：红旗征任一项即阻断</li>
              <li>物理参数化实操：频率 / 深度 / VAS / 呼吸</li>
              <li>机制文献内化：每个动作绑定真实顶级文献</li>
            </ol>
            <p className="mt-3 text-[11px] text-white/40">本应用为教学辅助，不替代医疗诊断。学员 ID {hydrated ? learnerId.slice(0, 8) : "········"}</p>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          {/* 阶段头 */}
          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Stage {stage.order} · {stage.durationMinutes} 分钟</p>
                <h2 className="mt-1 text-2xl font-bold">{stage.title}</h2>
                <p className="text-sm text-white/60">{stage.subtitle}</p>
              </div>
              {progress.completedAt && (
                <span className="pill border-mint-400/50 text-mint-400">已通关 · {new Date(progress.completedAt).toLocaleDateString("zh-CN")}</span>
              )}
            </div>
            <ul className="mt-3 grid gap-1.5 text-sm text-white/80 sm:grid-cols-2">
              {stage.goals.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />
                  {g}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Ban size={13} className="text-coral-500" />
              <span className="text-white/60">本阶段禁止：</span>
              {stage.practice.forbidden.map((f) => (
                <span key={f} className="pill border-coral-500/30 text-coral-500/90">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* 标签页 */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    active ? "bg-mint-400 font-semibold text-ink-950" : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon size={15} />
                  <span className="whitespace-nowrap">
                    <span className="mr-1 text-[10px] opacity-70">{t.tag}</span>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${stage.id}-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "palpation" && (
                <PalpationNavigator
                  module={stage.palpation}
                  foundIds={progress.landmarksFound}
                  onFound={(id) => markLandmarkFound(stage.id, id)}
                />
              )}

              {activeTab === "practice" && technique && (
                <div className="space-y-4">
                  {/* 技术选择 */}
                  <div className="flex flex-wrap gap-2">
                    {stage.practice.techniques.map((t) => {
                      const done = (progress.practiceSeconds[t.id] ?? 0) >= t.mechanics.requiredSeconds;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectTechnique(t.id)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm ${
                            technique.id === t.id ? "border-mint-400 bg-mint-400/10 text-mint-400" : "border-white/15 text-white/75 hover:bg-white/5"
                          }`}
                        >
                          <span className="block font-medium">{t.name}</span>
                          <span className="block text-[11px] opacity-70">
                            {t.mechanics.mode === "holdRelease"
                              ? `Hold ${t.mechanics.holdSeconds}s / Release ${t.mechanics.releaseSeconds}s`
                              : `${t.mechanics.frequencyHz?.toFixed(2)} Hz`}
                            {done ? " · 已达标" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="card p-4">
                    <p className="text-sm text-white/80">{stage.practice.intro}</p>
                    <p className="mt-2 text-sm text-white/90">{technique.summary}</p>
                  </div>

                  {!gateCleared && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-400">
                      <ShieldQuestion size={16} />
                      练功房需先通过红旗征筛查。
                      <button type="button" onClick={() => openSafetyModal(true)} className="underline">
                        去筛查
                      </button>
                    </div>
                  )}

                  <PracticeMetronome
                    technique={technique}
                    accumulatedSeconds={progress.practiceSeconds[technique.id] ?? 0}
                    locked={!gateCleared}
                    onSecondTick={handleSecondTick}
                    onSessionEnd={handleSessionEnd}
                    onRunningChange={setPracticeRunning}
                  />

                  <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                    <div className="card p-4">
                      <p className="text-xs uppercase tracking-widest text-white/40">执行步骤</p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/85">
                        {technique.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                      <p className="mt-3 text-xs font-medium text-white/50">手部姿势</p>
                      <p className="text-sm text-white/80">{technique.handPosition}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-coral-500/40 bg-coral-500/10 p-3">
                        <p className="text-xs font-semibold text-coral-500">做错的信号（立即停止）</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/85">
                          {technique.stopSignals.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="card p-3">
                        <p className="flex items-center gap-1 text-xs font-semibold text-white/60">
                          <FlaskConical size={13} /> 本动作的文献依据
                        </p>
                        <ul className="mt-2 space-y-1">
                          {technique.literatureIds.map((id) => {
                            const c = getLiterature(id);
                            if (!c) return null;
                            return (
                              <li key={id}>
                                <button
                                  type="button"
                                  onClick={() => openLiterature(id)}
                                  className="w-full rounded-lg border border-white/10 p-2 text-left text-xs hover:bg-white/5"
                                >
                                  <span className="block font-medium text-white/90">{c.title}</span>
                                  <span className="block text-white/50">
                                    {c.citation.authors.split(",")[0]} · {c.citation.journal} {c.citation.year}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "literature" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {stage.literature.map((c) => {
                    const read = progress.literatureRead.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openLiterature(c.id)}
                        className={`card p-4 text-left transition hover:bg-white/[0.07] ${read ? "border-mint-400/40" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="pill text-white/60">
                            {c.citation.journal} · {c.citation.year}
                          </span>
                          {read && <span className="pill border-mint-400/40 text-mint-400">已读</span>}
                        </div>
                        <h3 className="mt-2 font-semibold">{c.title}</h3>
                        <p className="mt-1 line-clamp-3 text-sm text-white/70">💡 {c.laymanAnalogy}</p>
                        <p className="mt-2 text-xs text-white/40">{c.citation.authors.split(",")[0]} et al.</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "quiz" && (
                <div className="space-y-4">
                  {!gateCleared && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-400">
                      <ShieldQuestion size={16} /> 通关考核包含实操时长校验，需先通过红旗征筛查并完成练功。
                    </div>
                  )}
                  <CheckpointQuiz
                    stage={stage}
                    quiz={stage.quiz}
                    progress={progress}
                    isLast={stage.order === 4}
                    onSubmit={handleQuizSubmit}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* 弹层 */}
      <SafetyGate
        key={`gate-${safety.screenedAt ?? "none"}`}
        open={safetyModalOpen}
        status={safety.status}
        previouslyFlagged={safety.flaggedIds}
        highlightIds={stage.relevantRedFlagIds}
        onClose={() => openSafetyModal(false)}
        onSubmit={(ids) => {
          const st = submitScreening(ids);
          if (st === "cleared") openSafetyModal(false);
        }}
        onReset={resetScreening}
      />
      <LiteratureDrawer
        card={drawerCard}
        onClose={() => openLiterature(null)}
        onRead={(id) => markLiteratureRead(stage.id, id)}
      />
    </main>
  );
}
