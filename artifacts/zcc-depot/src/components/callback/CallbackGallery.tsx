import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ScenarioId } from "@/lib/callback-engine";
import { CATEGORIES, SCENARIOS, type Scenario } from "@/data/callback-scenarios";
import { KIND } from "./CallbackDiagram";

function Glyph({ sc }: { sc: Scenario }) {
  // A miniature of the scenario's real topology: same nodes, same edges.
  const xs = sc.nodes.map((n) => n.x), ys = sc.nodes.map((n) => n.y);
  const mx = Math.max(...xs) || 1, my = Math.max(...ys) || 1;
  const P = (n: { x: number; y: number }) => ({ x: 8 + (n.x / mx) * 184, y: 8 + (n.y / my) * 44 });
  const by = Object.fromEntries(sc.nodes.map((n) => [n.id, P(n)]));
  return (
    <svg viewBox="0 0 200 60" className="cb-glyph" aria-hidden>
      {sc.edges.map(([a, b, k]) => by[a] && by[b] && <line key={a + b} x1={by[a].x} y1={by[a].y} x2={by[b].x} y2={by[b].y} className={k === "fail" ? "g-fail" : k === "retry" ? "g-retry" : ""} />)}
      {sc.nodes.map((n) => <rect key={n.id} x={by[n.id].x - 5} y={by[n.id].y - 4} width={10} height={8} rx={2} fill={KIND[n.kind].tab} />)}
    </svg>
  );
}

export function CallbackGallery({ current, onPick }: { current: ScenarioId; onPick: (id: ScenarioId) => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-6">
      {(Object.keys(CATEGORIES) as Scenario["cat"][]).map((cat) => (
        <div key={cat}>
          <h3 className="rt-h">Category {cat} · {CATEGORIES[cat]}</h3>
          <div className="rt-gallery">
            {SCENARIOS.filter((s) => s.cat === cat).map((s, i) => (
              <motion.button key={s.id} type="button" className={`rt-card cb-card ${current === s.id ? "is-on" : ""}`} style={{ ["--cb-accent" as string]: s.accent }} onClick={() => onPick(s.id)} aria-pressed={current === s.id} data-testid={`card-scenario-${s.id}`}
                initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <span className="flex items-center justify-between gap-2"><span className="mono text-xs opacity-70">{String(s.n).padStart(2, "0")}</span><span className={`cb-nature ${s.nature === "Custom pattern" ? "is-custom" : ""}`}>{s.nature}</span></span>
                <Glyph sc={s} />
                <strong className="block text-[0.98rem] leading-snug">{s.title}</strong>
                <span className="mt-1 block text-sm opacity-75">{s.tagline}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Load into simulator<ArrowRight className="h-3 w-3" aria-hidden /></span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
