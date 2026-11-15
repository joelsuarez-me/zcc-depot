/** Deterministic hand-off from Validate to /#evidence-review inside the Features section. */
const EVENT = "depot:open-evidence-queue";
let pending = false;
export function requestEvidenceQueue() { pending = true; window.dispatchEvent(new Event(EVENT)); }
export function consumeEvidenceRequest() { const p = pending; pending = false; return p; }
export function onEvidenceRequest(fn: () => void) { window.addEventListener(EVENT, fn); return () => window.removeEventListener(EVENT, fn); }
