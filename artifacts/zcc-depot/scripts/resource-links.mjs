/** Public documentation only. No cookies, authorization, environment secrets, or browser session. */
export function publicDocumentationUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search) return undefined;
    const zendesk = url.hostname === "support.zendesk.com"
      && /^\/hc\/en-us\/(?:articles|sections|categories)\/\d+(?:-[^/]*)?\/?$/.test(url.pathname);
    const aws = url.hostname === "docs.aws.amazon.com"
      && /^\/[A-Za-z0-9_-]+\/(?:latest\/)?[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\.html$/.test(url.pathname);
    if (!zendesk && !aws) return undefined;
    url.hash = "";
    return url.href;
  } catch { return undefined; }
}

export function collectResources({ LINKS, RESOURCES, COMPONENT_DOCUMENTATION }, guides, componentDocumentation) {
  const byUrl = new Map();
  const excluded = [];
  const privateUrls = new Set(RESOURCES.filter((resource) => resource.kind === "Internal").map((resource) => publicDocumentationUrl(resource.url)).filter(Boolean));
  const add = (source, label, value, privateEntry = false) => {
    const candidate = publicDocumentationUrl(value);
    const url = !privateEntry && !privateUrls.has(candidate) && candidate;
    if (!url) {
      // Deliberately do not print excluded URLs, which could contain private file identifiers.
      excluded.push({ source, label, reason: privateEntry || privateUrls.has(candidate) ? "Internal/access-required resource" : "Outside public documentation allowlist" });
      return;
    }
    if (!byUrl.has(url)) byUrl.set(url, { url, entries: [] });
    byUrl.get(url).entries.push({ source, label });
  };
  for (const [key, value] of Object.entries(LINKS)) add(`src/data/content.ts:LINKS.${key}`, key, value);
  for (const resource of RESOURCES) {
    add(`src/data/content.ts:RESOURCES[${JSON.stringify(resource.id)}]`, resource.title, resource.url, resource.kind === "Internal");
  }
  for (const [term, value] of Object.entries(COMPONENT_DOCUMENTATION)) {
    const approved = componentDocumentation(term, COMPONENT_DOCUMENTATION);
    add(`src/data/content.ts:COMPONENT_DOCUMENTATION[${JSON.stringify(term)}]`, `Component chip: ${term}`, approved ?? "", !approved);
  }
  for (const [key, value] of Object.entries(guides)) {
    add(`src/data/contact-center-components.ts:${key}`, key, value);
  }
  return { resources: [...byUrl.values()], excluded };
}

function pageHeadings(html) {
  return [...html.matchAll(/<(title|h1)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((match) => match[2].replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|#160);/g, " ")
      .replace(/&(?:#39|apos);/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim());
}

export function classifyPage(status, html) {
  // Challenge detection must precede missing detection: challenge pages sometimes say "not found".
  const headings = pageHeadings(html);
  const challenge = /cf-chl-|challenge-platform|g-recaptcha|hcaptcha|<title[^>]*>\s*(?:just a moment|attention required|access denied|robot check)/i.test(html)
    || headings.some((text) => /verify (?:that )?you(?:'re| are) human|checking your browser|enable javascript and cookies/i.test(text));
  if (status === 429) return { status: "temporary", reason: "HTTP 429 rate limit; retry later" };
  if (challenge) return { status: "restricted", reason: `Anti-bot challenge (HTTP ${status}); not confirmed missing`, stopHost: true };
  if (status === 401 || status === 403) return { status: "restricted", reason: `HTTP ${status} access restriction; not confirmed missing` };
  if (status >= 500 || status === 408 || status === 425) return { status: "temporary", reason: `HTTP ${status}; retry later` };
  if (status === 404 || status === 410) return { status: "missing", reason: `HTTP ${status}` };
  if (status >= 400) return { status: "failed", reason: `HTTP ${status}; request failed, not confirmed missing` };
  if (status !== 200) return { status: "unverified", reason: `Unexpected HTTP ${status}` };
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i.test(html)) {
    return { status: "unverified", reason: "HTML refresh/redirect page; inspect manually" };
  }
  if (headings.some((text) => /^(?:sign in|log in|login)(?:\s*[-|–:].*)?$/i.test(text))) {
    return { status: "restricted", reason: "Sign-in page; not confirmed missing" };
  }
  if (headings.some((text) => /^(?:(?:error\s*)?404\b|page not found\b|article not found\b|document not found\b|this (?:page|article) (?:does not|doesn't) exist\b|(?:oops[!,.]?\s*)?(?:the )?page (?:you (?:were )?(?:are )?looking for )?(?:does not|doesn't|could not|couldn't|cannot|can't) (?:exist|be found)\b|(?:we(?:'re| are) sorry[,.!]?\s*)?(?:we )?(?:could not|couldn't|cannot|can't) find (?:that|this|the) page\b)/i.test(text))) {
    return { status: "missing", reason: "Soft 404: missing-page title or heading despite HTTP 200" };
  }
  if (!headings.length) return { status: "unverified", reason: "No document title or heading; inspect manually" };
  return { status: "ok", reason: "HTTP 200 documentation page" };
}

async function readHtml(response, maxBytes) {
  if (!response.body) return { html: "", truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      html += decoder.decode(value.subarray(0, Math.max(0, value.byteLength - Math.max(0, size - maxBytes))), { stream: true });
      if (size >= maxBytes) return { html, truncated: true };
    }
    return { html: html + decoder.decode(), truncated: false };
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export async function checkResource(resource, { fetchImpl = fetch, timeoutMs = 12000, maxBytes = 2_000_000 } = {}) {
  const original = publicDocumentationUrl(resource.url);
  if (!original) return { ...resource, status: "unverified", reason: "URL excluded by public documentation policy" };
  let current = original;
  const visited = new Set();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= 5; hop++) {
      if (visited.has(current)) return { ...resource, status: "failed", reason: "Redirect loop", finalUrl: current };
      visited.add(current);
      const response = await fetchImpl(current, {
        method: "GET", redirect: "manual", credentials: "omit", signal: controller.signal,
        headers: { Accept: "text/html", "User-Agent": "ZCC-Depot-Public-Link-Check/1.0" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) return { ...resource, status: "failed", reason: "Redirect has no destination", finalUrl: current };
        const destination = new URL(location, current);
        if (/\/(?:signin|sign_in|login|access\/unauthenticated)(?:\/|$)/i.test(destination.pathname)) {
          return { ...resource, status: "restricted", reason: "Redirect to sign-in; destination not requested" };
        }
        const safe = publicDocumentationUrl(destination.href);
        if (!safe) return { ...resource, status: "unverified", reason: "Redirect outside public documentation policy; destination not requested" };
        current = safe;
        continue;
      }
      const { html, truncated } = await readHtml(response, maxBytes);
      let result = classifyPage(response.status, html);
      if (result.status === "ok") {
        if (truncated) result = { status: "unverified", reason: "Response exceeds size limit; inspect manually" };
        else if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
          result = { status: "unverified", reason: "Response is not HTML documentation" };
        } else if (current !== original) result = { status: "moved", reason: "Redirected to public documentation; review manually" };
      }
      return { ...resource, ...result, httpStatus: response.status, finalUrl: current };
    }
    return { ...resource, status: "failed", reason: "More than 5 redirects" };
  } catch (error) {
    return { ...resource, status: "temporary", reason: controller.signal.aborted ? "Request timed out; retry later" : `Network failure (${error?.code ?? error?.cause?.code ?? "connection error"}); retry later` };
  } finally { clearTimeout(timer); }
}

/** Two workers maximum; pause a host for the rest of this run after a rate limit or challenge. */
export async function checkResources(resources, options = {}) {
  const results = new Array(resources.length);
  const pausedHosts = new Map();
  let cursor = 0;
  const delayMs = options.delayMs ?? 300;
  async function worker() {
    while (cursor < resources.length) {
      const index = cursor++;
      const resource = resources[index];
      const host = new URL(resource.url).hostname;
      const paused = pausedHosts.get(host);
      if (paused) {
        results[index] = { ...resource, status: paused, reason: "Host paused after rate limit/anti-bot response; not requested" };
        continue;
      }
      const result = await checkResource(resource, options);
      results[index] = result;
      if (result.httpStatus === 429 || result.stopHost) pausedHosts.set(host, result.status);
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  await Promise.all([worker(), worker()]);
  return results;
}

export function exitCode(results) {
  if (results.some((result) => ["missing", "failed"].includes(result.status))) return 1;
  return results.some((result) => !["ok", "moved"].includes(result.status)) ? 2 : 0;
}

export function formatReport({ results, excluded }) {
  const counts = results.reduce((acc, result) => ({ ...acc, [result.status]: (acc[result.status] ?? 0) + 1 }), {});
  const lines = [
    "Public resource link check (Zendesk Help Center + AWS docs)",
    `${results.length} unique URLs | ${Object.entries(counts).map(([key, count]) => `${count} ${key}`).join(", ")} | ${excluded.length} source entries excluded`,
  ];
  for (const result of results.filter((result) => result.status !== "ok")) {
    lines.push(`\n${result.status.toUpperCase()}: ${result.reason}`, `  ${result.url}`);
    if (result.finalUrl && result.finalUrl !== result.url) lines.push(`  Destination: ${result.finalUrl}`);
    for (const entry of result.entries) lines.push(`  ${entry.source} — ${entry.label}`);
  }
  lines.push("\nNo links changed. Exits: 0 = no failures/inconclusive checks, 1 = missing/failed, 2 = inconclusive only.");
  return lines.join("\n");
}
