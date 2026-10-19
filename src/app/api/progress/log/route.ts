import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGE_IDS } from "@/lib/progress";
import type { StageId } from "@/types/tuina";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LogBody {
  learnerId: string;
  stageId: StageId;
  techniqueId: string;
  seconds: number;
  frequencyHz?: number;
  holdSeconds?: number;
}

function isLogBody(x: unknown): x is LogBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.learnerId === "string" &&
    typeof o.stageId === "string" &&
    (STAGE_IDS as string[]).includes(o.stageId) &&
    typeof o.techniqueId === "string" &&
    typeof o.seconds === "number" &&
    o.seconds > 0 &&
    o.seconds < 7200
  );
}

/** 练功房每次停止时记录一条实操日志 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!isLogBody(body)) return NextResponse.json({ error: "invalid log" }, { status: 400 });
  try {
    await prisma.learner.upsert({ where: { id: body.learnerId }, create: { id: body.learnerId }, update: {} });
    await prisma.practiceLog.create({
      data: {
        learnerId: body.learnerId,
        stageId: body.stageId,
        techniqueId: body.techniqueId,
        seconds: Math.round(body.seconds),
        frequencyHz: body.frequencyHz ?? null,
        holdSeconds: body.holdSeconds ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable", detail: String(err) }, { status: 503 });
  }
}
