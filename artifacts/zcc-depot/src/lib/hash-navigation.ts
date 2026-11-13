/** Match native fragments, including encoded IDs, without interpreting them as selectors. */
export function fragmentId(hash: string) {
  const raw = hash.replace(/^#/, "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

/**
 * Wouter dispatches pushState/replaceState events, not hashchange, for its links.
 * Keep fragment navigation working on the same route and after lazy pages mount.
 */
export function attachHashNavigation(win: Window = window, doc: Document = document) {
  let observer: MutationObserver | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let disposed = false;
  const stop = () => {
    observer?.disconnect();
    observer = undefined;
    if (timeout) clearTimeout(timeout);
    if (frame) win.cancelAnimationFrame(frame);
  };
  const jump = () => {
    stop();
    const id = fragmentId(win.location.hash);
    if (!id) { win.scrollTo({ top: 0, behavior: "instant" }); return; }
    const scroll = () => {
      if (disposed || fragmentId(win.location.hash) !== id) return;
      const target = doc.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      stop();
    };
    observer = new MutationObserver(() => {
      if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; scroll(); });
    });
    const main = doc.getElementById("main");
    if (main) observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
    // React commits and route changes finish before the next paint.
    frame = win.requestAnimationFrame(() => { frame = 0; scroll(); });
    timeout = setTimeout(stop, 8000);
  };
  const events = ["hashchange", "popstate", "pushState", "replaceState"];
  events.forEach(event => win.addEventListener(event, jump));
  // Clicking an already-selected fragment does not change history or the hash.
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!link || link.getAttribute("target") === "_blank") return;
    const url = new URL(link.getAttribute("href")!, win.location.href);
    if (url.origin === win.location.origin && url.pathname === win.location.pathname && url.hash) {
      // Do not prevent default: retain native history, keyboard and copy-link behavior.
      queueMicrotask(() => { if (!disposed) jump(); });
    }
  };
  doc.addEventListener("click", click);
  jump();
  return () => {
    disposed = true;
    stop();
    events.forEach(event => win.removeEventListener(event, jump));
    doc.removeEventListener("click", click);
  };
}
