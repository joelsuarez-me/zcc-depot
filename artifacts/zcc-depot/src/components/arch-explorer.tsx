import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import { ChevronLeft, ChevronRight, Expand, Minus, Pause, Play, Plus, RotateCcw, Scan, X } from "lucide-react";
import { UnitedBrands } from "@/components/united-brands";
import "./arch-explorer.css";
import { ARCH_EDGES, ARCH_LAYERS, ARCH_NODES, ARCH_TOUR, type ArchLayer } from "@/data/arch-model";

const W = 1200, H = 640;

export function ArchExplorer({ compact = false, brands = false }: { compact?: boolean; brands?: boolean }) {
  const [paused, setPaused] = useState(false);
  const [layers, setLayers] = useState<Set<ArchLayer>>(() => new Set(ARCH_LAYERS.map((l) => l.id)));
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tour, setTour] = useState<number | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  const tourStep = tour !== null ? ARCH_TOUR[tour] : null;
  const focus = useMemo(() => new Set(tourStep ? tourStep.nodes : sel ? [sel, ...ARCH_EDGES.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to])] : []), [tourStep, sel]);
  const visible = (layer: ArchLayer) => layers.has(layer);

  const zoom = useCallback((f: number, cx = W / 2, cy = H / 2) => setView((v) => {
    const k = Math.min(2.6, Math.max(0.7, v.k * f));
    return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
  }), []);
  const reset = () => setView({ x: 0, y: 0, k: 1 });

  const toSvg = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H, s: W / r.width };
  };
  const onWheel = (e: RWheelEvent) => { if (!e.ctrlKey && !e.metaKey && !full) return; const p = toSvg(e.clientX, e.clientY); zoom(e.deltaY < 0 ? 1.12 : 0.89, p.x, p.y); };
  const onDown = (e: RPointerEvent) => { if (e.pointerType === "touch" && window.innerWidth < 768) return; if ((e.target as Element).closest("[data-node]")) return; drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }; (e.currentTarget as Element).setPointerCapture(e.pointerId); };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current; if (!d) return;
    const s = W / svgRef.current!.getBoundingClientRect().width;
    const dx = (e.clientX - d.x) * s, dy = (e.clientY - d.y) * s;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onUp = () => { if (drag.current && !drag.current.moved) setSel(null); drag.current = null; };

  const toggleFull = () => {
    const el = rootRef.current; if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen();
    else setFull((f) => !f);
  };
  useEffect(() => {
    const f = () => setFull(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  useEffect(() => {
    if (!tourStep) return;
    setSel(null);
    const pts = tourStep.nodes.map((id) => ARCH_NODES.find((n) => n.id === id)!).filter(Boolean);
    const cx = pts.reduce((a, n) => a + n.x + n.w / 2, 0) / pts.length, cy = pts.reduce((a, n) => a + n.y + n.h / 2, 0) / pts.length;
    const k = tourStep.zoom ?? 1.25;
    setView({ k, x: W / 2 - cx * k, y: H / 2 - cy * k });
  }, [tourStep]);

  const detailId = hover ?? sel;
  const detail = detailId ? ARCH_NODES.find((n) => n.id === detailId) : null;
  const toggleLayer = (l: ArchLayer) => setLayers((s) => { const n = new Set(s); if (n.has(l)) n.delete(l); else n.add(l); return n; });

  return (
    <div ref={rootRef} className={`arx arx-pro ${paused ? "is-paused" : ""} ${full ? "is-full" : ""} ${compact ? "is-compact" : ""}`} data-testid="arch-explorer">
      {brands && !full && <div className="px-4 pt-3"><UnitedBrands paused={paused} /></div>}
      <div className="arx-toolbar">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Diagram layers">
          {ARCH_LAYERS.map((l) => (
            <button key={l.id} type="button" aria-pressed={layers.has(l.id)} onClick={() => toggleLayer(l.id)} className="arx-chip" data-testid={`button-layer-${l.id}`}>
              <span className="arx-swatch" style={{ background: l.color, borderStyle: l.id === "security" || l.id === "conceptual" ? "dashed" : "solid" }} aria-hidden />{l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="arx-tool" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Resume motion" : "Pause motion"} title={paused ? "Resume motion" : "Pause motion"} data-testid="button-arch-motion">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
          <button type="button" className="arx-tool" onClick={() => zoom(1.2)} aria-label="Zoom in" data-testid="button-arch-zoom-in"><Plus className="h-4 w-4" /></button>
          <button type="button" className="arx-tool" onClick={() => zoom(0.83)} aria-label="Zoom out" data-testid="button-arch-zoom-out"><Minus className="h-4 w-4" /></button>
          <button type="button" className="arx-tool" onClick={reset} aria-label="Fit diagram" data-testid="button-arch-fit"><Scan className="h-4 w-4" /></button>
          <button type="button" className="arx-tool" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} data-testid="button-arch-fullscreen">{full ? <X className="h-4 w-4" /> : <Expand className="h-4 w-4" />}</button>
        </div>
      </div>

      <div className="arx-body">
        <div className="arx-hint" aria-hidden><i />Scroll sideways to see the full diagram</div>
        <div className="arx-canvas">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="arx-svg" role="group" aria-label="Interactive Zendesk Contact Center architecture. Drag to pan; use the zoom buttons or Ctrl plus scroll to zoom."
            onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
              <pattern id="arx-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#11110D" opacity=".14" style={{ fill: "#D1F470" }} /></pattern>
              <marker id="arx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" className="arx-arrowhead" /></marker>
            </defs>
            <rect width={W} height={H} fill="url(#arx-dots)" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`} style={{ transition: drag.current ? "none" : "transform .45s cubic-bezier(.2,.7,.2,1)" }}>
              {visible("security") && (
                <g aria-hidden>
                  <rect x={300} y={40} width={560} height={560} rx={28} className="arx-boundary" />
                  <text x={322} y={68} className="arx-boundary-label">CUSTOMER AWS ACCOUNT · data boundary</text>
                  <rect x={890} y={40} width={290} height={560} rx={28} className="arx-boundary is-z" />
                  <text x={912} y={68} className="arx-boundary-label">ZENDESK</text>
                </g>
              )}
              <g aria-hidden>
                {ARCH_EDGES.map((e) => {
                  const a = ARCH_NODES.find((n) => n.id === e.from)!, b = ARCH_NODES.find((n) => n.id === e.to)!;
                  if (!visible(a.layer) || !visible(b.layer)) return null;
                  const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
                  const back = x2 < x1;
                  const sx = back ? a.x : x1, ex = back ? b.x + b.w : x2;
                  const mx = (sx + ex) / 2;
                  const d = `M${sx} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${ex} ${y2}`;
                  const on = focus.has(e.from) && focus.has(e.to) && (focus.size > 0);
                  const dim = focus.size > 0 && !on;
                  return (
                    <g key={e.from + e.to} className={`arx-edge ${on ? "on" : ""} ${dim ? "dim" : ""} ${e.conceptual ? "concept" : ""}`}>
                      <path d={d} markerEnd="url(#arx-arrow)" />
                      <path d={d} className="arx-flow" />
                    </g>
                  );
                })}
              </g>
              {ARCH_NODES.map((n) => {
                if (!visible(n.layer)) return null;
                const layer = ARCH_LAYERS.find((l) => l.id === n.layer)!;
                const on = focus.has(n.id), dim = focus.size > 0 && !on;
                return (
                  <g key={n.id} data-node className={`arx-node ${on ? "on" : ""} ${dim ? "dim" : ""} ${sel === n.id ? "sel" : ""} ${n.layer === "conceptual" ? "concept" : ""}`} tabIndex={0} role="button"
                    aria-pressed={sel === n.id} aria-label={`${n.t}. ${layer.label}. ${n.short}`}
                    onClick={() => { setTour(null); setSel((s) => (s === n.id ? null : n.id)); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTour(null); setSel((s) => (s === n.id ? null : n.id)); } }}
                    onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                    data-testid={`node-arch-${n.id}`}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} className="arx-card" />
                    <rect x={n.x} y={n.y} width={6} height={n.h} rx={2.5} fill={layer.color} />
                    <circle cx={n.x + n.w - 14} cy={n.y + 14} r={3.5} className="arx-pulse" style={{ animationDelay: `${(n.x + n.y) % 7 * -0.45}s` }} />
                    <text x={n.x + 16} y={n.y + 24} className="arx-t">{n.t}</text>
                    <text x={n.x + 16} y={n.y + 42} className="arx-s">{n.sub}</text>
                  </g>
                );
              })}
            </g>
          </svg>
          {detail && hover && hover !== sel && (
            <div className="arx-tip" role="tooltip"><strong>{detail.t}</strong><span>{detail.short}</span></div>
          )}
        </div>

        <aside className="arx-panel" aria-live="polite" data-testid="panel-arch-detail">
          <div>
          {tourStep ? (
            <>
              <div className="eyebrow text-[#11110D]/50">Guided tour · {tour! + 1} of {ARCH_TOUR.length}</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{tourStep.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#11110D]/72">{tourStep.d}</p>
              {tourStep.label && <span className={`arx-status mt-3 ${tourStep.label === "Conceptual" ? "is-concept" : ""}`}>{tourStep.label}</span>}
            </>
          ) : sel && detail ? (
            <>
              <div className="eyebrow text-[#11110D]/50">{ARCH_LAYERS.find((l) => l.id === detail.layer)!.label}</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{detail.t}</h3>
              <p className="mono mt-1 text-xs text-[#11110D]/50">{detail.sub}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#11110D]/75">{detail.d}</p>
              {detail.status && <span className={`arx-status mt-3 ${detail.status === "Conceptual" ? "is-concept" : ""}`}>{detail.status}</span>}
              <details className="arx-more mt-4">
                <summary>Technical detail</summary>
                <ul className="mt-2 space-y-1.5">{detail.tech.map((t) => <li key={t} className="text-sm text-[#11110D]/72">{t}</li>)}</ul>
              </details>
              <div className="mt-4 text-xs text-[#11110D]/55">Connected to: {ARCH_EDGES.filter((e) => e.from === detail.id || e.to === detail.id).map((e) => ARCH_NODES.find((n) => n.id === (e.from === detail.id ? e.to : e.from))!.t).join(", ")}</div>
            </>
          ) : (
            <>
              <div className="eyebrow text-[#11110D]/50">Explore</div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Select any component</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">Hover for a summary, select for connections and technical detail, or start the guided tour. Toggle layers to isolate AWS services, AI, or the security boundary.</p>
            </>
          )}
          </div>
          <div className="arx-tourbar mt-5 flex items-center gap-1.5 border-t border-[#11110D]/10 pt-4">
            <button type="button" className="arx-tool" onClick={() => setTour((t) => (t === null ? ARCH_TOUR.length - 1 : Math.max(0, t - 1)))} aria-label="Previous tour step" data-testid="button-tour-prev"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" className="depot-btn depot-btn-ink flex-1 justify-center" onClick={() => setTour((t) => (t === null ? 0 : Math.min(ARCH_TOUR.length - 1, t + 1)))} data-testid="button-tour-next">
              {tour === null ? "Start guided tour" : tour === ARCH_TOUR.length - 1 ? "Tour complete" : "Next"}<ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" className="arx-tool" onClick={() => { setTour(null); setSel(null); reset(); }} aria-label="Reset tour" data-testid="button-tour-reset"><RotateCcw className="h-4 w-4" /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
