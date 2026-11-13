import { ai, type GroundingMetadata } from "@workspace/integrations-gemini-ai";
import { batchProcess } from "@workspace/integrations-gemini-ai/batch";
import type { ResearchReport, ResearchReportInput, ResearchSource } from "@workspace/api-zod";
import { publicUrl, fetchPublic } from "./public-web";
import { buildResearchPrompt, canonicalizeReportHeadings, validateReportOutline } from "./report-format";

const escapeLabel = (value: string) => value.replace(/[\\[\]<>]/g, "\\$&").replace(/[\r\n]+/g, " ");
const linkUrl = (value: string) => value.replace(/[()]/g, char => encodeURIComponent(char));

export function groundReport(text: string, metadata: GroundingMetadata[], accessedAt: string) {
  // The final metadata normally contains the cumulative chunk list and supports.
  const grounding = [...metadata].reverse().find(item => item.groundingChunks?.some(chunk => chunk.web?.uri));
  if (!grounding || !metadata.some(item => item.webSearchQueries?.length)) {
    throw new Error("Live search returned no attributable sources. No completed report was generated; retry rather than using an unverified draft.");
  }
  const sources: ResearchSource[] = [];
  const byUrl = new Map<string, number>(), byIndex = new Map<number, number>();
  grounding.groundingChunks?.forEach((chunk, index) => {
    if (!chunk.web?.uri) return;
    try {
      const url = publicUrl(chunk.web.uri).href;
      let id = byUrl.get(url);
      if (!id) {
        id = sources.length + 1;
        const publisher = "domain" in chunk.web ? String(chunk.web.domain) : new URL(url).hostname;
        sources.push({ id, title: chunk.web.title || publisher, url, publisher, accessedAt });
        byUrl.set(url, id);
      }
      byIndex.set(index, id);
    } catch { /* Never expose unsafe source links. */ }
  });
  if (!sources.length) throw new Error("No safe, attributable live sources were returned. Please retry.");
  const insertions = new Map<number, Set<number>>();
  for (const support of grounding.groundingSupports ?? []) {
    const segment = support.segment;
    let end = segment?.endIndex ?? -1;
    if (segment?.text) {
      if (text.slice(segment.startIndex ?? 0, end) !== segment.text) {
        const start = text.indexOf(segment.text);
        end = start === -1 ? -1 : start + segment.text.length;
      }
    }
    if (end < 0 || end > text.length) continue;
    const ids = insertions.get(end) ?? new Set<number>();
    for (const index of support.groundingChunkIndices ?? []) {
      const id = byIndex.get(index);
      if (id) ids.add(id);
    }
    if (ids.size) insertions.set(end, ids);
  }
  if (!insertions.size) throw new Error("The search returned sources but no attributable statements. Please retry; the draft is not a completed report.");
  let markdown = text;
  for (const [end, ids] of [...insertions].sort((a, b) => b[0] - a[0])) {
    markdown = `${markdown.slice(0, end)} ${[...ids].map(id => `[${id}](${linkUrl(sources[id - 1].url)})`).join(" ")}${markdown.slice(end)}`;
  }
  // Keep only source links actually returned by grounding, not model-invented URLs.
  markdown = markdown.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label: string, url: string) => {
    let parsed: string;
    try { parsed = new URL(decodeURI(url)).href; } catch { return label; }
    return byUrl.has(parsed) || sources.some(source => linkUrl(source.url) === url) ? match : label;
  });
  markdown += `\n\n## Sources\n\n${sources.map(source => `${source.id}. [${escapeLabel(source.title)}](${linkUrl(source.url)}) — ${escapeLabel(source.publisher)}. Accessed ${accessedAt.slice(0, 10)}.`).join("\n")}`;
  return { markdown, sources };
}

export async function generateReport(
  input: ResearchReportInput, signal: AbortSignal, onDelta: (text: string) => void,
): Promise<ResearchReport> {
  const context = { ...input, companyWebsite: publicUrl(input.companyWebsite).href };
  const researchedAt = new Date().toISOString();
  const prompt = buildResearchPrompt(context, researchedAt);
  // Retry only the stream setup, never partially emitted text, to avoid duplicate drafts.
  const [stream] = await batchProcess([prompt], contents => ai.models.generateContentStream({
    model: "gemini-3.8-flash", contents,
    config: { tools: [{ googleSearch: {} }], maxOutputTokens: 8192, abortSignal: signal, httpOptions: { timeout: 180_000 } },
  }), { retries: 1 });
  let text = "";
  const metadata: GroundingMetadata[] = [];
  let finishReason = "";
  for await (const chunk of stream) {
    signal.throwIfAborted();
    const next = chunk.text ?? "";
    text += next;
    if (next) onDelta(next);
    for (const candidate of chunk.candidates ?? []) {
      if (candidate.groundingMetadata) metadata.push(candidate.groundingMetadata);
      if (candidate.finishReason) finishReason = candidate.finishReason;
    }
    if (text.length > 100_000) throw new Error("The research response exceeded the report size limit.");
  }
  if (!text.trim() || (finishReason && finishReason !== "STOP")) throw new Error("Research ended before the report was complete. Please retry.");
  validateReportOutline(text);
  const grounded = groundReport(text, metadata, researchedAt);
  // Prefer direct publisher URLs over Google's long attribution redirects. If a
  // redirect cannot be resolved promptly, keep the original verified source link.
  const sourceSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)]);
  const resolved = await batchProcess(grounded.sources, async source => {
    if (new URL(source.url).hostname !== "vertexaisearch.cloud.google.com") return source;
    try {
      const result = await fetchPublic(source.url, sourceSignal, 100_000, 0, true);
      return { ...source, url: result.url, publisher: new URL(result.url).hostname };
    } catch { return source; }
  }, { concurrency: 4, retries: 0 });
  let markdown = canonicalizeReportHeadings(grounded.markdown);
  grounded.sources.forEach((source, index) => {
    if (source.url !== resolved[index].url) markdown = markdown.split(linkUrl(source.url)).join(linkUrl(resolved[index].url));
  });
  return { ...context, markdown, sources: resolved, researchedAt };
}
