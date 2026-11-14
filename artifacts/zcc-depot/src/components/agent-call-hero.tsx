import "./agent-call-hero.css";

const BASE = import.meta.env.BASE_URL;
const BARS = Array.from({ length: 44 }, (_, i) => {
  const h = 18 + Math.abs(Math.sin(i * 1.7) * 62) + (i % 5 === 0 ? 20 : 0);
  return { h: Math.min(h, 100), d: ((i * 137) % 900) / 1000, g: (i > 8 && i < 13) || (i > 32 && i < 37) || i === 22 };
});

/** Supplied call illustration with a live waveform and animated Connect badge. */
export function AgentCallHero() {
  return (
    <figure className="m-0" data-testid="agent-call-hero">
      <div className="ach ach-morena" role="img" aria-label="Illustrative example: an agent on a live call with Terry Silva, showing call details, a live waveform, verified caller intent, and Powered by Amazon Connect.">
        <img className="ach-reference" src={`${BASE}brand/agent-call-morena.webp`} alt="" width={828} height={648} fetchPriority="high" decoding="async" aria-hidden />
        <div className="ach-card ach-wave" aria-hidden>
          <span className="ach-wave-top"><span className="ach-rec" />00:25</span>
          <div className="ach-bars">{BARS.map((b, i) => <i key={i} className={b.g ? "g" : ""} style={{ ["--h" as string]: `${b.h}%`, ["--d" as string]: `-${b.d}s` }} />)}</div>
        </div>
        <div className="ach-card ach-powered" data-testid="badge-powered-amazon-connect">
          <img className="ach-logo" src={`${BASE}brand/amazon-connect-family.png`} alt="" width={22} height={22} />
          <span className="sep" aria-hidden /><span>Powered by Amazon Connect</span>
        </div>
      </div>
      <figcaption className="ach-cap"><span>Illustrative agent experience</span><span>Fictional data</span></figcaption>
    </figure>
  );
}
