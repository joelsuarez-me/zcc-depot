import { useMemo, useState, type KeyboardEvent } from "react";
import { BarChart3, Building2, Database, FileStack, Headset, IdCard, KeyRound, LayoutDashboard, Pause, Phone, Play, RotateCcw, Search, Server, Sparkles, UserCheck, Volume2, Waves, Webhook, type LucideIcon } from "lucide-react";
import { Ext } from "@/components/kit";
import { SO_DOCS, SO_DOC_LABEL, SO_EDGES, SO_GROUPS, SO_H, SO_JOURNEYS, SO_NH, SO_NODES, SO_W, type SoEdge, type SoNode } from "@/data/system-overview";
import "./system-overview-diagram.css";

const ICONS: Record<string, LucideIcon> = { idp: Building2, zcc: LayoutDashboard, search: Search, status: UserCheck, analytics: Headset, reporting: BarChart3, cognito: KeyRound, apigw: Webhook, connect: Phone, profiles: IdCard, external: Database, lex: Waves, polly: Volume2, bedrock: Sparkles, records: FileStack, lambdar: Server };
const byId = (id: string) => SO_NODES.find((n) => n.id === id)!;

function edgePath(e: SoEdge) {
  if (e.id === "zcc-status") return "M650 60 C650 8, 1065 8, 1065 44";
  const a = byId(e.from), b = byId(e.to);
  if (e.mode === "v") {
    const up = b.y < a.y;
    const x1 = a.x + a.w / 2 + (e.ox ?? 0), y1 = up ? a.y : a.y + SO_NH;
    const x2 = b.x + b.w / 2, y2 = up ? b.y + SO_NH : b.y;
    const my = (y1 + y2) / 2;
    return `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }
  const back = b.x < a.x;
  const sx = back ? a.x : a.x + a.w, ex = back ? b.x + b.w : b.x;
  const y1 = a.y + SO_NH / 2 + (e.sy ?? 0), y2 = b.y + SO_NH / 2;
  const mx = (sx + ex) / 2;
  return `M${sx} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${ex} ${y2}`;
}

function Node({ n, state, onPick }: { n: SoNode; state: string; onPick: (id: string) => void }) {
  const c = SO_GROUPS[n.group], Icon = ICONS[n.id], tx = n.x + 30, h = SO_NH;
  const limit = Math.floor((n.w - 78) / 6.8);
  const words = n.t.split(" ");
  const lines = n.t.length <= limit ? [n.t] : (() => {
    let best = 1;
    for (let i = 2; i < words.length; i++) {
      if (Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length) <
        Math.max(words.slice(0, best).join(" ").length, words.slice(best).join(" ").length)) best = i;
    }
    return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  })();
  const key = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(n.id); } };
  return (
    <g className={`sov-n ${state} ${n.optional ? "opt" : ""}`} tabIndex={0} role="button" aria-label={`${n.t}, ${n.sub}${n.optional ? ", optional" : ""}`}
      aria-pressed={state.includes("sel")} onClick={() => onPick(n.id)} onKeyDown={key} data-testid={`node-sov-${n.id}`}>
      <rect x={n.x} y={n.y} width={n.w} height={h} rx={10} className="sov-card" />
      <path d={`M${n.x + 10} ${n.y} h16 v${h} h-16 a10 10 0 0 1 -10 -10 v${-(h - 20)} a10 10 0 0 1 10 -10z`} fill={c.tab} />
      <text transform={`translate(${n.x + 17} ${n.y + h / 2}) rotate(-90)`} textAnchor="middle" className="sov-tab">{n.optional && n.group !== "ai" ? "Optional" : c.tag}</text>
      <path d={`M${tx} ${n.y + 46} H${n.x + n.w} V${n.y + h - 10} a10 10 0 0 1 -10 10 H${tx} Z`} fill={c.pale} />
      <line x1={tx} x2={n.x + n.w} y1={n.y + 46} y2={n.y + 46} className="sov-rule" />
      <Icon x={tx + 8} y={n.y + 12} width={21} height={21} strokeWidth={1.6} className="sov-ico" aria-hidden />
      <text x={tx + 36} y={n.y + (lines.length > 1 ? 19 : 28)} className={`sov-t ${lines.length > 1 ? "two-lines" : ""}`}>
        {lines.map((line, i) => <tspan key={line} x={tx + 36} dy={i ? 14 : 0}>{line}</tspan>)}
      </text>
      <text x={tx + (n.w - 30) / 2} y={n.y + 64} textAnchor="middle" className="sov-s">{n.sub}</text>
      <rect x={n.x} y={n.y} width={n.w} height={h} rx={10} className="sov-ol" />
    </g>
  );
}

export function SystemOverviewDiagram() {
  const [sel, setSel] = useState<string | null>(null);
  const [journey, setJourney] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const j = SO_JOURNEYS.find((x) => x.id === journey);
  const focus = useMemo(() => {
    if (j) return new Set<string>(j.nodes);
    if (sel) return new Set([sel, ...SO_EDGES.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to])]);
    return null;
  }, [j, sel]);
  const pick = (id: string) => { setJourney(null); setSel((s) => (s === id ? null : id)); };
  const nd = sel ? byId(sel) : null;
  const zt = SO_NODES.filter((n) => n.group === "zendesk" && n.id !== "zcc");

  return (
    <div className={`sov ${paused ? "paused" : ""}`} data-testid="system-overview-diagram">
      <div className="sov-bar">
        <div className="sov-chips" role="group" aria-label="Journey highlights">
          <button type="button" className="sov-chip" aria-pressed={!journey && !sel} onClick={() => { setJourney(null); setSel(null); }} data-testid="button-sov-overview"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Overview</button>
          {SO_JOURNEYS.map((x) => (
            <button key={x.id} type="button" className="sov-chip" aria-pressed={journey === x.id} onClick={() => { setSel(null); setJourney(journey === x.id ? null : x.id); }} data-testid={`button-sov-journey-${x.id}`}>{x.t}</button>
          ))}
        </div>
        <button type="button" className="sov-tool" aria-pressed={paused} onClick={() => setPaused((p) => !p)} data-testid="button-sov-motion">
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}{paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="sov-scroll" tabIndex={0} aria-label="System overview diagram; scrolls horizontally on small screens">
        <svg viewBox={`0 0 ${SO_W} ${SO_H}`} className="sov-svg" role="group" aria-label="Zendesk Contact Center system overview and data flow. Illustrative, not live infrastructure.">
          <defs>
            <marker id="sov-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" className="sov-ah" /></marker>
          </defs>
          <g aria-hidden>
            <rect x={250} y={14} width={934} height={238} rx={22} className="sov-bnd z" />
            <text x={270} y={40} className="sov-bl">ZENDESK-OPERATED ENVIRONMENT</text>
            <text x={270} y={56} className="sov-bn">SaaS, Agent Workspace</text>
            <rect x={776} y={30} width={400} height={200} rx={14} className="sov-bnd z" style={{ fill: "#fff" }} />
            <text x={790} y={246} className="sov-bn">Agent Workspace capabilities</text>
            <rect x={16} y={276} width={1168} height={484} rx={22} className="sov-bnd c" />
            <text x={36} y={302} className="sov-bl">CUSTOMER-MANAGED AWS ACCOUNT</text>
            <text x={36} y={318} className="sov-bn">Customer data boundary, config-dependent</text>
            <rect x={28} y={618} width={540} height={130} rx={14} className="sov-bnd o" />
            <text x={40} y={638} className="sov-bn">Optional, configuration-dependent</text>
            <text x={24} y={56} className="sov-bn">Upstream corporate</text>
          </g>
          <g aria-hidden>
            {SO_EDGES.map((e, i) => {
              const d = edgePath(e);
              const on = !!focus && focus.has(e.from) && focus.has(e.to);
              const dim = !!focus && !on;
              return (
                <g key={e.id} className={`sov-e ${on ? "on" : ""} ${dim ? "dim" : ""} ${e.optional ? "opt" : ""}`}>
                  <path d={d} className="l" markerEnd="url(#sov-arrow)" />
                  <circle r={4.2} className="sov-dot" style={{ offsetPath: `path('${d}')`, animationDelay: `${(i * -0.47) % 3.2}s` }} />
                </g>
              );
            })}
          </g>
          {SO_NODES.map((n) => {
            const st = `${focus?.has(n.id) ? "on" : focus ? "dim" : ""} ${sel === n.id ? "sel" : ""}`;
            return <Node key={n.id} n={n} state={st} onPick={pick} />;
          })}
        </svg>
      </div>
      <div className="sov-foot">
        <div aria-live="polite" className="sov-detail" data-testid="panel-sov-detail">
          {nd ? (
            <>
              <div className="eyebrow text-[#111317]/55">{SO_GROUPS[nd.group].tag}{nd.optional ? " · optional" : ""}</div>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight">{nd.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#111317]/78">{nd.d}</p>
              <ul className="mt-3 space-y-1 text-sm text-[#111317]/72">
                {SO_EDGES.filter((e) => e.from === nd.id || e.to === nd.id).map((e) => (
                  <li key={e.id}>{e.from === nd.id ? "To" : "From"} <strong>{byId(e.from === nd.id ? e.to : e.from).t}</strong>: {e.label}{e.optional ? " (optional)" : ""}</li>
                ))}
              </ul>
              <Ext href={SO_DOCS[nd.doc]} className="mt-3 text-sm font-semibold underline" testId={`link-sov-doc-${nd.id}`}>{SO_DOC_LABEL[nd.doc]}</Ext>
            </>
          ) : j ? (
            <>
              <div className="eyebrow text-[#111317]/55">Journey</div>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight">{j.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#111317]/78">{j.d}</p>
            </>
          ) : (
            <>
              <div className="eyebrow text-[#111317]/55">Overview</div>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight">Select any module</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#111317]/78">Click or press Enter on a module to reveal its role and connected paths, or choose a journey above. {zt.length} Workspace capabilities sit beside Contact Center in the Zendesk environment.</p>
            </>
          )}
        </div>
        <div className="sov-legend" aria-label="Legend">
          <span><svg width="26" height="8" aria-hidden><line x1="0" y1="4" x2="26" y2="4" stroke="#2B2F36" strokeWidth="1.4" /></svg>Directional connector</span>
          <span><svg width="26" height="8" aria-hidden><line x1="0" y1="4" x2="26" y2="4" stroke="#2B2F36" strokeWidth="1.4" strokeDasharray="4 4" /></svg>Optional element</span>
          <span><svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="4" fill="#E0352B" /></svg>Signal direction (illustrative)</span>
          <span><svg width="26" height="12" aria-hidden><rect x="1" y="1" width="24" height="10" rx="3" fill="#F3FAF5" stroke="#3E9B57" strokeDasharray="3 3" /></svg>Zendesk boundary</span>
          <span><svg width="26" height="12" aria-hidden><rect x="1" y="1" width="24" height="10" rx="3" fill="#F8F9FA" stroke="#2B2F36" strokeDasharray="3 3" /></svg>Customer AWS boundary</span>
        </div>
      </div>
    </div>
  );
}

export default SystemOverviewDiagram;
