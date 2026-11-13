import { useEffect, useRef } from "react";

const EVENT = "depot:before-private-context-change";

/** Mode changes and logout can unmount private editors without navigating. */
export function mayLeavePrivateContext() {
  return window.dispatchEvent(new Event(EVENT, { cancelable: true }));
}

/** Keep same-page search/scenario links usable; guard changes that discard the editor. */
export function useUnsavedShortlist(dirty: boolean, busy: boolean) {
  const current = useRef({ dirty, busy });
  current.current = { dirty, busy };
  useEffect(() => {
    let url = window.location.href;
    let state = window.history.state;
    let leaving = false;
    const mayLeave = () => {
      if (current.current.busy) {
        window.alert("Please wait for the shortlist request to finish before leaving.");
        return false;
      }
      return !current.current.dirty || window.confirm("This shortlist has unsaved changes. Discard them and continue?");
    };
    const beforeContext = (event: Event) => {
      if (!mayLeave()) event.preventDefault();
      else leaving = true; // Logout may redirect before React unmounts the editor.
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!leaving && (current.current.dirty || current.current.busy)) { event.preventDefault(); event.returnValue = ""; }
    };
    const push = history.pushState, replace = history.replaceState;
    for (const method of ["pushState", "replaceState"] as const) {
      const original = method === "pushState" ? push : replace;
      history[method] = function (data, unused, next) {
        if (next != null && new URL(next, url).pathname !== location.pathname && !mayLeave()) return;
        original.call(history, data, unused, next);
        url = location.href; state = history.state;
      };
    }
    const pop = (event: PopStateEvent) => {
      if (location.pathname !== new URL(url).pathname && !mayLeave()) {
        // Restore the current editor before the router can unmount it.
        push.call(history, state, "", url);
        event.stopImmediatePropagation();
        return;
      }
      url = location.href; state = history.state;
    };
    window.addEventListener(EVENT, beforeContext);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", pop, true);
    return () => {
      history.pushState = push; history.replaceState = replace;
      window.removeEventListener(EVENT, beforeContext);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", pop, true);
    };
  }, []);
}
