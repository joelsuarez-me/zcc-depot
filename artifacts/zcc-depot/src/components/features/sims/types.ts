export type Tone = "ok" | "warn" | "bad" | "info" | "muted";
export type Row = [label: string, value: string, tone?: Tone];
export interface SimPanel { title: string; rows: Row[]; note?: string }
export interface SimStep {
  /** Index into SimDef.stages that is active on this step. */
  stage: number;
  caption: string;
  /** Optional task-specific action, in addition to the shared playback controls. */
  actionLabel?: string;
  panels: SimPanel[];
  /** Appended to the cumulative event log when this step is reached. */
  log?: string;
  /** Appended to the cumulative transcript when this step is reached. */
  say?: { who: string; text: string };
  status?: { label: string; tone: Tone };
}
export interface SimScenario { id: string; label: string; summary: string; steps: SimStep[] }
export interface SimDef {
  title: string;
  stages: string[];
  scenarioLabel: string;
  scenarios: SimScenario[];
  /** Ownership notes such as native vs configured vs custom. */
  boundary: string[];
}
