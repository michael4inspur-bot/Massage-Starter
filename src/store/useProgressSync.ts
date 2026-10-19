"use client";

import { useEffect, useRef } from "react";
import { useTuinaStore } from "@/store/useTuinaStore";

/**
 * 把 Zustand 进度快照以防抖方式同步到 /api/progress（Prisma）。
 * 失败静默：本地 localStorage 仍是事实来源，数据库仅作备份与统计。
 */
export function useProgressSync(): void {
  const hydrated = useTuinaStore((s) => s.hydrated);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const unsub = useTuinaStore.subscribe((state, prev) => {
      if (state.stages === prev.stages && state.safety === prev.safety) return;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const body = JSON.stringify(state.snapshot());
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => undefined);
      }, 1500);
    });
    return () => {
      unsub();
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [hydrated]);
}
