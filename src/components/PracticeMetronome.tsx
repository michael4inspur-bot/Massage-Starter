"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Gauge, Pause, Play, RotateCcw, Volume2, VolumeX, Wind } from "lucide-react";
import type { Technique } from "@/types/tuina";

/* ----------------------------------------------------------------------------
 * PracticeMetronome
 * - Web Audio API 节拍器（lookahead 调度，不受 setTimeout 抖动影响）
 * - Canvas 实时压力波形（目标曲线 + 当前相位游标 + 目标深度线）
 * - Framer Motion 压力计圆盘 & 呼吸引导环
 * - 节律型：点按"跟拍"按钮，实时计算节拍偏差（±10% 绿区）
 * - 静态型：Hold/Release 相位计时 + 呼气下沉提示
 * -------------------------------------------------------------------------- */

export interface PracticeMetronomeProps {
  technique: Technique;
  /** 累计秒数（来自 store） */
  accumulatedSeconds: number;
  locked: boolean;
  onSecondTick: (seconds: number) => void;
  onSessionEnd?: (sessionSeconds: number) => void;
  onRunningChange?: (running: boolean) => void;
}

type Phase = "hold" | "release";

interface TapStats {
  meanIntervalMs: number | null;
  deviationPct: number | null;
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function formatMMSS(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** 目标压力曲线（0–1）：节律型为半正弦；弹拨为快速脉冲；静态为 Hold/Release 方波带斜坡 */
function targetProfile(technique: Technique, phaseT: number): number {
  const m = technique.mechanics;
  if (m.mode === "rhythmic") {
    return 0.5 - 0.5 * Math.cos(phaseT * Math.PI * 2);
  }
  if (m.mode === "strum") {
    // 快速过峰、缓慢回位：模拟拨过条索
    const x = phaseT;
    return x < 0.3 ? x / 0.3 : 1 - (x - 0.3) / 0.7;
  }
  const hold = m.holdSeconds ?? 45;
  const release = m.releaseSeconds ?? 15;
  const cycle = hold + release;
  const t = phaseT * cycle;
  if (t < hold) {
    const ramp = Math.min(1, t / 3);
    return 0.85 + 0.15 * ramp;
  }
  const r = (t - hold) / release;
  return Math.max(0, 1 - r * 4);
}

export default function PracticeMetronome({
  technique,
  accumulatedSeconds,
  locked,
  onSecondTick,
  onSessionEnd,
  onRunningChange,
}: PracticeMetronomeProps) {
  const m = technique.mechanics;
  const isStatic = m.mode === "holdRelease";
  const frequency = m.frequencyHz ?? 1;
  const holdS = m.holdSeconds ?? 45;
  const releaseS = m.releaseSeconds ?? 15;
  const cycleS = isStatic ? holdS + releaseS : 1 / frequency;

  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [phase, setPhase] = useState<Phase>("hold");
  const [phaseRemaining, setPhaseRemaining] = useState(holdS);
  const [cycleCount, setCycleCount] = useState(0);
  const [beatFlash, setBeatFlash] = useState(false);
  const [tapStats, setTapStats] = useState<TapStats>({ meanIntervalMs: null, deviationPct: null });
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");

  const audioCtx = useRef<AudioContext | null>(null);
  const nextBeatTime = useRef(0);
  const startTime = useRef(0);
  const schedulerTimer = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gaugeRef = useRef<HTMLDivElement | null>(null);
  const lastWholeSecond = useRef(0);
  const taps = useRef<number[]>([]);
  const mutedRef = useRef(false);
  const lastBeatIndex = useRef(-1);
  const lastPhaseRef = useRef<Phase>("hold");

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const required = m.requiredSeconds;
  const progressPct = clamp((accumulatedSeconds / required) * 100, 0, 100);

  // ---------- 音频 ----------
  const ensureAudio = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtx.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx.current = new Ctor();
    }
    if (audioCtx.current.state === "suspended") void audioCtx.current.resume();
    return audioCtx.current;
  }, []);

  const playClick = useCallback((ctx: AudioContext, at: number, accent: boolean, kind: "tick" | "phase" | "breath") => {
    if (mutedRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freqHz = kind === "phase" ? (accent ? 880 : 440) : kind === "breath" ? 330 : accent ? 1320 : 990;
    osc.type = kind === "breath" ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freqHz, at);
    const peak = kind === "breath" ? 0.12 : accent ? 0.35 : 0.22;
    const dur = kind === "phase" ? 0.18 : kind === "breath" ? 0.3 : 0.05;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }, []);

  // 节律 / 弹拨模式：lookahead 调度
  const scheduler = useCallback(() => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    while (nextBeatTime.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const beatIndex = Math.round((nextBeatTime.current - startTime.current) * frequency);
      const accent = beatIndex % 4 === 0;
      playClick(ctx, nextBeatTime.current, accent, "tick");
      const delay = Math.max(0, (nextBeatTime.current - ctx.currentTime) * 1000);
      window.setTimeout(() => {
        setBeatFlash(true);
        window.setTimeout(() => setBeatFlash(false), 60);
      }, delay);
      nextBeatTime.current += 1 / frequency;
    }
    schedulerTimer.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  }, [frequency, playClick]);

  // ---------- 主循环（rAF）：计时、相位、画布 ----------
  const drawFrame = useCallback(() => {
    const ctx = audioCtx.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const elapsed = ctx.currentTime - startTime.current;

    // 秒计数
    const whole = Math.floor(elapsed);
    if (whole > lastWholeSecond.current) {
      const delta = whole - lastWholeSecond.current;
      lastWholeSecond.current = whole;
      setSessionSeconds(whole);
      onSecondTick(delta);
    }

    // 相位（静态模式）
    const cyclePos = (elapsed % cycleS) / cycleS;
    if (isStatic) {
      const t = elapsed % cycleS;
      const nextPhase: Phase = t < holdS ? "hold" : "release";
      const remaining = nextPhase === "hold" ? holdS - t : cycleS - t;
      setPhaseRemaining(Math.ceil(remaining));
      if (nextPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = nextPhase;
        setPhase(nextPhase);
        playClick(ctx, ctx.currentTime, nextPhase === "hold", "phase");
        if (nextPhase === "hold") setCycleCount(Math.floor(elapsed / cycleS));
      }
      // 呼吸引导（在 Hold 内循环）
      if (m.breathing) {
        const b = m.breathing;
        const bCycle = b.inhaleSeconds + b.exhaleSeconds;
        const bt = elapsed % bCycle;
        const bp: "inhale" | "exhale" = bt < b.inhaleSeconds ? "inhale" : "exhale";
        setBreathPhase((prev) => {
          if (prev !== bp) playClick(ctx, ctx.currentTime, bp === "inhale", "breath");
          return bp;
        });
      }
    } else {
      const beatIdx = Math.floor(elapsed * frequency);
      if (beatIdx !== lastBeatIndex.current) {
        lastBeatIndex.current = beatIdx;
        setCycleCount(beatIdx);
      }
      if (m.breathing) {
        const b = m.breathing;
        const bCycle = b.inhaleSeconds + b.exhaleSeconds;
        const bt = elapsed % bCycle;
        const bp: "inhale" | "exhale" = bt < b.inhaleSeconds ? "inhale" : "exhale";
        setBreathPhase((prev) => {
          if (prev !== bp) playClick(ctx, ctx.currentTime, bp === "inhale", "breath");
          return bp;
        });
      }
    }

    // 画布
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const g = canvas.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    // 背景网格
    g.strokeStyle = "rgba(255,255,255,0.06)";
    g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h * i) / 4;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    // 目标深度线
    const depthY = h - m.targetDepth * h;
    g.setLineDash([6, 4]);
    g.strokeStyle = "rgba(246,183,60,0.8)";
    g.beginPath();
    g.moveTo(0, depthY);
    g.lineTo(w, depthY);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(246,183,60,0.9)";
    g.font = "11px sans-serif";
    g.fillText(`目标形变 ${Math.round(m.targetDepth * 100)}%`, 6, depthY - 4);

    // 波形：画面显示 windowCycles 个周期，游标在 1/3 处
    const windowSeconds = isStatic ? cycleS : Math.max(2, 3 / frequency);
    const cursorX = w / 3;
    const pxPerSec = w / windowSeconds;
    g.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const tAtX = elapsed + (x - cursorX) / pxPerSec;
      const pt = tAtX < 0 ? 0 : ((tAtX % cycleS) + cycleS) % cycleS / cycleS;
      const v = tAtX < 0 ? 0 : targetProfile(technique, pt) * m.targetDepth;
      const y = h - v * h;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokeStyle = "rgba(79,209,181,0.95)";
    g.lineWidth = 2.5;
    g.stroke();

    // 已走过区域填充
    g.save();
    g.beginPath();
    g.rect(0, 0, cursorX, h);
    g.clip();
    g.fillStyle = "rgba(79,209,181,0.08)";
    g.fillRect(0, 0, cursorX, h);
    g.restore();

    // 游标
    const curV = targetProfile(technique, cyclePos) * m.targetDepth;
    const curY = h - curV * h;
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cursorX, 0);
    g.lineTo(cursorX, h);
    g.stroke();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(cursorX, curY, 5, 0, Math.PI * 2);
    g.fill();

    // 压力计（直接操作 DOM 避免每帧 setState）
    const gauge = gaugeRef.current;
    if (gauge) {
      const scale = 0.55 + curV * 0.6;
      gauge.style.transform = `scale(${scale.toFixed(3)})`;
      const warm = clamp(curV / Math.max(0.2, m.targetDepth), 0, 1);
      gauge.style.background = `radial-gradient(circle at 50% 40%, rgba(79,209,181,${0.35 + warm * 0.45}), rgba(43,183,154,${0.1 + warm * 0.3}) 60%, transparent 72%)`;
    }

    rafId.current = window.requestAnimationFrame(drawFrame);
  }, [cycleS, frequency, holdS, isStatic, m.breathing, m.targetDepth, onSecondTick, playClick, technique]);

  // ---------- 开始 / 暂停 / 复位 ----------
  const start = useCallback(() => {
    if (locked) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + 0.05;
    startTime.current = now - sessionSeconds; // 续练
    nextBeatTime.current = now;
    lastWholeSecond.current = sessionSeconds;
    lastBeatIndex.current = -1;
    lastPhaseRef.current = "release"; // 让首帧触发 hold 提示音
    setRunning(true);
    onRunningChange?.(true);
    if (!isStatic) scheduler();
    rafId.current = window.requestAnimationFrame(drawFrame);
  }, [drawFrame, ensureAudio, isStatic, locked, onRunningChange, scheduler, sessionSeconds]);

  const stop = useCallback(
    (end: boolean) => {
      if (schedulerTimer.current !== null) window.clearTimeout(schedulerTimer.current);
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      schedulerTimer.current = null;
      rafId.current = null;
      setRunning(false);
      onRunningChange?.(false);
      if (end) {
        if (sessionSeconds > 0) onSessionEnd?.(sessionSeconds);
        setSessionSeconds(0);
        setCycleCount(0);
        setPhase("hold");
        setPhaseRemaining(holdS);
        taps.current = [];
        setTapStats({ meanIntervalMs: null, deviationPct: null });
        lastWholeSecond.current = 0;
        const gauge = gaugeRef.current;
        if (gauge) gauge.style.transform = "scale(0.55)";
      }
    },
    [holdS, onRunningChange, onSessionEnd, sessionSeconds],
  );

  // 切换技术 / 锁定时复位
  useEffect(() => {
    stop(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technique.id, locked]);

  useEffect(() => {
    return () => {
      if (schedulerTimer.current !== null) window.clearTimeout(schedulerTimer.current);
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      void audioCtx.current?.close();
    };
  }, []);

  // ---------- 跟拍偏差 ----------
  const handleTap = useCallback(() => {
    const now = performance.now();
    const arr = taps.current;
    arr.push(now);
    if (arr.length > 9) arr.shift();
    if (arr.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const cur = arr[i];
        if (prev !== undefined && cur !== undefined) intervals.push(cur - prev);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const targetMs = 1000 / frequency;
      setTapStats({ meanIntervalMs: mean, deviationPct: ((mean - targetMs) / targetMs) * 100 });
    }
    const ctx = ensureAudio();
    if (ctx) playClick(ctx, ctx.currentTime, false, "breath");
  }, [ensureAudio, frequency, playClick]);

  const deviationTone = useMemo(() => {
    const d = tapStats.deviationPct;
    if (d === null) return { label: "点击跟拍按钮 3 次以上开始评估", cls: "text-white/50" };
    const abs = Math.abs(d);
    if (abs <= 10) return { label: `偏差 ${d > 0 ? "+" : ""}${d.toFixed(0)}% · 绿区 ✓`, cls: "text-mint-400" };
    if (abs <= 25) return { label: `偏差 ${d > 0 ? "+" : ""}${d.toFixed(0)}% · ${d > 0 ? "偏慢" : "偏快"}`, cls: "text-amber-400" };
    return { label: `偏差 ${d > 0 ? "+" : ""}${d.toFixed(0)}% · 明显${d > 0 ? "偏慢" : "偏快"}`, cls: "text-coral-500" };
  }, [tapStats]);

  const breathing = m.breathing;
  const breathDur = breathing ? (breathPhase === "inhale" ? breathing.inhaleSeconds : breathing.exhaleSeconds) : 0;

  return (
    <div className="card relative overflow-hidden p-4 sm:p-5">
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm">
          <div className="max-w-sm px-6 text-center">
            <p className="text-lg font-semibold text-coral-500">实操面板已锁定</p>
            <p className="mt-2 text-sm text-white/70">请先完成红旗征安全筛查并通过，或在筛查出高危症状后遵循转诊建议。</p>
          </div>
        </div>
      )}

      {/* 头部参数 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">Quantified Practice Studio</p>
          <h3 className="mt-1 text-lg font-semibold">{technique.name}</h3>
          <p className="text-xs text-white/50">{technique.modernName}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {isStatic ? (
            <span className="pill border-mint-400/40 text-mint-400">Hold {holdS}s / Release {releaseS}s</span>
          ) : (
            <span className="pill border-mint-400/40 text-mint-400">
              {frequency.toFixed(2)} Hz · {Math.round(frequency * 60)} 次/分
            </span>
          )}
          <span className="pill border-amber-400/40 text-amber-400">形变 {Math.round(m.targetDepth * 100)}%</span>
          <span className="pill border-coral-500/40 text-coral-500">
            VAS {m.vas.min}–{m.vas.max}/10
          </span>
          <span className="pill text-white/70">{m.neuroTarget}</span>
        </div>
      </div>

      {/* 主视觉：波形 + 压力计 + 呼吸 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-ink-950/70">
          <canvas ref={canvasRef} className="h-full w-full" aria-label="压力波形引导" />
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 text-[11px] text-white/50">
            <Activity size={12} /> 目标压力曲线 · 白点 = 现在你的手应在的深度
          </div>
          {!running && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/40">
              点击「开始」后波形开始滚动
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-ink-950/70 p-3">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60"
              style={{ transform: `scale(${(0.55 + m.targetDepth * 0.6).toFixed(3)})` }}
              aria-hidden
            />
            <div
              ref={gaugeRef}
              className="absolute inset-0 rounded-full transition-transform duration-75 will-change-transform"
              style={{ transform: "scale(0.55)" }}
              aria-hidden
            />
            <AnimatePresence>
              {beatFlash && (
                <motion.div
                  key="flash"
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-full border-2 border-mint-400"
                />
              )}
            </AnimatePresence>
            <Gauge size={22} className="relative text-white/80" />
          </div>
          <p className="text-center text-[11px] leading-tight text-white/50">
            视觉压力计
            <br />
            虚线圈 = 目标深度
          </p>
        </div>
      </div>

      {/* 相位 / 呼吸 / 计数 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-ink-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/40">{isStatic ? "当前相位" : "节拍计数"}</p>
          {isStatic ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${phase === "hold" ? "text-mint-400" : "text-sky-400"}`}>
                {phase === "hold" ? "HOLD 保持" : "RELEASE 放松"}
              </span>
              <span className="text-lg tabular-nums text-white/70">{running ? `${phaseRemaining}s` : `${holdS}s`}</span>
            </div>
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-mint-400">{cycleCount}</span>
              <span className="text-sm text-white/60">拍 · 每 4 拍一个重音</span>
            </div>
          )}
          <p className="mt-1 text-xs text-white/50">{isStatic ? `第 ${cycleCount + (running ? 1 : 0)} / 6 组` : `目标 ${Math.round(frequency * 60)} 次/分`}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/50 p-3">
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/40">
            <Wind size={12} /> 呼吸引导
          </p>
          {breathing ? (
            <div className="mt-1 flex items-center gap-3">
              <motion.div
                className="h-10 w-10 rounded-full bg-sky-400/70"
                animate={running ? { scale: breathPhase === "inhale" ? 1.35 : 0.75 } : { scale: 1 }}
                transition={{ duration: running ? breathDur : 0.3, ease: "easeInOut" }}
              />
              <div>
                <p className={`font-semibold ${breathPhase === "inhale" ? "text-sky-400" : "text-mint-400"}`}>
                  {running ? (breathPhase === "inhale" ? "吸气 · 保持" : breathing.exhaleAction === "sink" ? "呼气 · 下沉" : "呼气 · 保持") : "待开始"}
                </p>
                <p className="text-xs text-white/50">
                  吸 {breathing.inhaleSeconds}s / 呼 {breathing.exhaleSeconds}s
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/60">自然呼吸，不要憋气；让肩膀下沉。</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-ink-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/40">本次 / 累计</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatMMSS(sessionSeconds)}
            <span className="ml-2 text-sm font-normal text-white/50">/ 累计 {formatMMSS(accumulatedSeconds)}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`h-full ${progressPct >= 100 ? "bg-mint-400" : "bg-amber-400"}`}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
          <p className="mt-1 text-xs text-white/50">
            达标 {formatMMSS(required)} {progressPct >= 100 ? "· 已达标 ✓" : ""}
          </p>
        </div>
      </div>

      {/* 控制 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {running ? (
          <button
            type="button"
            onClick={() => stop(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-amber-400/90"
          >
            <Pause size={16} /> 暂停
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={locked}
            className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-mint-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={16} /> {sessionSeconds > 0 ? "继续" : "开始"}
          </button>
        )}
        <button
          type="button"
          onClick={() => stop(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          <RotateCcw size={16} /> 结束并记录
        </button>
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          aria-pressed={muted}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {muted ? "静音" : "有声"}
        </button>

        {!isStatic && (
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onPointerDown={handleTap}
              disabled={locked}
              className="select-none rounded-xl border border-mint-400/40 bg-mint-400/10 px-4 py-2 text-sm font-semibold text-mint-400 active:scale-95 disabled:opacity-40"
            >
              跟拍 TAP
            </button>
            <span className={`text-xs ${deviationTone.cls}`}>{deviationTone.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
