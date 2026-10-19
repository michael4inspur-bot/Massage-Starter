import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProgressSnapshot, StageId } from "@/types/tuina";
import { STAGE_IDS, totalPracticeSeconds } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSnapshot(x: unknown): x is ProgressSnapshot {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.learnerId !== "string" || o.learnerId.length < 8 || o.learnerId.length > 64) return false;
  if (typeof o.safety !== "object" || o.safety === null) return false;
  if (typeof o.stages !== "object" || o.stages === null) return false;
  return STAGE_IDS.every((id) => typeof (o.stages as Record<string, unknown>)[id] === "object");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const learnerId = url.searchParams.get("learnerId");
  if (!learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });
  try {
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        stageProgress: true,
        screenings: { orderBy: { createdAt: "desc" }, take: 1 },
        practiceLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!learner) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, learner });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable", detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!isSnapshot(body)) return NextResponse.json({ error: "invalid snapshot" }, { status: 400 });

  const { learnerId, safety, stages } = body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.learner.upsert({ where: { id: learnerId }, create: { id: learnerId }, update: {} });

      if (safety.status !== "unscreened" && safety.screenedAt) {
        const last = await tx.safetyScreening.findFirst({
          where: { learnerId },
          orderBy: { createdAt: "desc" },
        });
        const lastFlags = last?.flaggedIds ?? null;
        const nextFlags = JSON.stringify(safety.flaggedIds);
        if (!last || lastFlags !== nextFlags || last.outcome !== safety.status) {
          await tx.safetyScreening.create({
            data: { learnerId, flaggedIds: nextFlags, outcome: safety.status },
          });
        }
      }

      for (const stageId of STAGE_IDS as StageId[]) {
        const p = stages[stageId];
        await tx.stageProgress.upsert({
          where: { learnerId_stageId: { learnerId, stageId } },
          create: {
            learnerId,
            stageId,
            practiceSeconds: totalPracticeSeconds(p),
            quizBestScore: p.quizBestScore,
            quizPassed: p.quizPassed,
            completedAt: p.completedAt ? new Date(p.completedAt) : null,
          },
          update: {
            practiceSeconds: totalPracticeSeconds(p),
            quizBestScore: p.quizBestScore,
            quizPassed: p.quizPassed,
            completedAt: p.completedAt ? new Date(p.completedAt) : null,
          },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable", detail: String(err) }, { status: 503 });
  }
}
