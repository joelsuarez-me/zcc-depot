import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/components/system-data-flow.css", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/components/system-data-flow.tsx", import.meta.url), "utf8");
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):(#[\da-f]{6})/gi)].map(match => [match[1], match[2]]));
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("Diagram labels meet text contrast requirements on light and dark cards", () => {
  for (const [foreground, background] of [
    [colors.forest, "#FFFFFF"],
    ["#FFFFFF", colors.forest],
    ["#52675C", "#FFFFFF"],
    ["#52675C", "#E8F3E8"],
    ["#52675C", "#E4F1E3"],
    [colors.ink, colors.lime],
    ["#E0EBE2", "#53695B"],
  ]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
});

test("All animated connection colors contrast with both cloud backgrounds", () => {
  for (const kind of ["auth", "controls", "context", "records"]) {
    const color = colors[`k-${kind}`];
    assert.ok(component.includes(`${kind}: "${color}"`), `${kind} marker and path colors must match`);
    for (const background of ["#E8F3E8", "#FAFCF8", "#F4F7EF"]) {
      assert.ok(contrast(color, background) >= 3, `${kind} on ${background}`);
    }
  }
});

test("Primary selected nodes retain their light selection background and dark labels", () => {
  assert.match(css, /\.sdf-node\.primary\.sel rect\.card\{fill:var\(--lime\);stroke:var\(--forest\)\}/);
  assert.match(css, /\.sdf-node\.sel text\{fill:var\(--ink\)!important\}/);
});
