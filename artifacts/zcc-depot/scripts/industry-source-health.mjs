import { createHash } from "node:crypto";

const ALLOWED_HOSTS = new Set(["www.zendesk.com", "support.zendesk.com", "developer.zendesk.com", "docs.aws.amazon.com", "aws.amazon.com"]);
const MAX_BYTES = 8_000_000;
export function allowedSourceUrl(value) {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && (!u.port || u.port === "443") && ALLOWED_HOSTS.has(u.hostname); } catch { return false; }
}
export function documentText(html) {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript|nav)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Prefer the article/main body to reduce navigation and analytics churn.
  const content = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    ?? cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? cleaned;
  return content.replace(/<[^>]*>/g, " ").replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
    const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " ";
  }).replace(/&(nbsp|amp|quot|apos|lt|gt);/gi, (_, entity) => ({ nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" })[entity.toLowerCase()])
    .normalize("NFKC").replace(/\s+/g, " ").trim();
}
async function boundedBody(response) {
  if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("Document exceeded the eight-megabyte check limit.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Document body was empty.");
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Document exceeded the eight-megabyte check limit.");
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString("utf8");
}
export async function inspectSource(source, previous, { fetcher = fetch, now = new Date() } = {}) {
  const result = { url: source.url, finalUrl: source.url, checkedAt: now.toISOString(), status: "inconclusive", fingerprint: null, observedBaseline: previous?.url === source.url ? previous.observedBaseline : null, reason: "" };
  try {
    let url = source.url;
    const signal = AbortSignal.timeout(15_000);
    for (let redirects = 0; redirects <= 5; redirects++) {
      if (!allowedSourceUrl(url)) throw new Error("Destination was outside the approved public documentation hosts.");
      result.finalUrl = url;
      const response = await fetcher(url, { redirect: "manual", signal, headers: { "User-Agent": "ZCC-Depot-Documentation-Review/1.0", Accept: "text/html" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location"); await response.body?.cancel();
        if (!location || redirects === 5) throw new Error("Redirect was missing a location or exceeded the limit.");
        url = new URL(location, url).href; continue;
      }
      if (!response.ok) {
        result.status = [404, 410].includes(response.status) ? "unavailable" : "inconclusive";
        result.reason = `HTTP ${response.status}. ${result.status === "unavailable" ? "The reference could not be found." : "Access restrictions or a temporary provider error may prevent checking."}`;
        await response.body?.cancel(); return result;
      }
      if (!response.headers.get("content-type")?.includes("text/html")) throw new Error("Expected an HTML documentation page.");
      const html = await boundedBody(response), text = documentText(html);
      if (text.length < 200 || /<title[^>]*>[^<]*(just a moment|access denied|sign in|page not found|404|verify you are human|attention required)/i.test(html)
        || /cf-chl-|captcha-delivery\.com/i.test(html)) throw new Error("The response was too short or appeared to be an access challenge, login or error page.");
      result.status = "available";
      result.fingerprint = createHash("sha256").update(text).digest("hex");
      result.observedBaseline ??= result.fingerprint;
      result.reason = "Normalized document text fetched; availability does not establish claim accuracy.";
      return result;
    }
  } catch (error) { result.reason = error instanceof Error ? error.message : "The check did not complete."; }
  return result;
}
