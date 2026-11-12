import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Phone, Workflow, FileText, Headset } from "lucide-react";
import { Note } from "@/components/kit";
import { JOURNEY } from "@/data/content";

const JICONS = [Phone, Workflow, FileText, Headset];

export function CallJourney() {
  const [i, setI] = useState(0);
  const id = useId();
  const reduce = useReducedMotion();
  const s = JOURNEY[i];
  return (
    <div>
      <div role="tablist" aria-label="Call journey stages" className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="absolute left-[12%] right-[12%] top-9 hidden h-0.5 bg-[#203524]/15 md:block" aria-hidden>
          <div className="h-full bg-[#203524] transition-all duration-500" style={{ width: `${(i / 3) * 100}%` }} />
        </div>
        {JOURNEY.map((j, k) => {
          const I = JICONS[k];
          return (
            <button key={j.k} id={`${id}-stage-${k}`} role="tab" aria-selected={i === k} aria-controls={`${id}-panel`} tabIndex={i === k ? 0 : -1}
              onClick={() => setI(k)}
              onKeyDown={(event) => {
                const next = event.key === "ArrowRight" ? (k + 1) % JOURNEY.length
                  : event.key === "ArrowLeft" ? (k + JOURNEY.length - 1) % JOURNEY.length
                  : event.key === "Home" ? 0 : event.key === "End" ? JOURNEY.length - 1 : null;
                if (next === null) return;
                event.preventDefault();
                setI(next);
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
              data-testid={`tab-journey-${j.k}`} className="group relative flex flex-col items-center gap-3 rounded-2xl p-3 text-center">
              <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-full transition-all ${k <= i ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/15 bg-[#F5F5F2] text-[#11110D]/50 group-hover:border-[#203524]"} ${k === i ? "scale-110 ring-4 ring-[#D1F470]" : ""}`}><I className="h-5 w-5" aria-hidden /></span>
              <span className="eyebrow text-[#11110D]/50">{j.label}</span>
              <span className="font-semibold">{j.t}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-stage-${i}`} tabIndex={0}
          initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.3 }}
          className="mt-8 grid gap-6 rounded-[2rem] bg-[#203524] p-8 text-[#F5F5F2] md:grid-cols-2 md:p-10">
          <div>
            <h3 className="text-2xl font-semibold">{s.d}</h3>
            <p className="mt-3 text-[#F5F5F2]/70">{s.detail}</p>
            <div className="mt-5 flex flex-wrap gap-2">{s.chips.map((c) => <span key={c} className="mono rounded-full border border-[#D1F470]/40 px-3 py-1 text-xs text-[#D1F470]">{c}</span>)}</div>
          </div>
          <div className="rounded-2xl bg-[#F5F5F2] p-5 text-[#11110D]" aria-label="Illustrative Agent Workspace mock">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold">Zendesk Agent Workspace</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5a9b3c]" />Available</span></div>
            <div className="mt-4 rounded-xl border border-[#11110D]/10 bg-white/60 p-4">
              <div className="text-sm font-semibold">#4821 · Order status</div><div className="text-xs text-[#11110D]/55">Open · Priority normal</div>
              <div className={`mt-4 rounded-lg p-3 transition-colors ${i >= 3 ? "bg-[#D1F470]" : "bg-[#11110D]/5"}`}>
                <div className="mono text-[11px]">Zendesk Contact Center · 00:04</div>
                <div className="mt-1 text-sm font-medium">Jordan Rivera</div>
                <div className="text-sm italic text-[#11110D]/70">"I'm calling about my order..."</div>
                <div className="mt-3 flex gap-2 text-xs"><span className="rounded-full bg-[#11110D] px-3 py-1 text-[#F5F5F2]">Mute</span><span className="rounded-full border border-[#11110D]/20 px-3 py-1">Transfer</span></div>
              </div>
            </div>
            <p className="mono mt-3 text-[10px] text-[#11110D]/45">Illustrative mock. Not a product screenshot.</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <Note>Amazon Connect + contact flow → Contact Center integration → Agent Workspace. Call attributes, recording writeback, and transcripts require configuration.</Note>
    </div>
  );
}
