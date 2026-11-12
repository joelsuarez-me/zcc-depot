import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { SIGN_IN_STEPS, nextSignInStep } from "@/data/contact-center-components";
import "./components-guide.css";

export function SignInSequence() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduce, setReduce] = useState(false);
  const last = SIGN_IN_STEPS.length - 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setReduce(mq.matches);
    f(); mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    const f = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  useEffect(() => { if (reduce) setPlaying(false); }, [reduce]);
  useEffect(() => {
    if (!playing) return;
    if (step >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => nextSignInStep(s)), 2400);
    return () => clearTimeout(t);
  }, [playing, step, last]);

  const cur = SIGN_IN_STEPS[step];
  return (
    <div className="ccg" data-testid="sign-in-sequence">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className="ccg-btn" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} data-testid="button-signin-prev"><ChevronLeft className="h-4 w-4" aria-hidden />Previous</button>
        <button type="button" className="ccg-btn" onClick={() => { setPlaying(false); setStep((s) => nextSignInStep(s)); }} disabled={step === last} data-testid="button-signin-next">Next<ChevronRight className="h-4 w-4" aria-hidden /></button>
        {!reduce && (
          <button type="button" className="ccg-btn primary" aria-pressed={playing} data-testid="button-signin-play"
            onClick={() => { if (step >= last && !playing) setStep(0); setPlaying((p) => !p); }}>
            {playing ? <><Pause className="h-4 w-4" aria-hidden />Pause</> : <><Play className="h-4 w-4" aria-hidden />Play</>}
          </button>
        )}
        <button type="button" className="ccg-btn" onClick={() => { setPlaying(false); setStep(0); }} data-testid="button-signin-replay"><RotateCcw className="h-4 w-4" aria-hidden />Replay</button>
        <span className="mono ml-auto text-xs text-[#11110D]/55">Illustrative only · no real sign-in</span>
      </div>
      <div className="ccg-bar mb-4" aria-hidden><span style={{ transform: `scaleX(${(step + 1) / SIGN_IN_STEPS.length})` }} /></div>
      <ol className="ccg-steps">
        {SIGN_IN_STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className="ccg-step" aria-current={i === step ? "step" : undefined} data-done={i < step}
              onClick={() => { setPlaying(false); setStep(i); }} data-testid={`button-signin-step-${s.id}`}>
              <span className="eyebrow block opacity-70">{s.subtitle}</span>
              <span className="mt-2 block text-lg font-semibold leading-tight">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div role="status" aria-live="polite" className="mt-4 rounded-2xl border-l-2 border-[#203524] bg-[#FBFBF8] p-5" data-testid="text-signin-detail">
        <p className="eyebrow text-[#203524]">Step {step + 1} of {SIGN_IN_STEPS.length}: {cur.title}</p>
        <p key={step} className="ccg-panel-in mt-2 leading-relaxed text-[#11110D]/80">{cur.description}</p>
      </div>
    </div>
  );
}
