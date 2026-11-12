import assert from "node:assert/strict";
import { test } from "node:test";
import { NAV, isNavItemActive } from "../src/data/navigation.ts";

test("main menu keeps Resources unchanged as its final destination", () => {
  assert.deepEqual(NAV.map(n => n.label), ["Overview", "Architecture", "Sales", "Demos", "Resources"]);
  assert.equal(NAV.at(-1).href, "/resources");
  assert.equal(NAV[0].children[1].href, "/architecture#journey");
});

test("Sales and Demos contain the exact requested destinations and sequence", () => {
  assert.deepEqual(NAV[2].children.map(n => [n.label, n.href]), [
    ["Sell Sheet", "/sell-sheet"], ["Pricing", "/pricing"],
  ]);
  assert.deepEqual(NAV[3].children.map(n => [n.label, n.href]), [
    ["01 Demo Methodology", "/demos#agenda"],
    ["02 Demo Click-Through", "/demos#guided-demo"],
    ["03 Demo Instance Details", "/demos/instance-details"],
    ["04 Demo Researcher", "/demos/brief"],
    ["05 Demo Agenda", "/agenda"],
  ]);
});

test("nested routes highlight their new parent without activating Overview twice", () => {
  for (const path of ["/sell-sheet", "/pricing"]) assert.equal(isNavItemActive(NAV[2], path), true);
  for (const path of ["/agenda", "/demos/brief", "/demos/instance-details"]) assert.equal(isNavItemActive(NAV[3], path), true);
  assert.equal(isNavItemActive(NAV[0], "/architecture"), false);
  assert.equal(isNavItemActive(NAV[1], "/architecture"), true);
  assert.equal(isNavItemActive(NAV[2], "/salesman"), false);
});
