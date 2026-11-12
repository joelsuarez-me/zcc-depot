import { BarChart3, BookOpen, Home, Inbox, Mic, Pause, Phone, PhoneForwarded, Settings, Sparkles, Users } from "lucide-react";
import type { DemoPlayback } from "@/hooks/use-demo-playback";

const lines = [
  { who: "Terry", text: "Hi, I'd like to return the jacket I ordered last week." },
  { who: "Agent", text: "Of course. Let me pull up your order." },
  { who: "Terry", text: "It doesn't fit, so I'm hoping for a refund." },
];
const steps = ["Confirm order ID number in customer card", "Navigate to the 'Return Request' app", "Click 'Submit details'"];

/** Decorative reconstruction; nothing here is interactive. */
export function CopilotScene({ pb }: { pb: DemoPlayback }) {
  const idle = pb.status === "idle";
  const s = idle ? 4 : pb.stepIndex;
  const shownLines = s >= 1 ? 3 : idle ? 3 : pb.stepProgress > 0.4 ? 1 : 0;
  const shownSteps = s > 3 ? 3 : s === 3 ? Math.min(3, Math.floor(pb.stepProgress * 4)) : 0;
  const k = (n: string) => `${n}-${pb.stepIndex}`;

  return (
    <div className="relative px-3 pb-6 pt-14 sm:px-8 sm:pt-16" aria-hidden>
      <div className="relative flex min-h-[340px] overflow-hidden rounded-[1.25rem] bg-[#FBFBF8] shadow-[0_30px_60px_-30px_rgba(32,53,36,.6)] sm:max-w-[560px]">
        <div className="hidden w-14 shrink-0 flex-col items-center gap-5 bg-[#11110D] py-4 text-[#F5F5F2]/60 sm:flex">
          <span className="text-lg font-bold text-[#F5F5F2]">Z</span>
          <Home className="h-4 w-4" /><span className="-mx-0 grid h-9 w-full place-items-center bg-[#17494D] text-[#F5F5F2]"><Inbox className="h-4 w-4" /></span>
          <Users className="h-4 w-4" /><BarChart3 className="h-4 w-4" /><Settings className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#11110D]/10 pb-2">
            <h3 className="text-lg font-semibold sm:text-xl">Call with Terry</h3>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#203524] text-xs font-semibold text-[#D1F470]">AG</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#11110D]/10 py-2.5 text-sm">
            <Phone className="h-4 w-4 opacity-60" /><span className="mono text-xs sm:text-sm">+1 (415) 555-0143</span>
            <span className="ml-auto flex gap-1.5">
              {[Mic, Pause, PhoneForwarded].map((I, i) => <span key={i} className="grid h-7 w-7 place-items-center rounded-md border border-[#11110D]/15"><I className="h-3.5 w-3.5" /></span>)}
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#D93F4C] text-white"><Phone className="h-3.5 w-3.5 rotate-[135deg]" /></span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#C9A27E] text-sm font-semibold text-[#11110D] ${pb.playing && s === 0 ? "dn-ring" : ""}`}>TS</span>
            <div className="min-w-0 text-sm"><b>Terry Silva</b> <span className="opacity-60">via incoming phone call</span>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-[#203524]/70"><span className="dn-wave text-[#7DA33A]"><i /><i /><i /><i /></span>Sample transcript</div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 sm:max-w-[60%]">
            {lines.slice(0, shownLines).map((l, i) => (
              <p key={i} className={`dn-in rounded-xl px-3 py-1.5 text-xs leading-snug ${l.who === "Agent" ? "ml-6 bg-[#203524] text-[#F5F5F2]" : "bg-[#11110D]/[.06]"}`}><b className="mr-1">{l.who}:</b>{l.text}</p>
            ))}
          </div>
        </div>
      </div>

      {s >= 1 && (
        <div key={k("kb")} className="dn-in relative z-10 mt-4 rounded-[1.25rem] border-2 border-[#4E7A2E] bg-[#FBFBF8] p-4 shadow-[0_30px_60px_-25px_rgba(32,53,36,.55)] sm:absolute sm:bottom-6 sm:right-6 sm:mt-0 sm:w-[min(400px,58%)]">
          <div className="text-base font-semibold">Knowledge</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[#4E7A2E]" />Quick answer</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="dn-in rounded bg-[#11110D]/[.07] px-2 py-1">Topic <b>Returns</b></span>
            <span className="dn-in rounded bg-[#11110D]/[.07] px-2 py-1" style={{ animationDelay: ".15s" }}>Sentiment <b>Neutral</b></span>
          </div>
          {s >= 2 ? (
            <div key={k("g")} className="dn-in mt-3 text-xs leading-relaxed sm:text-[0.8rem]">
              <p>To proceed with processing your customer's refund, follow this procedure:</p>
              <ol className="mt-1 space-y-0.5 pl-1">
                {steps.map((t, i) => <li key={t} className={`transition-opacity duration-500 ${i < shownSteps ? "opacity-100" : "opacity-15"}`}>{i + 1}. {t}</li>)}
              </ol>
              <p className="mt-2 opacity-55">AI suggestion based on</p>
              <p className="flex items-center gap-1.5 text-[#1F73B7]"><BookOpen className="h-3.5 w-3.5" />Processing returns and refunds <span className="text-[0.6rem] text-[#11110D]/45">(sample article)</span></p>
            </div>
          ) : (
            <div className="mt-3 space-y-1.5"><div className="h-2 w-4/5 rounded bg-[#11110D]/10" /><div className="h-2 w-3/5 rounded bg-[#11110D]/10" /></div>
          )}
          {s >= 4 && <div key={k("r")} className="dn-in mt-3 rounded-lg bg-[#D1F470]/50 px-2.5 py-1.5 text-xs font-semibold text-[#203524]">Agent ready to respond · the human agent decides next steps</div>}
        </div>
      )}
    </div>
  );
}
