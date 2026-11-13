import { useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { PROOF, type ProofStory } from "@/data/customer-proof";
import "./customer-proof.css";

function Art({ kind }: { kind: ProofStory["art"] }) {
  if (kind === "orders") return (
    <svg viewBox="0 0 240 110" className="cp-art" aria-hidden>
      <rect x="8" y="20" width="56" height="70" rx="10" className="cp-a-dark" />
      <path d="M26 44c6-8 14-8 20 0M22 56c10-14 26-14 36 0" className="cp-a-wave" />
      <rect x="176" y="20" width="56" height="70" rx="10" className="cp-a-soft" />
      <rect x="186" y="34" width="36" height="6" rx="3" className="cp-a-line" /><rect x="186" y="48" width="26" height="6" rx="3" className="cp-a-line" />
      {[0, 1, 2].map((i) => <rect key={i} className="cp-box" style={{ animationDelay: `${i * 0.9}s` }} x="72" y="46" width="20" height="18" rx="4" />)}
      <path d="M70 92h100" className="cp-a-track" />
    </svg>
  );
  if (kind === "workflow") return (
    <svg viewBox="0 0 240 110" className="cp-art" aria-hidden>
      {["Voice", "Email", "SMS"].map((t, i) => (
        <g key={t} className="cp-chan" style={{ animationDelay: `${i * 0.5}s` }}>
          <rect x="8" y={10 + i * 32} width="58" height="24" rx="12" className="cp-a-soft" />
          <text x="37" y={26 + i * 32} textAnchor="middle" className="cp-a-txt">{t}</text>
          <path d={`M66 ${22 + i * 32} C110 ${22 + i * 32} 110 55 150 55`} className="cp-a-flow" />
        </g>
      ))}
      <rect x="150" y="22" width="82" height="66" rx="12" className="cp-a-dark" />
      <rect x="160" y="34" width="50" height="6" rx="3" className="cp-a-lime" />
      <rect x="160" y="48" width="62" height="5" rx="2.5" className="cp-a-line2 cp-type" />
      <rect x="160" y="60" width="44" height="5" rx="2.5" className="cp-a-line2 cp-type" style={{ animationDelay: ".6s" }} />
      <circle cx="218" cy="76" r="5" className="cp-a-lime cp-pulse" />
    </svg>
  );
  return (
    <svg viewBox="0 0 240 110" className="cp-art" aria-hidden>
      <rect x="82" y="4" width="76" height="102" rx="14" className="cp-a-dark" />
      <rect x="92" y="18" width="40" height="14" rx="7" className="cp-a-soft cp-msg" />
      <rect x="108" y="38" width="40" height="14" rx="7" className="cp-a-lime cp-msg" style={{ animationDelay: ".8s" }} />
      <rect x="92" y="58" width="48" height="14" rx="7" className="cp-a-soft cp-msg" style={{ animationDelay: "1.6s" }} />
      <g className="cp-dots"><circle cx="118" cy="88" r="3" /><circle cx="127" cy="88" r="3" /><circle cx="136" cy="88" r="3" /></g>
      <circle cx="40" cy="55" r="22" className="cp-a-ring" /><path d="M40 41v14l9 6" className="cp-a-hand" />
      <text x="200" y="60" textAnchor="middle" className="cp-a-big">24/7</text>
    </svg>
  );
}

function Card({ s, i }: { s: ProofStory; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`cp-card cp-${s.id}`} style={{ animationDelay: `${i * 0.12}s` }} data-testid={`card-proof-${s.id}`}>
      <header className="cp-head">
        <span className="cp-logo"><img src={s.logo} alt={`${s.co} logo`} loading="lazy" /></span>
        <div className="min-w-0"><h3 className="text-lg font-semibold leading-tight">{s.co}</h3><p className="text-xs text-[#11110D]/60">{s.place}</p></div>
      </header>
      <p className="cp-ind">{s.industry}</p>
      <div className="cp-stage"><Art kind={s.art} /></div>
      <p className="cp-headline">{s.headline}</p>
      <div className="cp-figlabel">{s.figureLabel}</div>
      <dl className="cp-figs">
        {s.figures.map((f) => (
          <div key={f.l} data-testid={`stat-proof-${s.id}`}><dt className="cp-fl">{f.l}</dt><dd className="cp-fv">{f.v}</dd>{f.note && <dd className="cp-fn">{f.note}</dd>}</div>
        ))}
      </dl>
      <div className="cp-block"><h4>Challenges</h4><ul>{s.challenges.map((c) => <li key={c}>{c}</li>)}</ul></div>
      <button type="button" className="cp-more" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-testid={`button-proof-more-${s.id}`}>
        {open ? "Hide" : "Why Zendesk and context"}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="cp-deep">
          <div className="cp-block"><h4>Why Zendesk</h4><ul>{s.why.map((c) => <li key={c}>{c}</li>)}</ul></div>
          <div className="cp-block"><h4>Solution context</h4><p>{s.context}</p></div>
          {s.quote && <blockquote className="cp-quote">“{s.quote.text}”<footer>{s.quote.by}, {s.quote.role}</footer></blockquote>}
        </div>
      )}
    </article>
  );
}

export function CustomerProof() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`cp-root ${paused ? "is-paused" : ""}`}>
      <div className="mb-3 flex justify-end">
        <button type="button" className="room-chip cp-toggle" aria-pressed={paused} onClick={() => setPaused((v) => !v)} data-testid="button-proof-motion">
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}{paused ? "Resume motion" : "Pause motion"}
        </button>
      </div>
      <div className="cp-grid">{PROOF.map((s, i) => <Card key={s.id} s={s} i={i} />)}</div>
    </div>
  );
}
