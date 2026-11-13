import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { CORE_COMPONENTS, type ComponentTerm } from "@/data/content";
import { SectionLink } from "@/components/section-link";
import { componentDocumentation } from "@/lib/component-documentation";
import "./component-showcase.css";

type Comp = (typeof CORE_COMPONENTS)[number];
const IDS = ["component-connect", "component-app", "component-identity", "component-cloudformation"];

function useReduced() {
  const [r, setR] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/** True only while the element is on screen and the tab is visible. */
function useLive<T extends Element>() {
  const ref = useRef<T>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let vis = !document.hidden; let inView = false;
    const sync = () => setLive(vis && inView);
    const onVis = () => { vis = !document.hidden; sync(); };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return { ref, live };
}

/** Auto-advancing step index that only ticks while running. */
function useAuto(count: number, running: boolean, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [running, count, ms]);
  return [i, setI] as const;
}

type IllProps = { running: boolean; onInteract: () => void };

/* ---------- Amazon Connect: contact routed through a flow into queues ---------- */
function ConnectIll({ running, onInteract }: IllProps) {
  const [channel, setChannel] = useState<"voice" | "chat">("voice");
  const [stage, setStage] = useAuto(4, running, 1400);
  const labels = ["Contact arrives", "Contact flow runs", "Queue selected", "Routed to agent"];
  return (
    <>
      <svg viewBox="0 0 360 170" className="cs-svg" aria-hidden>
        <defs><linearGradient id="cs-c-g" x1="0" x2="1"><stop offset="0" stopColor="#D1F470" stopOpacity=".1" /><stop offset="1" stopColor="#D1F470" stopOpacity=".7" /></linearGradient></defs>
        <g className={`cs-c-src ${stage === 0 ? "on" : ""}`}>
          <rect x="14" y="62" width="56" height="46" rx="12" />
          {channel === "voice"
            ? <path d="M32 76c0 10 8 18 18 18l4-5-6-4-3 3c-3-1-6-4-7-7l3-3-4-6z" className="cs-glyph" />
            : <path d="M30 76h22a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-12l-6 5v-5h-4a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3z" className="cs-glyph" />}
        </g>
        <path d="M70 85 H120" className="cs-wire" />
        <g className={`cs-c-flow ${stage === 1 ? "on" : ""}`}>
          <path d="M150 50 L182 85 L150 120 L118 85 Z" />
          <text x="150" y="89" textAnchor="middle">flow</text>
        </g>
        {[38, 85, 132].map((y, k) => (
          <g key={y}>
            <path d={`M182 85 C210 85 210 ${y} 236 ${y}`} className={`cs-wire ${stage >= 2 && k === (channel === "voice" ? 0 : 2) ? "hot" : ""}`} />
            <g className={`cs-c-q ${stage >= 2 && k === (channel === "voice" ? 0 : 2) ? "on" : ""}`}>
              <rect x="236" y={y - 13} width="70" height="26" rx="8" />
              {[0, 1, 2].map((d) => <circle key={d} cx={250 + d * 12} cy={y} r="3.5" />)}
              <text x="298" y={y + 4} textAnchor="end">Q{k + 1}</text>
            </g>
          </g>
        ))}
        <g className={`cs-c-agent ${stage === 3 ? "on" : ""}`}>
          <circle cx="336" cy={channel === "voice" ? 38 : 132} r="14" />
          <circle cx="336" cy={(channel === "voice" ? 38 : 132) - 3} r="4.5" className="cs-glyph-fill" />
        </g>
        <circle r="5" className="cs-pulse" style={{ offsetPath: `path("M42 85 H150 L182 85 C210 85 210 ${channel === "voice" ? 38 : 132} 236 ${channel === "voice" ? 38 : 132} H336")` }} />
      </svg>
      <div className="cs-tools">
        <div className="cs-seg" role="group" aria-label="Illustrative channel">
          {(["voice", "chat"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={channel === c} onClick={() => { onInteract(); setChannel(c); setStage(0); }} data-testid={`button-connect-${c}`}>{c === "voice" ? "Voice" : "Chat"}</button>
          ))}
        </div>
        <button type="button" className="cs-btn" onClick={() => { onInteract(); setStage((s) => (s + 1) % 4); }} data-testid="button-connect-step">Next: {labels[(stage + 1) % 4]}</button>
      </div>
      <p className="cs-caption" aria-live={running ? "off" : "polite"}>{labels[stage]}</p>
    </>
  );
}

/* ---------- Contact Center app: agent workspace with switchable surfaces ---------- */
function AppIll({ running, onInteract }: IllProps) {
  const tabs = ["Call", "Messages", "Dashboard"] as const;
  const [t, setT] = useAuto(3, running, 2600);
  return (
    <>
      <div className="cs-app-preview" aria-hidden>
        <div className="cs-app-bar"><i /><i /><i /><span>Contact Center app</span></div>
        <div className="cs-app-body">
          <div className="cs-app-side">{tabs.map((x, k) => <span key={x} className={k === t ? "on" : ""} />)}</div>
          <div className="cs-app-main">
            {t === 0 && (
              <div className="cs-app-call" key="c">
                <div className="cs-wave">{Array.from({ length: 18 }).map((_, k) => <span key={k} style={{ animationDelay: `${(k % 6) * 0.11}s` }} />)}</div>
                <div className="cs-app-row"><b>Live call</b><em>Hold</em><em>Transfer</em></div>
                <div className="cs-app-ai">AI guidance · when configured</div>
              </div>
            )}
            {t === 1 && (
              <div className="cs-app-msg" key="m">
                <span className="in">Where is my order?</span>
                <span className="out">Checking that now.</span>
                <span className="in short">Thanks</span>
              </div>
            )}
            {t === 2 && (
              <div className="cs-app-dash" key="d">
                {[62, 38, 81, 47, 70, 55].map((h, k) => <span key={k} style={{ height: `${h}%`, animationDelay: `${k * 0.06}s` }} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="cs-tools">
        <div className="cs-seg" role="group" aria-label="Illustrative workspace view">
          {tabs.map((x, k) => (
            <button key={x} type="button" aria-pressed={k === t} onClick={() => { onInteract(); setT(k); }} data-testid={`button-app-${x.toLowerCase()}`}>{x}</button>
          ))}
        </div>
      </div>
      <p className="cs-caption" aria-live={running ? "off" : "polite"}>{["Illustrative call controls; AI tools when configured", "Illustrative omnichannel inbox", "Illustrative supervisor dashboard"][t]}</p>
    </>
  );
}

/* ---------- Identity: corporate IdP -> Zendesk SAML IdP -> Connect / Cognito / console ---------- */
function IdentityIll({ running, onInteract }: IllProps) {
  const [s, setS] = useAuto(4, running, 1500);
  const steps = ["Corporate identity provider applies configured MFA and access policies", "Zendesk issues a SAML 2.0 assertion", "Signed in to Connect, Cognito and console", "Session established"];
  const targets = ["Connect", "Cognito", "Console"];
  return (
    <>
      <svg viewBox="0 0 360 170" className="cs-svg" aria-hidden>
        <g className={`cs-i-node ${s >= 0 ? "on" : ""}`}>
          <rect x="14" y="58" width="82" height="54" rx="12" />
          <text x="55" y="81" textAnchor="middle">Corporate</text><text x="55" y="96" textAnchor="middle">IdP</text>
        </g>
        <path d="M96 85 H140" className={`cs-wire ${s >= 1 ? "hot" : ""}`} />
        <g className={`cs-i-shield ${s >= 1 ? "on" : ""}`}>
          <path d="M175 40 L210 52 V86 C210 108 194 122 175 130 C156 122 140 108 140 86 V52 Z" />
          <path d="M162 86 l9 9 l17 -19" className="cs-check" />
          <text x="175" y="150" textAnchor="middle">SAML 2.0</text>
        </g>
        {targets.map((x, k) => {
          const y = 38 + k * 47;
          return (
            <g key={x}>
              <path d={`M210 85 C240 85 236 ${y} 262 ${y}`} className={`cs-wire ${s >= 2 ? "hot" : ""}`} />
              <g className={`cs-i-node t ${s >= 2 ? "on" : ""}`} style={{ transitionDelay: `${k * 0.12}s` }}>
                <rect x="262" y={y - 15} width="86" height="30" rx="9" />
                <text x="305" y={y + 4} textAnchor="middle">{x}</text>
              </g>
            </g>
          );
        })}
        <circle cx="175" cy="86" r="52" className={`cs-i-ring ${s === 3 ? "on" : ""}`} />
      </svg>
      <div className="cs-tools">
        <div className="cs-dots" role="group" aria-label="Illustrative sign-in step">
          {steps.map((x, k) => <button key={k} type="button" aria-pressed={k === s} aria-label={x} onClick={() => { onInteract(); setS(k); }} data-testid={`button-identity-step-${k + 1}`} />)}
        </div>
        <button type="button" className="cs-btn" onClick={() => { onInteract(); setS(0); }} data-testid="button-identity-restart">Restart sign-in</button>
      </div>
      <p className="cs-caption" aria-live={running ? "off" : "polite"}>{steps[s]}</p>
    </>
  );
}

/* ---------- CloudFormation: template assembling layered resources ---------- */
function CfnIll({ running, onInteract }: IllProps) {
  const layers = ["Cognito", "IAM roles", "Lambda functions", "Streaming connections"];
  const [n, setN] = useAuto(layers.length + 1, running, 1200);
  return (
    <>
      <svg viewBox="0 0 360 170" className="cs-svg" aria-hidden>
        <g className="cs-f-doc">
          <rect x="16" y="26" width="92" height="118" rx="10" />
          <text x="28" y="46">template</text>
          {[60, 74, 88, 102, 116, 130].map((y, k) => <rect key={y} x={k % 2 ? 36 : 28} y={y} width={k % 3 === 1 ? 44 : 64} height="5" rx="2.5" className={k < n * 1.5 ? "on" : ""} />)}
        </g>
        <path d="M108 85 H150" className={`cs-wire ${n > 0 ? "hot" : ""}`} />
        {layers.map((x, k) => {
          const y = 128 - k * 28;
          const on = k < n;
          return (
            <g key={x} className={`cs-f-layer ${on ? "on" : ""}`} style={{ ["--d" as string]: `${k * 0.06}s` }}>
              <path d={`M170 ${y} L250 ${y - 14} L330 ${y} L250 ${y + 14} Z`} className="top" />
              <path d={`M170 ${y} V${y + 8} L250 ${y + 22} V${y + 14} Z`} className="l" />
              <path d={`M330 ${y} V${y + 8} L250 ${y + 22} V${y + 14} Z`} className="r" />
              <text x="250" y={y + 4} textAnchor="middle">{x}</text>
            </g>
          );
        })}
      </svg>
      <div className="cs-tools">
        <label className="cs-range">
          <span>Layers shown</span>
          <input type="range" min={0} max={layers.length} value={n} onChange={(e) => { onInteract(); setN(Number(e.target.value)); }} aria-label="Illustrative resources shown" aria-valuetext={n === 0 ? "Template only" : layers.slice(0, n).join(", ")} data-testid="input-cfn-layers" />
        </label>
      </div>
      <p className="cs-caption" aria-live={running ? "off" : "polite"}>{n === 0 ? "Template describes the resources" : `${layers.slice(0, n).join(", ")}`}</p>
    </>
  );
}

const ILLS: ((p: IllProps) => ReactNode)[] = [ConnectIll, AppIll, IdentityIll, CfnIll];
const TONES = ["connect", "app", "identity", "cfn"];

function Card({ c, k, resources }: { c: Comp; k: number; resources: Readonly<Record<ComponentTerm, string>> }) {
  const reduced = useReduced();
  const { ref, live } = useLive<HTMLElement>();
  const [paused, setPaused] = useState(reduced);
  useEffect(() => { if (reduced) setPaused(true); }, [reduced]);
  const running = !paused && !reduced && live;
  const Ill = ILLS[k];
  const id = IDS[k];
  return (
    <article ref={ref} id={id} data-section-nav aria-labelledby={`${id}-title`} className={`cs-card cs-${TONES[k]} ${running ? "run" : "still"}`} data-testid={`card-${id}`}>
      <div className="cs-stage">
        <div className="cs-stage-head">
          <span className="cs-tag">Illustrative</span>
          <button type="button" className="cs-pp" onClick={() => setPaused((p) => !p)} disabled={reduced}
            aria-pressed={paused || reduced} aria-label={reduced ? `${c.t} illustration: motion reduced` : paused ? `Play ${c.t} illustration` : `Pause ${c.t} illustration`} data-testid={`button-pause-${id}`}>
            {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
            <span>{reduced ? "Motion reduced" : paused ? "Play" : "Pause"}</span>
          </button>
        </div>
        <Ill running={running} onInteract={() => setPaused(true)} />
      </div>
      <div className="cs-body">
        <div className="flex items-start justify-between gap-3">
          <h3 id={`${id}-title`} className="cs-title">{c.t}</h3>
          <SectionLink id={id} label={c.t} />
        </div>
        <p className="cs-desc">{c.d}</p>
        <div className="cs-chips">
          {c.chips.map((x) => {
            const href = componentDocumentation(x, resources);
            return href ? (
              <a key={x} href={href} target="_blank" rel="noopener noreferrer" className="cs-chip" data-testid={`link-chip-${id}-${x.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                {x}<ArrowUpRight className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : <span key={x} className="cs-chip cs-chip-unavailable">{x} · Documentation unavailable</span>;
          })}
        </div>
      </div>
    </article>
  );
}

export function ComponentShowcase({ resources }: { resources: Readonly<Record<ComponentTerm, string>> }) {
  return (
    <div className="cs-grid" data-testid="component-showcase">
      {CORE_COMPONENTS.map((c, k) => <Card key={c.t} c={c} k={k} resources={resources} />)}
    </div>
  );
}

export default ComponentShowcase;
