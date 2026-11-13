import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetPitchDeck, getGetPitchDeckQueryKey, type PitchSlide } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, Download, Expand, Lock, RotateCw, X, ImageOff, Presentation } from "lucide-react";
import { Section, SectionHead } from "@/components/kit";
import { useProtectedObjectUrl } from "@/lib/protected-asset";
import { ProtectedDownload } from "@/components/protected-download";
import { PresenterGate } from "@/components/presenter";

function SlideImage({ slide, eager, className = "" }: { slide: PitchSlide; eager?: boolean; className?: string }) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setBroken(false); setLoaded(false); }, [slide.imageUrl]);
  if (broken) {
    return (
      <div className={`grid h-full w-full place-items-center bg-[#203524]/5 text-center ${className}`} role="img" aria-label={`Slide ${slide.number} failed to load`}>
        <div className="p-3">
          <ImageOff className="mx-auto h-6 w-6 text-[#203524]/50" aria-hidden />
          {eager && <>
            <p className="mt-2 text-sm text-[#11110D]/70">This slide image could not be loaded.</p>
            <button type="button" onClick={() => { setBroken(false); setLoaded(false); setAttempt((a) => a + 1); }} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#203524] px-4 py-2 text-xs font-semibold text-[#D1F470]" data-testid={`button-retry-slide-${slide.number}`}>
              <RotateCw className="h-3.5 w-3.5" aria-hidden />Retry image
            </button>
          </>}
        </div>
      </div>
    );
  }
  const raw = attempt ? `${slide.imageUrl}${slide.imageUrl.includes("?") ? "&" : "?"}r=${attempt}` : slide.imageUrl;
  return <ProtectedSlide raw={raw} slide={slide} eager={eager} className={className} loaded={loaded} setLoaded={setLoaded} setBroken={setBroken} />;
}

function ProtectedSlide({ raw, slide, eager, className, loaded, setLoaded, setBroken }: { raw: string; slide: PitchSlide; eager?: boolean; className: string; loaded: boolean; setLoaded: (v: boolean) => void; setBroken: (v: boolean) => void }) {
  const { src, error } = useProtectedObjectUrl(raw);
  useEffect(() => { if (error) setBroken(true); }, [error, setBroken]);
  if (!src) return <div className="absolute inset-0 animate-pulse bg-[#203524]/8" aria-hidden />;
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#203524]/8" aria-hidden />}
      <img src={src} alt={eager ? `Slide ${slide.number}: ${slide.title}` : ""} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false}
        onLoad={() => setLoaded(true)} onError={() => setBroken(true)}
        className={`relative h-full w-full object-contain ${className}`} data-testid={eager ? `img-slide-${slide.number}` : `img-thumb-${slide.number}`} />
    </>
  );
}

function SignedOut({ loading, login }: { loading: boolean; login: () => void }) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-8 md:flex-row md:items-center md:justify-between md:p-10" data-testid="pitch-deck-signed-out">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#203524] text-[#D1F470]"><Lock className="h-5 w-5" aria-hidden /></span>
        <div>
          <h3 className="text-xl font-semibold">Internal pitch deck</h3>
          <p className="mt-1 max-w-xl text-sm text-[#11110D]/65">Sign in to view the product deep-dive slides and download the PDF.</p>
        </div>
      </div>
      <button type="button" onClick={login} disabled={loading} className="rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470] disabled:opacity-50" data-testid="button-pitch-deck-sign-in">
        {loading ? "Checking session…" : "Sign in to view"}
      </button>
    </div>
  );
}

function Viewer({ slides, title, pdfUrl }: { slides: PitchSlide[]; title: string; pdfUrl: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const fullRef = useRef<HTMLDivElement>(null);
  const expandBtn = useRef<HTMLButtonElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const n = slides.length;
  const idx = Math.min(i, n - 1);
  const s = slides[idx];
  const go = useCallback((d: number) => setI((p) => Math.max(0, Math.min(n - 1, p + d))), [n]);

  useEffect(() => {
    thumbs.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [idx]);

  useEffect(() => {
    if (!full) return;
    fullRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; expandBtn.current?.focus(); };
  }, [full]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']") || e.altKey || e.ctrlKey || e.metaKey) return;
    if (full && e.key === "Tab") {
      const buttons = fullRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
      const first = buttons?.[0], last = buttons?.[buttons.length - 1];
      if (first && last && ((e.shiftKey && (document.activeElement === first || document.activeElement === fullRef.current)) || (!e.shiftKey && document.activeElement === last))) {
        e.preventDefault(); e.stopPropagation();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); go(-1); }
    else if (e.key === "Escape" && full) { e.preventDefault(); e.stopPropagation(); setFull(false); }
  };

  const nav = (dark: boolean) => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous slide" data-testid="button-prev-slide"
        className={`grid h-10 w-10 place-items-center rounded-full transition disabled:opacity-30 ${dark ? "bg-[#F5F5F2]/10 text-[#F5F5F2] hover:bg-[#F5F5F2]/20" : "bg-[#203524] text-[#D1F470] hover:bg-[#2b4630]"}`}><ChevronLeft className="h-5 w-5" /></button>
      <span className={`mono min-w-[4.5rem] text-center text-sm ${dark ? "text-[#F5F5F2]" : ""}`} aria-live="polite" data-testid="text-slide-count">{idx + 1} / {n}</span>
      <button type="button" onClick={() => go(1)} disabled={idx === n - 1} aria-label="Next slide" data-testid="button-next-slide"
        className={`grid h-10 w-10 place-items-center rounded-full transition disabled:opacity-30 ${dark ? "bg-[#F5F5F2]/10 text-[#F5F5F2] hover:bg-[#F5F5F2]/20" : "bg-[#203524] text-[#D1F470] hover:bg-[#2b4630]"}`}><ChevronRight className="h-5 w-5" /></button>
    </div>
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-label={`${title} slide viewer. Use left and right arrow keys to change slides.`} tabIndex={0} onKeyDown={onKey}
      className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-3 md:p-5" data-testid="pitch-deck-viewer">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="eyebrow text-[#203524]/60">Slide {s.number} · Source page {s.sourcePage}</div>
          <h3 className="truncate text-lg font-semibold" data-testid="text-slide-title">{s.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {nav(false)}
          <button ref={expandBtn} type="button" onClick={() => setFull(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#11110D]/15 px-4 py-2.5 text-sm font-semibold hover:border-[#203524]" data-testid="button-expand-deck">
            <Expand className="h-4 w-4" aria-hidden />Expand
          </button>
          <ProtectedDownload url={pdfUrl} filename={`${title}.pdf`} className="inline-flex items-center gap-1.5 rounded-full bg-[#D1F470] px-4 py-2.5 text-sm font-semibold text-[#11110D]" data-testid="link-download-deck-pdf">
            <Download className="h-4 w-4" aria-hidden />Download PDF<span className="sr-only"> ({n} slides)</span>
          </ProtectedDownload>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#E9EAE4] ring-1 ring-[#11110D]/8">
        <SlideImage key={s.number} slide={s} eager />
      </div>

      <label className="mt-3 block sm:hidden">
        <span className="sr-only">Jump to slide</span>
        <select value={idx} onChange={(e) => setI(Number(e.target.value))} className="w-full rounded-full border border-[#11110D]/15 bg-[#F5F5F2] px-4 py-2.5 text-sm" data-testid="select-slide">
          {slides.map((sl, k) => <option key={sl.number} value={k}>{k + 1}. {sl.title}</option>)}
        </select>
      </label>

      <div ref={thumbs} role="tablist" aria-label="Slides" className="mt-4 hidden snap-x gap-2 overflow-x-auto pb-2 sm:flex">
        {slides.map((sl, k) => (
          <button key={sl.number} type="button" role="tab" aria-selected={k === idx} data-idx={k} onClick={() => setI(k)} title={sl.title} data-testid={`button-thumb-${sl.number}`}
            aria-label={`Slide ${k + 1}: ${sl.title}`}
            className={`w-36 shrink-0 snap-start rounded-lg p-1 text-left transition ${k === idx ? "bg-[#203524] text-[#D1F470]" : "hover:bg-[#203524]/8"}`}>
            <div className="relative aspect-video overflow-hidden rounded-md bg-[#E9EAE4]"><SlideImage slide={sl} /></div>
            <div className="mt-1 truncate px-0.5 text-[11px]"><span className="mono opacity-60">{String(k + 1).padStart(2, "0")}</span> {sl.title}</div>
          </button>
        ))}
      </div>

      {full && (
        <div ref={fullRef} role="dialog" aria-modal="true" aria-label={`${title}, slide ${idx + 1} of ${n}`} tabIndex={-1} onKeyDown={onKey}
          className="on-dark fixed inset-0 z-[150] flex flex-col bg-[#11110D] p-3 outline-none md:p-6" data-testid="pitch-deck-fullscreen">
          <div className="flex items-center justify-between gap-3 text-[#F5F5F2]">
            <div className="min-w-0"><div className="eyebrow text-[#D1F470]">Source page {s.sourcePage}</div><div className="truncate font-semibold">{s.title}</div></div>
            <div className="flex items-center gap-3">
              {nav(true)}
              <button type="button" onClick={() => setFull(false)} aria-label="Close expanded view (Escape)" className="grid h-10 w-10 place-items-center rounded-full bg-[#D1F470] text-[#11110D]" data-testid="button-close-fullscreen"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="relative mt-4 min-h-0 flex-1">
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative aspect-video max-h-full w-full max-w-[calc((100dvh-7rem)*16/9)]"><SlideImage key={`f${s.number}`} slide={s} eager /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PitchDeckContent() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const qc = useQueryClient();
  const q = useGetPitchDeck({ query: { queryKey: getGetPitchDeckQueryKey(), enabled: isAuthenticated, gcTime: 0, staleTime: 0, retry: false } });

  useEffect(() => {
    if (!isAuthenticated) qc.removeQueries({ queryKey: getGetPitchDeckQueryKey() });
  }, [isAuthenticated, qc]);

  const status = (q.error as { status?: number } | null)?.status;
  let body;
  if (authLoading || !isAuthenticated) body = <SignedOut loading={authLoading} login={login} />;
  else if (q.isLoading) body = (
    <div className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-5" aria-busy="true" data-testid="pitch-deck-loading">
      <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-[#203524]/10" />
      <div className="aspect-video w-full animate-pulse rounded-xl bg-[#203524]/8" />
      <div className="mt-4 flex gap-2">{Array.from({ length: 6 }).map((_, k) => <div key={k} className="aspect-video w-36 animate-pulse rounded-md bg-[#203524]/8" />)}</div>
    </div>
  );
  else if (q.isError && status === 401) body = <SignedOut loading={false} login={login} />;
  else if (q.isError || !q.data) body = (
    <div className="rounded-[2rem] border border-[#B5442E]/30 bg-[#FBFBF8] p-8" role="alert" data-testid="pitch-deck-error">
      <h3 className="text-xl font-semibold">The pitch deck could not be loaded</h3>
      <p className="mt-1 text-sm text-[#11110D]/65">{status === 403 ? "Your account does not have access to this deck." : "Something went wrong reaching the server. Try again in a moment."}</p>
      <button type="button" onClick={() => q.refetch()} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470]" data-testid="button-retry-pitch-deck"><RotateCw className="h-4 w-4" aria-hidden />Retry</button>
    </div>
  );
  else if (q.data.slides.length === 0) body = (
    <div className="rounded-[2rem] border-2 border-dashed border-[#11110D]/15 p-12 text-center" data-testid="pitch-deck-empty">
      <Presentation className="mx-auto h-8 w-8 text-[#203524]/40" aria-hidden />
      <h3 className="mt-4 text-xl font-semibold">No slides available yet</h3>
      <p className="mt-2 text-[#11110D]/60">The deck has no slides published right now.</p>
      <button type="button" onClick={() => q.refetch()} className="mt-6 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470]" data-testid="button-refresh-pitch-deck">Check again</button>
    </div>
  );
  else body = (
    <>
      <p className="mb-4 max-w-3xl text-sm text-[#11110D]/65" data-testid="text-pitch-deck-description"><span className="font-semibold text-[#11110D]">{q.data.title}</span> · {q.data.totalSlides} slides. {q.data.description}</p>
      <Viewer slides={q.data.slides} title={q.data.title} pdfUrl={q.data.pdfUrl} />
    </>
  );

  return <>{body}</>;
}

export function PitchDeckSection() {
  return (
    <Section id="pitch-deck">
      <SectionHead permalinkId="pitch-deck" eyebrow="Pitch deck" title="Pitch Deck" lede="Original product deep-dive slides for customer conversations. Sign-in and Presenter Mode required." />
      <PresenterGate title="Pitch Deck" detail="Switch to Presenter Mode and sign in to view the internal product deep-dive slides.">
        <PitchDeckContent />
      </PresenterGate>
    </Section>
  );
}
