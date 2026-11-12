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
