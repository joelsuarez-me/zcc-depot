/** Ignore tiny differences caused by rounded pixels and entrance animations. */
export function adjacentSection(positions: readonly number[], current: number, direction: -1 | 1): number | undefined {
  return direction === 1
    ? positions.find(position => position > current + 12)
    : [...positions].reverse().find(position => position < current - 12);
}

export function sectionStops(positions: readonly number[], maxScroll: number): number[] {
  const sorted = [0, ...positions, maxScroll]
    .map(position => Math.round(Math.max(0, Math.min(maxScroll, position))))
    .sort((a, b) => a - b);
  return sorted.filter((position, index) => index === 0 || position - sorted[index - 1] > 12);
}

export function sectionAnchorId(label: string, used: ReadonlySet<string>): string {
  const slug = label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
  const base = `section-${slug}`;
  let id = base;
  for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
  return id;
}

/** Assign stable fragments to bespoke sections, without changing their content. */
export function sectionTargets(main: HTMLElement | null): HTMLElement[] {
  if (!main) return [];
  const used = new Set([...document.querySelectorAll<HTMLElement>("[id]")].map(element => element.id));
  const found = new Set<HTMLElement>();
  for (const element of main.querySelectorAll<HTMLElement>("[data-section-nav], h2")) {
    if (!element.getClientRects().length || element.closest('[role="dialog"],[role="alertdialog"],[hidden],[aria-hidden="true"],form')) continue;
    if (element.matches("h2") && element.closest("[data-section-nav]")) continue;
    const target = element.matches("h2") ? element.closest<HTMLElement>("section[id], article[id]") ?? element : element;
    if (!target.id) {
      const label = target.getAttribute("aria-label") || target.querySelector("h2,h3")?.textContent || target.textContent || "section";
      target.id = sectionAnchorId(label, used);
      used.add(target.id);
    }
    found.add(target);
  }
  return [...found];
}
