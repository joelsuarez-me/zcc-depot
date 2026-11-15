import type { EnterpriseFeature } from "@/data/feature-types";
import type { SimDef } from "./types";
import { verificationSim } from "./verification";
import { workspaceSim } from "./workspace";
import { ivrSim } from "./ivr";
import { assistSim } from "./assist";
import { integrationSim } from "./integration";
import { continuitySim } from "./continuity";
import { workforceSim } from "./workforce";
import { lifecycleSim } from "./lifecycle";

const SIMS: Partial<Record<EnterpriseFeature["demo"]["kind"], SimDef>> = {
  verification: verificationSim, workspace: workspaceSim, ivr: ivrSim, assist: assistSim,
  integration: integrationSim, continuity: continuitySim, workforce: workforceSim, lifecycle: lifecycleSim,
};

/** Journey features step through their own architecture graph. */
function journey(f: EnterpriseFeature): SimDef {
  const nodes = f.architecture.nodes;
  return {
    title: f.title,
    stages: nodes.map((n) => n.label),
    scenarioLabel: "Walkthrough",
    scenarios: [{ id: "journey", label: "Architecture walkthrough", summary: "Inspect this feature's configured components. This is a guided tour, not a single serialized caller path.", steps: nodes.map((n, i) => {
      const out = f.architecture.edges.filter((e) => e.from === n.id);
      return {
        stage: i,
        caption: n.detail,
        panels: [{ title: n.label, rows: [["Boundary", n.boundary, "info"] as [string, string, "info"], ...out.map((e) => [e.label || "Next", (nodes.find((x) => x.id === e.to)?.label ?? e.to) + (e.conditional ? " (conditional)" : ""), e.conditional ? "warn" : undefined] as [string, string, "warn" | undefined])] }],
        log: n.label,
      };
    }) }],
    boundary: f.architecture.notes,
  };
}

export function simFor(f: EnterpriseFeature): SimDef {
  return SIMS[f.demo.kind] ?? journey(f);
}
