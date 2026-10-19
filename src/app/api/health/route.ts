import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 部署探活：tools/ops/deploy.sh 重启后轮询这里，非 200 即回滚。
 * 构建期注入的 NEXT_PUBLIC_BUILD_COMMIT 用来核对线上跑的是哪个提交。
 */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    db = "error";
    dbError = String(err).slice(0, 200);
  }
  const body = {
    ok: db === "ok",
    app: "evidence-tuina",
    commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? null,
    node: process.version,
    db,
    ...(dbError ? { dbError } : {}),
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
  };
  return NextResponse.json(body, { status: db === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
