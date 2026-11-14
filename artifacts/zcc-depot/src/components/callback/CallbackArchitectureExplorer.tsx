import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ARCH_VIEWS, LANES } from "@/data/callback-scenarios";

const LW = 168, VW = 1380;
const LX = (l: number) => 90 + l * 172;
const RY = (r: number) => 80 + r * 100;

export function CallbackArchitectureExplorer() {
  const [vid, setVid] = useState(ARCH_VIEWS[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const v = ARCH_VIEWS.find((x) => x.id === vid)!;
  const pos = Object.fromEntries(v.nodes.map((n) => [n.id, { x: LX(n.lane), y: RY(n.row) }]));
  const sel = v.nodes.find((n) => n.id === open);
  return (
    <div data-testid="arch-explorer">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Architecture views">
        {ARCH_VIEWS.map((x) => <button key={x.id} type="button" role="tab" aria-selected={vid === x.id} className={`cb-tab ${vid === x.id ? "is-on" : ""}`} onClick={() => { setVid(x.id); setOpen(null); }} data-testid={`tab-arch-${x.id}`}>{x.label}</button>)}
      </div>
      <p className="mt-3 max-w-3xl text-sm text-[#11110D]/75" data-testid="text-arch-summary">{v.summary}</p>
      <div className="rt-diagram cb-arch mt-3 is-running">
        <div className="rt-diagram-scroll">
          <svg viewBox={`0 0 ${VW} 320`} role="group" aria-label={`${v.label} architecture`}>
            {LANES.map((l, i) => <g key={l}><rect x={LX(i) - LW / 2 - 2} y={8} width={LW + 4} height={304} rx={12} className={`cb-lane ${i % 2 ? "alt" : ""}`} /><text x={LX(i)} y={28} textAnchor="middle" className="cb-lane-t">{l}</text></g>)}
            <AnimatePresence mode="wait">
              <motion.g key={vid} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {v.edges.map(([a, b, k]) => {
                  const A = pos[a], B = pos[b]; if (!A || !B) return null;
                  const back = B.x < A.x;
                  const d = Math.abs(A.x - B.x) < 10 ? `M${A.x} ${A.y + (B.y > A.y ? 24 : -24)} L${B.x} ${B.y + (B.y > A.y ? -24 : 24)}` : back ? `M${A.x} ${A.y + 24} C${A.x} ${A.y + 80} ${B.x} ${B.y + 80} ${B.x} ${B.y + 24}` : `M${A.x + 70} ${A.y} C${(A.x + B.x) / 2} ${A.y} ${(A.x + B.x) / 2} ${B.y} ${B.x - 72} ${B.y}`;
                  return <g key={a + b} className={`rt-edge is-on ${k === "retry" ? "is-fb" : ""} ${k === "fail" ? "cb-fail" : ""}`}><path d={d} />{!reduce && <circle r={4} className="rt-dot" style={{ offsetPath: `path('${d}')` }} />}</g>;
                })}
                {v.nodes.map((n) => { const p = pos[n.id]; return (
                  <g key={n.id} className={`cb-anode ${open === n.id ? "is-open" : ""}`} tabIndex={0} role="button" aria-pressed={open === n.id} aria-label={`${n.label}: ${n.detail}`} onClick={() => setOpen(open === n.id ? null : n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(open === n.id ? null : n.id); } }} data-testid={`arch-node-${n.id}`}>
                    <rect x={p.x - 70} y={p.y - 24} width={140} height={48} rx={10} /><rect x={p.x - 70} y={p.y - 24} width={6} height={48} rx={3} className="cb-anode-tab" style={{ fill: ["#5B6470", "#3B7DD8", "#3B7DD8", "#2A9192", "#E8862A", "#8457C9", "#3E9B57", "#17494D"][n.lane] }} />
                    <text x={p.x + 3} y={p.y + 5} textAnchor="middle" textLength={n.label.length > 16 ? 120 : undefined} lengthAdjust="spacingAndGlyphs">{n.label}</text>
                  </g>); })}
              </motion.g>
            </AnimatePresence>
          </svg>
        </div>
        <div className="rt-node-detail" aria-live="polite" data-testid="text-arch-detail">
          {sel ? <><strong>{sel.label}</strong><span className="rt-pill">{LANES[sel.lane]}</span><span className="basis-full">{sel.detail}</span>{sel.api && <code className="cb-code basis-full">{sel.api}</code>}</> : <span>Select a node to expand its role and a simulated request or response example.</span>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5" data-testid="arch-states"><span className="cb-mini mr-1">State transitions</span>{v.states.map((s, i) => <span key={s} className="cb-side is-on">{i ? "→ " : ""}{s}</span>)}</div>
    </div>
  );
}
