import { Mic, Pause as Hold, PhoneForwarded, PhoneIncoming, PhoneOff } from "lucide-react";
import "./agent-call-hero.css";

const BASE = import.meta.env.BASE_URL;
const BARS = Array.from({ length: 44 }, (_, i) => {
  const h = 18 + Math.abs(Math.sin(i * 1.7) * 62) + (i % 5 === 0 ? 20 : 0);
  return { h: Math.min(h, 100), d: ((i * 137) % 900) / 1000, g: (i > 8 && i < 13) || (i > 32 && i < 37) || i === 22 };
});

/** Illustrative, non-functional call UI layered over the agent portrait. */
export function AgentCallHero() {
  return (
    <figure className="m-0" data-testid="agent-call-hero">
      <div className="ach" role="img" aria-label="Illustrative example: an agent on a live call with Terry Silva, showing call details, a live waveform, verified caller intent, and Powered by Amazon Connect.">
        <div className="ach-photo" aria-hidden>
          <img src={`${BASE}brand/agent-call-portrait.webp`} alt="" width={460} height={440} fetchPriority="high" decoding="async" />
        </div>
        <span className="ach-line ach-l1" aria-hidden />
        <span className="ach-line ach-l2" aria-hidden />
        <div className="ach-card ach-wave" aria-hidden>
          <span className="ach-wave-top"><span className="ach-rec" />00:25</span>
          <div className="ach-bars">{BARS.map((b, i) => <i key={i} className={b.g ? "g" : ""} style={{ ["--h" as string]: `${b.h}%`, ["--d" as string]: `-${b.d}s` }} />)}</div>
        </div>
        <div className="ach-card ach-convo" aria-hidden>
          <h3>Conversation with Terry<span className="ach-mini">TS</span></h3>
          <div className="ach-row">
            <PhoneIncoming size={12} /><span className="num">+1 (415) 555-0163</span>
            <span className="ach-ic"><Mic size={11} /></span><span className="ach-ic"><Hold size={11} /></span>
            <span className="ach-ic"><PhoneForwarded size={11} /></span><span className="ach-ic end"><PhoneOff size={11} /></span>
          </div>
          <div className="ach-who">
            <span className="ach-av">TS</span>
            <div><b>Terry Silva</b> <span className="opacity-60">via incoming phone call</span>
              <div className="ach-meta">Call Duration: 1:15<br />Call Queue: Returns<br />Ticket ID: 0051</div></div>
          </div>
        </div>
        <div className="ach-card ach-profile" aria-hidden>
          <b>Terry Silva</b><br /><span className="ach-ver">VERIFIED</span>
          <dl className="ach-kv"><dt>Intent</dt><dd>Product Returns</dd><dt>Queue</dt><dd>Urgent</dd></dl>
          <div className="ach-sent"><span />Sentiment positive</div>
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
