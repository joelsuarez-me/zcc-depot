import { AlertCircle, Headset, Smile, Sparkles } from "lucide-react";
import type { DemoPlayback } from "@/hooks/use-demo-playback";
import "./voice-qa-scene.css";

const heights = [3, 5, 4, 7, 5, 9, 6, 12, 8, 14, 10, 7, 11, 6, 9, 13, 8, 5, 10, 6, 4, 8, 5, 7, 4, 6, 3, 5, 4, 3];

function Bars({ live, seed }: { live: boolean; seed: number }) {
  return (
    <div className={`vq-bars ${live ? "is-live" : ""}`}>
      {heights.map((_, i) => {
        const v = heights[(i + seed) % heights.length];
        return <i key={i} style={{ transform: `scaleY(${v / 14})`, ["--lo" as string]: String(Math.max(0.15, v / 28)), ["--hi" as string]: String(Math.min(1, v / 11)), animationDelay: `${(i % 6) * 0.08}s` }} />;
      })}
    </div>
  );
}

const items = [
  { key: "risk", label: "Churn risk identified", note: "Sample signal: customer wants to return a purchase", Icon: AlertCircle, tone: "text-[#C2353F]" },
  { key: "product", label: "Product issue", note: "Sample signal: product-related follow-up for review", Icon: AlertCircle, tone: "text-[#C2353F]" },
  { key: "service", label: "Exceptional service", note: "Sample signal: agent confirmed the order promptly", Icon: Smile, tone: "text-[#3F6B22]" },
];

/** Decorative reconstruction; illustrative sample data only. */
export function VoiceQaScene({ pb }: { pb: DemoPlayback }) {
  const idle = pb.status === "idle";
  const s = idle ? 5 : pb.stepIndex;
  const p = idle ? 1 : pb.stepProgress;
  const custShown = s >= 1 || p > 0.1;
  const agentShown = s >= 1 || p > 0.55;
  const panel = s >= 1;
  const scan = s === 1 ? p : s > 1 ? 1 : 0;
  const found = s >= 4 ? 3 : s === 3 ? 2 : s === 2 ? 1 : 0;
  const focus = idle ? -1 : s - 2;
  const live = pb.playing;

  return (
    <div className="relative px-3 pb-6 pt-14 sm:px-8 sm:pt-16" aria-hidden>
      <div className="relative sm:max-w-[600px]">
        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#FBFBF8] shadow-[0_30px_60px_-30px_rgba(32,53,36,.6)] sm:w-[68%]">
          <div className="flex items-center justify-between bg-[#11110D] px-4 py-3 text-[#F5F5F2]">
            <span className="text-sm font-semibold">Call recording</span>
            <span className="mono text-[0.6rem] uppercase tracking-[.14em] text-[#D1F470]">Prepared sample</span>
          </div>
          <div className="space-y-3 p-4">
            <div className={`vq-row relative rounded-2xl bg-[#11110D]/[.06] p-3 ${custShown ? "opacity-100" : "translate-y-2 opacity-0"}`}>
              <span className="absolute -right-1 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-[#FBFBF8] bg-[#C9A27E] text-xs font-semibold text-[#11110D]">MR</span>
              <Bars live={live && s === 0 && p < 0.55} seed={0} />
              <p className="mt-2 text-sm leading-snug text-[#11110D]">"I would like to return my bag of coffee."</p>
            </div>
            <div className={`vq-row relative rounded-2xl bg-[#203524] p-3 text-[#F5F5F2] ${agentShown ? "opacity-100" : "translate-y-2 opacity-0"}`}>
              <span className="absolute -left-2 -top-3 grid h-8 w-8 place-items-center rounded-full bg-[#D1F470] text-[#203524]"><Headset className="h-4 w-4" /></span>
              <div className="[&_i]:!bg-[#D1F470]"><Bars live={live && s === 0 && p >= 0.55} seed={9} /></div>
              <p className="mt-2 text-sm leading-snug">No problem! Your order ID is <span className="mono font-semibold text-[#D1F470]">15023</span>, correct?</p>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-[#11110D]/10">
              <div className="vq-fill h-full rounded-full bg-[#7DA33A]" style={{ transform: `scaleX(${scan})` }} />
            </div>
            <p className="mono text-[0.6rem] uppercase tracking-[.12em] text-[#11110D]/60">{s === 1 ? "Reviewing sample conversation" : s > 1 ? "Review complete" : "Conversation in progress"}</p>
          </div>
        </div>

        {panel && (
          <div className="dn-in relative z-10 mt-4 overflow-hidden rounded-[1.25rem] border-2 border-[#11110D] bg-[#FBFBF8] shadow-[0_30px_60px_-25px_rgba(32,53,36,.55)] sm:absolute sm:-right-2 sm:top-16 sm:mt-0 sm:w-[min(300px,52%)]">
            <div className="relative overflow-hidden bg-[#11110D] px-4 py-3 text-[#F5F5F2]">
              {s === 1 && <span className="vq-sweep" />}
              <span className="relative flex items-center gap-2 text-base font-semibold"><Sparkles className="h-4 w-4 text-[#D1F470]" />Zendesk Voice QA</span>
            </div>
            <div className="p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#11110D]">
                Spotlight
                <span className="mono grid h-5 min-w-5 place-items-center rounded-full bg-[#203524] px-1.5 text-[0.65rem] text-[#D1F470]">{found}</span>
              </div>
              {found === 0 && <div className="space-y-2 py-1"><div className="h-2 w-4/5 rounded bg-[#11110D]/10" /><div className="h-2 w-3/5 rounded bg-[#11110D]/10" /></div>}
              <ul className="space-y-1.5">
                {items.map((it, i) => {
                  const on = i < found;
                  const cur = i === focus;
                  return (
                    <li key={it.key} className={`vq-row rounded-xl border p-2.5 ${on ? "opacity-100" : "hidden"} ${cur ? "border-[#7DA33A] bg-[#D1F470]/35" : "border-transparent"}`}>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#11110D]"><it.Icon className={`h-4 w-4 shrink-0 ${it.tone}`} />{it.label}</div>
                      {cur && <p className="dn-in mt-1 pl-6 text-[0.7rem] leading-snug text-[#11110D]/75">{it.note}</p>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[0.6rem] text-[#11110D]/55">Illustrative sample, not a real QA analysis.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
