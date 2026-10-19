"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProgressSnapshot, SafetyGateStatus, StageId, StageProgressState } from "@/types/tuina";
import { BLOCKING_RED_FLAG_IDS } from "@/data/redFlags";
import { emptyStages, isStageUnlocked, practiceRequirementMet, stageById } from "@/lib/progress";

export type ActiveTab = "palpation" | "practice" | "literature" | "quiz";

interface SafetyState {
  status: SafetyGateStatus;
  flaggedIds: string[];
  screenedAt: string | null;
}

export interface TuinaState {
  hydrated: boolean;
  learnerId: string;
  safety: SafetyState;
  stages: Record<StageId, StageProgressState>;
  activeStageId: StageId;
  activeTab: ActiveTab;
  activeTechniqueId: string | null;
  literatureDrawerId: string | null;
  safetyModalOpen: boolean;
  /** 练功房当前会话（用于页面刷新后恢复提示） */
  practiceRunning: boolean;

  setHydrated: (v: boolean) => void;
  submitScreening: (flaggedIds: string[]) => SafetyGateStatus;
  resetScreening: () => void;
  openSafetyModal: (open: boolean) => void;
  selectStage: (id: StageId) => void;
  setActiveTab: (tab: ActiveTab) => void;
  selectTechnique: (id: string | null) => void;
  openLiterature: (id: string | null) => void;
  setPracticeRunning: (running: boolean) => void;
  addPracticeSeconds: (stageId: StageId, techniqueId: string, seconds: number) => void;
  markLandmarkFound: (stageId: StageId, landmarkId: string) => void;
  markLiteratureRead: (stageId: StageId, literatureId: string) => void;
  recordQuiz: (stageId: StageId, score: number, passScore: number) => boolean;
  resetAll: () => void;
  snapshot: () => ProgressSnapshot;
}

function newLearnerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `learner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function tryComplete(stageId: StageId, p: StageProgressState): StageProgressState {
  const stage = stageById(stageId);
  if (!p.completedAt && p.quizPassed && practiceRequirementMet(stage, p)) {
    return { ...p, completedAt: new Date().toISOString() };
  }
  return p;
}

export const useTuinaStore = create<TuinaState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      learnerId: newLearnerId(),
      safety: { status: "unscreened", flaggedIds: [], screenedAt: null },
      stages: emptyStages(),
      activeStageId: "stage-1",
      activeTab: "palpation",
      activeTechniqueId: null,
      literatureDrawerId: null,
      safetyModalOpen: false,
      practiceRunning: false,

      setHydrated: (v) => set({ hydrated: v }),

      submitScreening: (flaggedIds) => {
        const blocked = flaggedIds.some((id) => BLOCKING_RED_FLAG_IDS.has(id));
        const status: SafetyGateStatus = blocked ? "blocked" : "cleared";
        set({
          safety: { status, flaggedIds, screenedAt: new Date().toISOString() },
          practiceRunning: false,
          safetyModalOpen: blocked,
        });
        return status;
      },

      resetScreening: () =>
        set({ safety: { status: "unscreened", flaggedIds: [], screenedAt: null }, practiceRunning: false }),

      openSafetyModal: (open) => set({ safetyModalOpen: open }),

      selectStage: (id) => {
        if (!isStageUnlocked(id, get().stages)) return;
        set({ activeStageId: id, activeTechniqueId: null, activeTab: "palpation", practiceRunning: false });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      selectTechnique: (id) => set({ activeTechniqueId: id, practiceRunning: false }),
      openLiterature: (id) => set({ literatureDrawerId: id }),
      setPracticeRunning: (running) => set({ practiceRunning: running }),

      addPracticeSeconds: (stageId, techniqueId, seconds) =>
        set((state) => {
          const p = state.stages[stageId];
          const next: StageProgressState = {
            ...p,
            practiceSeconds: { ...p.practiceSeconds, [techniqueId]: (p.practiceSeconds[techniqueId] ?? 0) + seconds },
          };
          return { stages: { ...state.stages, [stageId]: tryComplete(stageId, next) } };
        }),

      markLandmarkFound: (stageId, landmarkId) =>
        set((state) => {
          const p = state.stages[stageId];
          if (p.landmarksFound.includes(landmarkId)) return {};
          return { stages: { ...state.stages, [stageId]: { ...p, landmarksFound: [...p.landmarksFound, landmarkId] } } };
        }),

      markLiteratureRead: (stageId, literatureId) =>
        set((state) => {
          const p = state.stages[stageId];
          if (p.literatureRead.includes(literatureId)) return {};
          return { stages: { ...state.stages, [stageId]: { ...p, literatureRead: [...p.literatureRead, literatureId] } } };
        }),

      recordQuiz: (stageId, score, passScore) => {
        const passed = score >= passScore;
        set((state) => {
          const p = state.stages[stageId];
          const next: StageProgressState = {
            ...p,
            quizBestScore: Math.max(p.quizBestScore, score),
            quizPassed: p.quizPassed || passed,
          };
          return { stages: { ...state.stages, [stageId]: tryComplete(stageId, next) } };
        });
        return passed;
      },

      resetAll: () =>
        set({
          safety: { status: "unscreened", flaggedIds: [], screenedAt: null },
          stages: emptyStages(),
          activeStageId: "stage-1",
          activeTab: "palpation",
          activeTechniqueId: null,
          literatureDrawerId: null,
          practiceRunning: false,
        }),

      snapshot: () => {
        const s = get();
        return { learnerId: s.learnerId, safety: { ...s.safety }, stages: s.stages };
      },
    }),
    {
      name: "evidence-tuina-progress-v1",
      storage: createJSONStorage(() => localStorage),
      /** 服务端与首次客户端渲染保持默认态，挂载后再手动 rehydrate，避免 hydration 不一致 */
      skipHydration: true,
      partialize: (s) => ({
        learnerId: s.learnerId,
        safety: s.safety,
        stages: s.stages,
        activeStageId: s.activeStageId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** 派生选择器 */
export const selectStageUnlocked = (id: StageId) => (s: TuinaState) => isStageUnlocked(id, s.stages);
export const selectGateCleared = (s: TuinaState) => s.safety.status === "cleared";
