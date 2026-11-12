import { getGenerateResearchReportUrl } from "@workspace/api-client-react";
import type { ResearchReport, ResearchReportInput } from "@workspace/api-client-react";

export type ResearchEvent =
  | { type: "status"; message: string }
  | { type: "delta"; text: string }
  | { type: "complete"; report: ResearchReport }
  | { type: "error"; message: string };

export class ResearchStreamError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ResearchStreamError";
    this.status = status;
  }
}

function friendlyStatus(status: number, serverMsg?: string): string {
  if (status === 401) return "Your session has expired. Sign in again to generate research.";
  if (status === 429) return serverMsg || "Research limit reached. Wait a few minutes before generating another report.";
  if (status === 400) return serverMsg || "The server rejected these inputs. Check the fields and try again.";
  if (status >= 500) return serverMsg || "The research service failed. Try again shortly.";
  return serverMsg || `Request failed (HTTP ${status}).`;
}

function parseEvent(raw: string): ResearchEvent | null {
  const data = raw
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).replace(/^ /, ""))
    .join("\n");
  if (!data.trim()) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(data); } catch { throw new ResearchStreamError("The research stream sent malformed data."); }
  if (!parsed || typeof parsed !== "object") return null;
  const e = parsed as Record<string, unknown>;
  if (e.type === "status" && typeof e.message === "string") return { type: "status", message: e.message };
  if (e.type === "delta" && typeof e.text === "string") return { type: "delta", text: e.text };
  if (e.type === "error") return { type: "error", message: typeof e.message === "string" ? e.message : "Research failed." };
  if (e.type === "complete" && e.report && typeof e.report === "object") {
    const r = e.report as ResearchReport;
    if (typeof r.markdown === "string" && Array.isArray(r.sources)) return { type: "complete", report: r };
    throw new ResearchStreamError("The completed report was missing required fields.");
  }
  return null;
}

/** Streams a report. Resolves only on a `complete` event; throws otherwise. */
export async function streamResearchReport(
  input: ResearchReportInput,
  opts: { signal: AbortSignal; onEvent: (e: ResearchEvent) => void },
): Promise<ResearchReport> {
  const res = await fetch(getGenerateResearchReportUrl(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(input),
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg: string | undefined;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") msg = body.error;
    } catch { /* ignore */ }
    throw new ResearchStreamError(friendlyStatus(res.status, msg), res.status);
  }
  if (!res.body) throw new ResearchStreamError("The server returned an empty response.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const handle = (raw: string): ResearchReport | null => {
    const ev = parseEvent(raw);
    if (!ev) return null;
    if (ev.type === "error") throw new ResearchStreamError(ev.message);
    opts.onEvent(ev);
    return ev.type === "complete" ? ev.report : null;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      buffer = buffer.replace(/\r\n?/g, "\n");
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const report = handle(raw);
        if (report) return report;
      }
      if (done) {
        const report = buffer.trim() ? handle(buffer) : null;
        if (report) return report;
        throw new ResearchStreamError("The research stream ended before the report was complete.");
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}
