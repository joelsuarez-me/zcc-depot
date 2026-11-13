import { useEffect, useState } from "react";
import { MODE_KEY } from "@/lib/depot-mode";

function presenterHeaders(): Record<string, string> {
  try { return sessionStorage.getItem(MODE_KEY) === "presenter" ? { "X-Depot-Mode": "presenter" } : {}; } catch { return {}; }
}

/** Fetches a protected document or image with the session cookie and presenter header. */
export async function fetchProtectedBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(url, { credentials: "include", headers: presenterHeaders(), signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (presenterHeaders()["X-Depot-Mode"] !== "presenter") throw new Error("Presenter mode was closed.");
  return blob;
}

export async function downloadProtected(url: string, filename: string) {
  const blob = await fetchProtectedBlob(url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30_000);
}

/** Object URL for a protected image; revoked on change or unmount. */
export function useProtectedObjectUrl(url: string | null | undefined) {
  const [state, setState] = useState<{ src: string | null; error: boolean }>({ src: null, error: false });
  useEffect(() => {
    if (!url) { setState({ src: null, error: false }); return; }
    const ctrl = new AbortController();
    let made: string | null = null;
    setState({ src: null, error: false });
    fetchProtectedBlob(url, ctrl.signal)
      .then((b) => { made = URL.createObjectURL(b); setState({ src: made, error: false }); })
      .catch((e: unknown) => { if ((e as Error).name !== "AbortError") setState({ src: null, error: true }); });
    return () => { ctrl.abort(); if (made) URL.revokeObjectURL(made); };
  }, [url]);
  return state;
}
