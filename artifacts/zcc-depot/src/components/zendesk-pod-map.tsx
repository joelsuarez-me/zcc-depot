import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Pause, Play, RotateCcw } from "lucide-react";
import { LAND, POD_PRINCIPLES, POD_REGIONS, REFERENCE_FIGURES, REFERENCE_FOOTPRINT } from "@/data/zendesk-pods";
import "./zendesk-pod-map.css";

const W = 1000, H = 440, TOP = 86, SPAN = 146;
const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((TOP - lat) / SPAN) * H;

function inside(pt: [number, number], poly: [number, number][]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const DOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let lat = 78; lat > -58; lat -= 2.5)
    for (let lon = -178; lon < 180; lon += 2.5)
      if (LAND.some((p) => inside([lon, lat], p))) out.push([px(lon), py(lat)]);
  return out;
})();

const ARCS: [string, string][] = [["oregon", "ohio"], ["ohio", "n-virginia"], ["n-virginia", "ireland"], ["ireland", "frankfurt"], ["london", "frankfurt"], ["frankfurt", "tokyo"], ["tokyo", "osaka"], ["osaka", "sydney"], ["oregon", "tokyo"]];

export function ZendeskPodMap() {
  const [sel, setSel] = useState("n-virginia");
  const [paused, setPaused] = useState(false);
  const [incident, setIncident] = useState<string | null>(null);
  const region = POD_REGIONS.find((r) => r.id === sel)!;
  const pos = useMemo(() => Object.fromEntries(POD_REGIONS.map((r) => [r.id, [px(r.lon), py(r.lat)] as const])), []);
  const arcs = useMemo(() => ARCS.map(([a, b]) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b];
    const wrap = a === "oregon" && b === "tokyo";
    if (wrap) return { id: `${a}-${b}`, d: `M${x1} ${y1} Q ${x1 - 60} ${y1 - 40} 0 ${y1 + 10}`, d2: `M${W} ${y1 + 10} Q ${x2 + 40} ${y2 - 30} ${x2} ${y2}` };
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.max(18, Math.abs(x2 - x1) * 0.18);
    return { id: `${a}-${b}`, d: `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}` };
  }), [pos]);

  const status = (id: string) => (incident === id ? "degraded" : "operating");
  const toggleIncident = () => setIncident((c) => (c === sel ? null : sel));

  return (
    <div className={`zpm ${paused ? "is-paused" : ""} ${incident ? "has-incident" : ""}`} data-testid="zendesk-pod-map">
      <div className="zpm-head">
        <div className="zpm-figs" aria-label="Figures from supplied reference slide">
          {REFERENCE_FIGURES.map((f) => <div key={f.l} className="zpm-fig" data-testid={`text-figure-${f.l.replace(/\s+/g, "-")}`}><b>{f.v}</b><span>{f.l}</span></div>)}
          <span className="zpm-src">Reference-slide figures. Not live or independently verified.</span>
        </div>
        <button type="button" className="zpm-btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused} data-testid="button-pod-motion">
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}{paused ? "Resume signals" : "Pause signals"}
        </button>
      </div>

      <div className="zpm-grid">
        <div className="zpm-mapwrap">
          <p className="zpm-scroll-hint">Swipe or scroll sideways to explore the map.</p>
          <div className="zpm-scroll" tabIndex={0} aria-label="World map of reference locations. Scroll horizontally on small screens.">
            <svg viewBox={`0 0 ${W} ${H}`} className="zpm-svg" role="group" aria-label="Reference Pod locations">
              <g className="zpm-land" aria-hidden>{DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.6} />)}</g>
              <g aria-hidden>
                {arcs.map((a) => (
                  <g key={a.id} className={`zpm-arc ${incident && a.id.includes(incident) ? "is-dim" : ""}`}>
                    <path d={a.d} />{a.d2 && <path d={a.d2} />}
                    <circle r={3.4} className="zpm-sig" style={{ offsetPath: `path('${a.d}')` }} />
                  </g>
                ))}
              </g>
              {POD_REGIONS.map((r) => {
                const [x, y] = pos[r.id];
                const on = r.id === sel, st = status(r.id);
                const lw = r.name.length * 7.2 + 16;
                const lx = r.anchor === "end" ? x + r.dx - lw : x + r.dx;
                return (
                  <g key={r.id} className={`zpm-node ${on ? "is-sel" : ""} is-${st}`} tabIndex={0} role="button" aria-pressed={on}
                    aria-label={`${r.name}, illustrative Pod ${st} in demo`} onClick={() => setSel(r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(r.id); } }} data-testid={`map-node-${r.id}`}>
                    <circle cx={x} cy={y} r={14} className="zpm-ring" />
                    <circle cx={x} cy={y} r={5.5} className="zpm-core" />
                    <line x1={x} y1={y} x2={lx + (r.anchor === "end" ? lw : 0)} y2={y + r.dy - 4} className="zpm-lead" />
                    <rect x={lx} y={y + r.dy - 15} width={lw} height={21} rx={3} className="zpm-tag" />
                    <text x={lx + 8} y={y + r.dy} className="zpm-tagt">{r.name.toUpperCase()}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="zpm-foot">
            {REFERENCE_FOOTPRINT.map((f, i) => <div key={f.l} className={`zpm-band b${i}`}><b>{f.v}</b> {f.l}</div>)}
          </div>
          <p className="zpm-cap">Supplied reference schematic, not a verified current footprint. Markers and signal lines are illustrative only, not placement promises or routing topology; not every region is offered for every product or plan.</p>
        </div>

        <aside className="zpm-panel" aria-live="polite">
          <div className="zpm-sel" role="group" aria-label="Select reference location">
            {POD_REGIONS.map((r) => (
              <button key={r.id} type="button" aria-pressed={r.id === sel} onClick={() => setSel(r.id)}
                className={`zpm-pill is-${status(r.id)}`} data-testid={`button-region-${r.id}`}><i aria-hidden />{r.name}</button>
            ))}
          </div>
          <div className="zpm-detail" data-testid="text-region-detail">
            <div className="zpm-area">{region.area} · reference location</div>
            <h3>{region.name}</h3>
            <p>{region.note} Region availability, data center selection, and hosting depend on product, account plan, contractual hosting options, and availability. Confirm with Zendesk before positioning a location.</p>
            <div className={`zpm-state is-${status(sel)}`} data-testid="status-selected-pod">
              {status(sel) === "degraded" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <i aria-hidden />}
              Illustrative Pod: {status(sel) === "degraded" ? "simulated incident" : "operating in demo"}
            </div>
          </div>
          <div className="zpm-sim">
            <div className="zpm-simk">Pod isolation simulation</div>
            <p>Illustrative only. Not live status, and no automatic cross-Pod failover is implied.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="zpm-btn is-red" onClick={toggleIncident} aria-pressed={incident === sel} data-testid="button-toggle-incident">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />{incident === sel ? "Clear incident" : `Simulate incident in ${region.name}`}
              </button>
              <button type="button" className="zpm-btn" onClick={() => setIncident(null)} disabled={!incident} data-testid="button-reset-incident"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Reset</button>
            </div>
            {incident && <p className="zpm-result" data-testid="text-incident-result">In this demo, {POD_REGIONS.find((r) => r.id === incident)!.name} is degraded while the other {POD_REGIONS.length - 1} represented Pods keep operating. Real incidents can still span Pods through shared dependencies.</p>}
          </div>
        </aside>
      </div>

      <div className="zpm-cards">
        {POD_PRINCIPLES.map((p, i) => (
          <div key={p.k} className={`zpm-card c${i}`} data-testid={`card-pod-principle-${i}`}>
            <span>{p.k}</span><h4>{p.t}</h4><p>{p.d}</p>
          </div>
        ))}
      </div>
      <p className="zpm-trust">Validate figures, hosting locations, and resilience commitments with the official <a href="https://www.zendesk.com/trust-center/" target="_blank" rel="noreferrer" className="underline" data-testid="link-zendesk-trust">Zendesk Trust Center<ExternalLink className="ml-1 inline h-3 w-3" aria-hidden /></a>, the <a href="https://support.zendesk.com/hc/en-us/articles/4408883599130" target="_blank" rel="noreferrer" className="underline">Regional Data Hosting Policy</a> and your contract. The supplied-slide scale figures and marker locations are historical reference material, not verified current infrastructure counts.</p>
    </div>
  );
}
