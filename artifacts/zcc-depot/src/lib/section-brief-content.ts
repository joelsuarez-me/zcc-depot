import type { PdfBlock } from "./research-pdf-markdown";

export type BriefItem = { kind: "heading" | "paragraph" | "list"; text: string } | { kind: "table"; headers: string[]; rows: string[][] };
export type SectionBriefContent = {
  title: string; page: string; sourceUrl: string; internal: boolean; summary: string;
  blocks: PdfBlock[]; qualifications: string[]; sources: { title: string; url: string }[];
  abridged: boolean; interactive: boolean;
};
const EXCLUDE = [
  "[data-brief-exclude]", "[hidden]", "[aria-hidden='true']", "[inert]", ".sr-only",
  "nav", "button", "[role='button']", "[role='tablist']", "[role='dialog']", "dialog",
  "form", "input", "textarea", "select", "option", "[contenteditable='true']",
  "script", "style", "iframe", "video", "audio", ".depot-gate", ".depot-presenter-dock",
  ".depot-dock", "[data-testid*='presenter-notes']", "[data-testid='presenter-loading']",
].join(",");
const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const qualification = /depend|configur|plan\b|optional|not\b|native|custom|simulat|illustrat|conceptual|regulat|compliance|licens|availab|verify|confirm|confidential|internal/i;

/** Select complete content items, rather than cutting a sentence away from its qualification. */
export function assembleSectionBrief(items: BriefItem[], metadata: Omit<SectionBriefContent, "summary" | "blocks" | "qualifications" | "abridged">): SectionBriefContent {
  const unique = items.filter((item, i, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === i);
  const intro = unique.find(item => item.kind === "paragraph");
  const summary = intro?.kind === "paragraph" ? intro.text : "";
  const blocks: PdfBlock[] = [];
  let words = wordCount(summary), abridged = false;
  for (const item of unique) {
    if (item === intro || ("text" in item && item.text === metadata.title)) continue;
    const text = item.kind === "table" ? [...item.headers, ...item.rows.flat()].join(" ") : item.text;
    if (blocks.length >= 14 || words + wordCount(text) > 1100) { abridged = true; continue; }
    words += wordCount(text);
    if (item.kind === "table") {
      const headers = item.headers.slice(0, 6);
      const rows = item.rows.slice(0, 8).map(row => row.slice(0, 6));
      if (item.rows.length > 8 || item.headers.length > 6) abridged = true;
      blocks.push({ kind: "table", headers, rows, align: [] });
    } else if (item.kind === "list") blocks.push({ kind: "list", text: item.text, marker: "", indent: 0 });
    else blocks.push(item.kind === "heading" ? { kind: "heading", text: item.text } : { kind: "paragraph", text: item.text });
  }
  while (blocks.at(-1)?.kind === "heading") blocks.pop();
  const included = JSON.stringify(blocks) + summary;
  const qualifications = unique.filter((item): item is Extract<BriefItem, { text: string }> => item.kind !== "table")
    .map(item => item.text).filter(text => qualification.test(text) && text.length <= 600 && !included.includes(text)).slice(0, 5);
  return { ...metadata, summary, blocks, qualifications, abridged };
}

/** Export only mounted content in this section. Never read stores, API responses, forms or hidden panels. */
export function captureSectionBrief(scope: HTMLElement, sectionId?: string): SectionBriefContent {
  const doc = scope.ownerDocument, view = doc.defaultView;
  if (scope.closest(EXCLUDE)) throw new Error("This section is not available as a downloadable brief.");
  const visibleCache = new WeakMap<Element, boolean>();
  const visible = (element: Element): boolean => {
    const cached = visibleCache.get(element);
    if (cached !== undefined) return cached;
    let allowed = !element.matches(EXCLUDE);
    if (allowed && view?.getComputedStyle) {
      const style = view.getComputedStyle(element);
      allowed = style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse";
    }
    if (allowed && element.parentElement && element !== scope) allowed = visible(element.parentElement);
    visibleCache.set(element, allowed);
    return allowed;
  };
  const textOf = (node: Node): string => {
    if (node.nodeType === 3) return node.textContent ?? "";
    if (node.nodeType !== 1 || !visible(node as Element)) return "";
    return Array.from(node.childNodes).map(textOf).join(" ");
  };
  const text = (element: Element) => clean(textOf(element));
  const titleNode = Array.from(scope.querySelectorAll("h2,h1,h3")).find(visible);
  const title = titleNode ? text(titleNode) : "";
  if (!title) throw new Error("A readable section title could not be found.");
  const items: BriefItem[] = [];
  for (const element of scope.querySelectorAll("h2,h3,h4,h5,p,li,dt,dd,figcaption,summary,table,[data-brief-text]")) {
    if (!visible(element) || element.parentElement?.closest("table,li,[data-brief-text]")) continue;
    if (element.tagName.toLowerCase() === "table") {
      const rows = Array.from(element.querySelectorAll("tr")).filter(visible).map(row =>
        Array.from(row.querySelectorAll("th,td")).filter(visible).map(text)).filter(row => row.length);
      if (rows.length) {
        const first = element.querySelector("tr");
        const hasHeaders = !!first?.querySelector("th");
        const headers = hasHeaders ? rows[0] : rows[0].map((_, i) => `Field ${i + 1}`);
        items.push({ kind: "table", headers, rows: hasHeaders ? rows.slice(1) : rows });
      }
      continue;
    }
    const value = text(element);
    if (!value || value === title) continue;
    const tag = element.tagName.toLowerCase();
    items.push({ kind: /^h[2-5]$/.test(tag) || tag === "summary" || tag === "dt" ? "heading" : tag === "li" ? "list" : "paragraph", text: value });
  }
  // Read labelled diagrams as concepts, not as a fabricated screenshot or a replay.
  const diagramLabels = [...new Set(Array.from(scope.querySelectorAll("svg text")).filter(visible).map(text).filter(Boolean))];
  if (diagramLabels.length) items.push({ kind: "paragraph", text: `Diagram concepts: ${diagramLabels.slice(0, 24).join("; ")}.` });
  const href = new URL(doc.location.href);
  href.search = "";
  if (sectionId || scope.id) href.hash = sectionId || scope.id;
  // Curated use-case identifiers may be retained; never copy free-text/customer query parameters.
  for (const [attribute, parameter] of [["data-brief-case", "case"], ["data-brief-industry", "industry"]]) {
    const value = scope.getAttribute(attribute);
    if (value && /^[a-z0-9-]{1,100}$/.test(value)) href.searchParams.set(parameter, value);
  }
  const sources = new Map<string, { title: string; url: string }>();
  for (const anchor of scope.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (!visible(anchor)) continue;
    try {
      const url = new URL(anchor.href, href);
      const official = ["zendesk.com", "aws.amazon.com", "localmeasure.com"].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
      if (url.protocol !== "https:" || !official) continue;
      url.search = "";
      const title = text(anchor);
      if (title) sources.set(url.href, { title, url: url.href });
    } catch { /* Ignore non-URL controls, never change section content. */ }
  }
  const page = clean(doc.querySelector("h1")?.textContent ?? doc.title.replace(/\s*\|\s*ZCC Depot$/, ""));
  const internal = !!scope.closest("[data-brief-internal]") || ["/pricing", "/sell-sheet", "/agenda", "/demos/brief"].some(path => href.pathname.endsWith(path));
  const result = assembleSectionBrief(items, {
    title, page, sourceUrl: href.href, internal, sources: [...sources.values()].slice(0, 10),
    interactive: Array.from(scope.querySelectorAll("button,svg,canvas,[role='tablist'],iframe,video"))
      .some(element => !element.closest("[data-brief-exclude],[aria-hidden='true'],[hidden]")),
  });
  if (!result.summary && !result.blocks.length) throw new Error("There is not enough readable content to prepare this section’s brief.");
  return result;
}
