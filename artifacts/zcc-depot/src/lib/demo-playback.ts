export type DemoStage = { id: string; label: string; description: string; durationMs: number };

export function playbackStatus(complete: boolean, playing: boolean, hasInteracted: boolean) {
  return complete ? "complete" : playing ? "playing" : hasInteracted ? "paused" : "idle";
}

export function playbackFrame(stages: readonly DemoStage[], requestedElapsed: number) {
  if (!stages.length || stages.some(stage => !Number.isFinite(stage.durationMs) || stage.durationMs <= 0)) {
    throw new Error("A demo needs at least one stage with a positive duration.");
  }
  const totalMs = stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const elapsedMs = Math.max(0, Math.min(totalMs, Number.isFinite(requestedElapsed) ? requestedElapsed : 0));
  let start = 0;
  let stepIndex = 0;
  while (stepIndex < stages.length - 1 && elapsedMs >= start + stages[stepIndex].durationMs) {
    start += stages[stepIndex].durationMs;
    stepIndex++;
  }
  return {
    elapsedMs, totalMs, stepIndex,
    stepElapsedMs: elapsedMs - start,
    stepProgress: Math.min(1, (elapsedMs - start) / stages[stepIndex].durationMs),
    progress: elapsedMs / totalMs,
    complete: elapsedMs >= totalMs,
    stage: stages[stepIndex],
  };
}

export function stageStart(stages: readonly DemoStage[], index: number): number {
  const bounded = Math.max(0, Math.min(stages.length - 1, Math.floor(index)));
  return stages.slice(0, bounded).reduce((sum, stage) => sum + stage.durationMs, 0);
}
