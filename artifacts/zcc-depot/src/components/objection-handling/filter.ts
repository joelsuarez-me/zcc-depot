import type { ObjectionCategory, ObjectionResponse } from "@workspace/api-client-react";

export const ALL_CATEGORIES = "all";

export function normalize(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

export function tokenize(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean);
}

export function objectionHaystack(o: ObjectionResponse, categoryTitle = ""): string {
  return normalize([o.title, o.concern, o.question, o.response, o.proof, o.nextStep, o.avoid, o.escalation, categoryTitle].join(" "));
}

/** Every query token must appear somewhere across the response fields. */
export function matchesQuery(o: ObjectionResponse, query: string, categoryTitle = ""): boolean {
  const tokens = tokenize(query);
  if (!tokens.length) return true;
  const hay = objectionHaystack(o, categoryTitle);
  return tokens.every((t) => hay.includes(t));
}

export function filterObjections(
  objections: readonly ObjectionResponse[],
  categories: readonly ObjectionCategory[],
  opts: { categoryId: string; query: string },
): ObjectionResponse[] {
  const titles = new Map(categories.map((c) => [c.id, c.title]));
  return objections.filter(
    (o) => (opts.categoryId === ALL_CATEGORIES || o.categoryId === opts.categoryId) && matchesQuery(o, opts.query, titles.get(o.categoryId) ?? ""),
  );
}

export function countByCategory(objections: readonly ObjectionResponse[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of objections) out[o.categoryId] = (out[o.categoryId] ?? 0) + 1;
  return out;
}

/** Reads a hash like "#pricing-too-high" and returns the id only if it is a known objection. */
export function objectionIdFromHash(hash: string, ids: ReadonlySet<string>): string | null {
  let raw = hash.replace(/^#/, "");
  try { raw = decodeURIComponent(raw); } catch { /* keep raw */ }
  return raw && ids.has(raw) ? raw : null;
}

export function objectionLink(origin: string, baseUrl: string, id: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${origin}${base}resources/objection-handling#${encodeURIComponent(id)}`;
}

export function formatResponseForCopy(o: ObjectionResponse, categoryTitle?: string): string {
  return [
    `${o.title}${categoryTitle ? ` (${categoryTitle})` : ""}`,
    `Concern: ${o.concern}`,
    `Clarifying question: ${o.question}`,
    `Talk track: ${o.response}`,
    `Proof / demo: ${o.proof}`,
    `Do not promise: ${o.avoid}`,
    `Next step: ${o.nextStep}`,
    `Escalation: ${o.escalation}`,
  ].join("\n");
}
