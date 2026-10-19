import type { Stage, StageId, StageProgressState } from "@/types/tuina";
import { STAGES, stageRequiredSeconds } from "@/data/curriculum";

export const STAGE_IDS: StageId[] = ["stage-1", "stage-2", "stage-3", "stage-4"];

export function emptyStageProgress(): StageProgressState {
  return {
    practiceSeconds: {},
    quizBestScore: 0,
    quizPassed: false,
    completedAt: null,
    literatureRead: [],
    landmarksFound: [],
  };
}

export function emptyStages(): Record<StageId, StageProgressState> {
  return {
    "stage-1": emptyStageProgress(),
    "stage-2": emptyStageProgress(),
    "stage-3": emptyStageProgress(),
    "stage-4": emptyStageProgress(),
  };
}

export function totalPracticeSeconds(p: StageProgressState): number {
  return Object.values(p.practiceSeconds).reduce((a, b) => a + b, 0);
}

/** 每个技术都达到各自 requiredSeconds 才算实操达标（防止只练一个动作刷时长） */
export function practiceRequirementMet(stage: Stage, p: StageProgressState): boolean {
  return stage.practice.techniques.every(
    (t) => (p.practiceSeconds[t.id] ?? 0) >= t.mechanics.requiredSeconds,
  );
}

export function stageCompletion(stage: Stage, p: StageProgressState): number {
  const required = stageRequiredSeconds(stage);
  const practiceRatio = required === 0 ? 1 : Math.min(1, totalPracticeSeconds(p) / required);
  const quizRatio = p.quizPassed ? 1 : 0;
  const litRatio = stage.literature.length === 0 ? 1 : p.literatureRead.length / stage.literature.length;
  const lmRatio =
    stage.palpation.landmarks.length === 0 ? 1 : p.landmarksFound.length / stage.palpation.landmarks.length;
  return Math.round((practiceRatio * 0.5 + quizRatio * 0.3 + litRatio * 0.1 + lmRatio * 0.1) * 100);
}

export function isStageUnlocked(
  stageId: StageId,
  stages: Record<StageId, StageProgressState>,
): boolean {
  const idx = STAGE_IDS.indexOf(stageId);
  if (idx <= 0) return true;
  const prevId = STAGE_IDS[idx - 1];
  if (!prevId) return true;
  return stages[prevId].completedAt !== null;
}

export function stageById(id: StageId): Stage {
  const s = STAGES.find((st) => st.id === id);
  if (!s) throw new Error(`Stage not found: ${id}`);
  return s;
}
