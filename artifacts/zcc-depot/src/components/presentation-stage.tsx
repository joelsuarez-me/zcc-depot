import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand, Info, RotateCcw, X } from "lucide-react";
import "./demo-readiness.css";

/** Keys typed into fields or used with modifiers never drive a simulation. */
export function isTypingTarget(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return true;
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable || el.closest?.("[contenteditable=''],[contenteditable='true']")) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.getAttribute("role") === "textbox";
}

export type PresentHandlers = { onNext?: () => void; onPrev?: () => void; onReset?: () => void };

/** Distraction-free presentation for an explicit simulation. Native fullscreen first, visible in-app fallback otherwise. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Make everything outside `el` inert (sibling chain up to body); returns an undo. */
function isolate(el: HTMLElement) {
  const changed: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sib of Array.from(parent.children)) {
      if (sib !== node && sib instanceof HTMLElement && !sib.inert && sib.tagName !== "SCRIPT") { sib.inert = true; changed.push(sib); }
    }
    node = parent;
  }
  return () => changed.forEach((n) => { n.inert = false; });
}

export function usePresentation({ onNext, onPrev, onReset }: PresentHandlers) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const h = useRef({ onNext, onPrev, onReset });
  h.current = { onNext, onPrev, onReset };
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const returnTo = useRef<HTMLElement | null>(null);

  const exit = useCallback(() => {
    setActive(false); setFallback(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    const back = returnTo.current;
    window.requestAnimationFrame(() => { if (back?.isConnected) back.focus(); else ref.current?.querySelector<HTMLElement>("[data-present-launch]")?.focus(); });
  }, []);
  const enter = useCallback(async () => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActive(true);
    const el = ref.current;
    if (!el || typeof el.requestFullscreen !== "function" || !document.fullscreenEnabled) { setFallback(true); return; }
    try { await el.requestFullscreen(); setFallback(false); } catch { setFallback(true); }
  }, []);

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement && !fallbackRef.current && ref.current?.classList.contains("is-active")) exit(); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [exit]);

  // Move focus into the stage once it is presenting.
  useEffect(() => {
    if (!active) return;
    const id = window.requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("[data-present-exit]")?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [active, fallback]);

  // Native fullscreen does not reliably constrain keyboard focus either.
  useEffect(() => {
    if (!active || !ref.current) return;
    const undo = isolate(ref.current);
    document.documentElement.classList.add("pz-lock");
    return () => { undo(); document.documentElement.classList.remove("pz-lock"); };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    // Capture presentation shortcuts before dialog handlers; editable controls retain their own keyboard behavior.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" && isTypingTarget(e)) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); exit(); return; }
      if (e.key === "Tab" && ref.current) {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
        if (items.length === 0) { e.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1], cur = document.activeElement as HTMLElement | null;
        if (!cur || !ref.current.contains(cur)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (isTypingTarget(e)) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "n" || k === "N") { if (h.current.onNext) { e.preventDefault(); h.current.onNext(); } }
      else if (k === "ArrowLeft" || k === "p" || k === "P") { if (h.current.onPrev) { e.preventDefault(); h.current.onPrev(); } }
      else if (k === "r" || k === "R") { if (h.current.onReset) { e.preventDefault(); h.current.onReset(); } }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, exit]);

  return { ref, active, fallback, enter, exit };
}

export function PresentStage({ label, children, step, testId, dark = false, ...handlers }: PresentHandlers & { label: string; children: ReactNode; step?: string; testId: string; dark?: boolean }) {
  const p = usePresentation(handlers);
  return (
    <div ref={p.ref} className={`pz ${dark ? "pz-dark" : ""} ${p.active ? "is-active" : ""} ${p.fallback ? "is-fallback" : ""}`} data-testid={`present-${testId}`}
      role={p.active ? "dialog" : undefined} aria-modal={p.active || undefined} aria-label={p.active ? `${label} presentation` : undefined}>
      {p.active ? (
        <div className="pz-bar on-dark" data-testid={`present-bar-${testId}`}>
          <span className="pz-title"><span className="eyebrow text-[#D1F470]">Presenting · simulation</span><span className="truncate">{label}</span></span>
          {step && <span className="mono pz-step" aria-live="polite">{step}</span>}
          <div className="pz-actions">
            <button type="button" className="pz-btn" onClick={handlers.onPrev} disabled={!handlers.onPrev} aria-label="Previous step" aria-keyshortcuts="ArrowLeft" data-testid={`button-present-prev-${testId}`}><ChevronLeft className="h-4 w-4" aria-hidden /><span>Previous</span></button>
            <button type="button" className="pz-btn" onClick={handlers.onNext} disabled={!handlers.onNext} aria-label="Next step" aria-keyshortcuts="ArrowRight" data-testid={`button-present-next-${testId}`}><span>Next</span><ChevronRight className="h-4 w-4" aria-hidden /></button>
            <button type="button" className="pz-btn" onClick={handlers.onReset} disabled={!handlers.onReset} aria-keyshortcuts="R" data-testid={`button-present-reset-${testId}`}><RotateCcw className="h-4 w-4" aria-hidden /><span>Reset</span></button>
            <button type="button" className="pz-btn is-exit" onClick={p.exit} data-present-exit aria-keyshortcuts="Escape" data-testid={`button-present-exit-${testId}`}><X className="h-4 w-4" aria-hidden /><span>Exit</span></button>
          </div>
          {p.fallback && <p className="pz-note" role="status" data-testid={`status-present-fallback-${testId}`}><Info className="h-3.5 w-3.5 shrink-0" aria-hidden />Browser fullscreen was unavailable, so this in-app focus view is shown instead. Press Esc or Exit to return.</p>}
          <p className="pz-keys">Keys: Left / Right step · R reset · Esc exit. Fictional data; no live systems are contacted.</p>
        </div>
      ) : (
        <div className="pz-launch">
          <button type="button" className="pz-launch-btn" onClick={() => void p.enter()} data-present-launch data-testid={`button-present-${testId}`}><Expand className="h-3.5 w-3.5" aria-hidden />Present simulation</button>
        </div>
      )}
      <div className="pz-body">{children}</div>
    </div>
  );
}
