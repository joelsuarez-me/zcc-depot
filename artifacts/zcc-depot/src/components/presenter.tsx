import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, KeyRound, LockKeyhole, MessagesSquare, Minimize2, Pause, Play, Presentation, RotateCcw, ShieldCheck, Timer, X } from "lucide-react";
import { useDepot } from "@/lib/depot-mode";
import { usePresenterContent } from "@/hooks/use-presenter-content";
import type { RoomId } from "@/data/depot-rooms";

/** Shown wherever presenter-only material would otherwise render. Never receives restricted content itself. */
export function PresenterGate({ children, title = "Presenter material", detail }: { children: ReactNode; title?: string; detail?: string }) {
  const { isPresenter, setMode, auth } = useDepot();
  if (isPresenter && auth.isAuthenticated) return <>{children}</>;
  const needsMode = !isPresenter;
  return (
    <div className="depot-gate" data-testid="gate-presenter">
      <div className="depot-gate-card">
        <span className="depot-gate-icon" aria-hidden>{needsMode ? <Presentation className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}</span>
        <div className="eyebrow text-[#11110D]/55">{needsMode ? "Customer Mode is on" : "Sign-in required"}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#11110D]/65">
          {detail ?? (needsMode
            ? "This area is reserved for the presenting team. Switch to Presenter Mode to continue; it stays hidden from the customer-facing view."
            : "Presenter Mode is on, but this content is only served to signed-in portal users.")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {needsMode
            ? <button type="button" className="depot-btn depot-btn-ink" onClick={() => setMode("presenter")} data-testid="button-gate-presenter"><Presentation className="h-4 w-4" aria-hidden />Switch to Presenter Mode</button>
            : <button type="button" className="depot-btn depot-btn-ink" onClick={auth.login} disabled={auth.isLoading} data-testid="button-gate-signin"><LockKeyhole className="h-4 w-4" aria-hidden />{auth.isLoading ? "Checking session" : "Sign in to continue"}</button>}
          {!needsMode && <button type="button" className="depot-btn depot-btn-ghost" onClick={() => setMode("customer")} data-testid="button-gate-customer">Return to Customer Mode</button>}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-[#11110D]/45"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />Access is enforced by the server, not by this screen.</p>
      </div>
    </div>
  );
}

/** Renders nothing at all in Customer Mode; a compact gate in Presenter Mode without sign-in. */
export function PresenterOnly({ children, title }: { children: ReactNode; title?: string }) {
  const { isPresenter } = useDepot();
  if (!isPresenter) return null;
  return <div className="contents" data-brief-exclude><PresenterGate title={title}>{children}</PresenterGate></div>;
}

type Tab = "notes" | "technical" | "discovery" | "objections" | "progression";
const TABS: { id: Tab; label: string }[] = [
  { id: "notes", label: "Speaker notes" },
  { id: "technical", label: "Technical points" },
  { id: "discovery", label: "Discovery" },
  { id: "objections", label: "Objections" },
  { id: "progression", label: "Progression" },
];

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function usePresentationTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);
  const base = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const t = setInterval(() => setElapsed(base.current + performance.now() - start.current), 500);
    return () => { clearInterval(t); base.current += performance.now() - start.current; };
  }, [running]);
  const reset = () => { base.current = 0; start.current = performance.now(); setElapsed(0); };
  return { running, elapsed, toggle: () => setRunning((r) => !r), reset };
}

/** Presenter console for a room. Mounted only in Presenter Mode; data comes exclusively from the protected API. */
export function PresenterDock({ roomId, onPrevRoom, onNextRoom }: { roomId: RoomId; onPrevRoom?: () => void; onNextRoom?: () => void }) {
  const { isPresenter, auth } = useDepot();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("notes");
  const [step, setStep] = useState(0);
  const timer = usePresentationTimer();
  const reduce = useReducedMotion();
  const { data, isLoading, isError, refetch } = usePresenterContent();
  const room = data?.rooms?.find((r) => r.id === roomId);
  const progression = room?.progression ?? [];

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  const keys = useRef({ next: () => {}, prev: () => {}, timer: timer.toggle, full: toggleFull, toggle: () => setOpen((o) => !o), nextRoom: onNextRoom, prevRoom: onPrevRoom });
  keys.current = {
    next: () => setStep((s) => Math.min(s + 1, Math.max(progression.length - 1, 0))),
    prev: () => setStep((s) => Math.max(s - 1, 0)),
    timer: timer.toggle, full: toggleFull, toggle: () => setOpen((o) => !o), nextRoom: onNextRoom, prevRoom: onPrevRoom,
  };

  useEffect(() => { setStep(0); }, [roomId]);
  useEffect(() => {
    if (!isPresenter) return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" && e.shiftKey) { keys.current.nextRoom?.(); e.preventDefault(); }
      else if (e.key === "ArrowLeft" && e.shiftKey) { keys.current.prevRoom?.(); e.preventDefault(); }
      else if (e.key === "." ) keys.current.next();
      else if (e.key === ",") keys.current.prev();
      else if (e.key.toLowerCase() === "t") keys.current.timer();
      else if (e.key.toLowerCase() === "f") keys.current.full();
      else if (e.key.toLowerCase() === "p") keys.current.toggle();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [isPresenter]);

  if (!isPresenter) return null;

  const list = (items: string[] | undefined, testId: string) => items && items.length
    ? <ul className="space-y-2">{items.map((x, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed" data-testid={`${testId}-${i}`}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D1F470]" aria-hidden />{x}</li>)}</ul>
    : <p className="text-sm text-[#F5F5F2]/50">No entries for this room yet.</p>;

  return (
    <aside data-brief-exclude className={`depot-dock on-dark ${open ? "is-open" : ""}`} aria-label="Presenter console" data-testid="presenter-dock">
      <div className="depot-dock-bar">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-semibold" aria-expanded={open} data-testid="button-dock-toggle">
          <MessagesSquare className="h-4 w-4 text-[#D1F470]" aria-hidden />Presenter console
        </button>
        <div className="flex items-center gap-1">
          <span className="mono mr-1 inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F2]/8 px-2.5 py-1 text-xs" data-testid="text-presenter-timer"><Timer className="h-3.5 w-3.5" aria-hidden />{fmt(timer.elapsed)}</span>
          <button type="button" className="depot-icon-btn" onClick={timer.toggle} aria-label={timer.running ? "Pause timer" : "Start timer"} data-testid="button-timer-toggle">{timer.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
          <button type="button" className="depot-icon-btn" onClick={timer.reset} aria-label="Reset timer" data-testid="button-timer-reset"><RotateCcw className="h-3.5 w-3.5" /></button>
          <button type="button" className="depot-icon-btn" onClick={toggleFull} aria-label="Toggle full screen" data-testid="button-dock-fullscreen"><Expand className="h-3.5 w-3.5" /></button>
          <button type="button" className="depot-icon-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? "Minimize console" : "Expand console"}>{open ? <Minimize2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 rotate-45" />}</button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="depot-dock-body">
            {!auth.isAuthenticated ? (
              <div className="p-4 text-sm">
                <p className="text-[#F5F5F2]/75">Sign in to load speaker notes, discovery questions and objection handling for this room.</p>
                <button type="button" className="depot-btn depot-btn-lime mt-3" onClick={auth.login} data-testid="button-dock-signin"><LockKeyhole className="h-4 w-4" aria-hidden />Sign in</button>
              </div>
            ) : isLoading ? (
              <div className="space-y-2 p-4" aria-busy="true">{[70, 90, 55, 80].map((w) => <div key={w} className="h-3 rounded-full bg-[#F5F5F2]/10" style={{ width: `${w}%` }} />)}</div>
            ) : isError ? (
              <div className="p-4 text-sm"><p className="text-[#F5F5F2]/75">Presenter content could not be loaded. Your account may not have access.</p><button type="button" className="depot-btn depot-btn-lime mt-3" onClick={() => void refetch()} data-testid="button-dock-retry">Retry</button></div>
            ) : (
              <>
                <div role="tablist" aria-label="Presenter content" className="flex gap-1 overflow-x-auto px-3 pt-3">
                  {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="depot-dock-tab" data-testid={`tab-dock-${t.id}`}>{t.label}</button>)}
                </div>
                <div role="tabpanel" className="max-h-[38vh] overflow-y-auto p-4">
                  {tab === "notes" && list(room?.speakerNotes, "text-note")}
                  {tab === "technical" && list(room?.technicalPoints, "text-tech")}
                  {tab === "discovery" && list(room?.discoveryQuestions, "text-discovery")}
                  {tab === "objections" && (room?.objections?.length ? (
                    <dl className="space-y-3">{room.objections.map((o, i) => <div key={i} className="rounded-xl bg-[#F5F5F2]/6 p-3"><dt className="text-sm font-semibold text-[#D1F470]">{o.question}</dt><dd className="mt-1 text-sm text-[#F5F5F2]/80">{o.answer}</dd></div>)}</dl>
                  ) : <p className="text-sm text-[#F5F5F2]/50">No entries for this room yet.</p>)}
                  {tab === "progression" && (progression.length ? (
                    <div>
                      <ol className="space-y-1.5">{progression.map((p, i) => <li key={i}><button type="button" onClick={() => setStep(i)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${i === step ? "bg-[#D1F470] text-[#11110D]" : "hover:bg-[#F5F5F2]/8"}`} data-testid={`button-progression-${i}`}><span className="mono mr-2 opacity-60">{i + 1}</span>{p}</button></li>)}</ol>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" className="depot-icon-btn" onClick={() => keys.current.prev()} aria-label="Previous step"><ChevronLeft className="h-4 w-4" /></button>
                        <button type="button" className="depot-icon-btn" onClick={() => keys.current.next()} aria-label="Next step"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : <p className="text-sm text-[#F5F5F2]/50">No entries for this room yet.</p>)}
                </div>
                <p className="mono border-t border-[#F5F5F2]/10 px-4 py-2 text-[10px] text-[#F5F5F2]/45">Keys: , . step · Shift+arrows room · T timer · F full screen · P console</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
