import { useState } from "react";
import { ArrowDown, ArrowDownRight, ArrowUp, Check, Copy, ListVideo, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { DEMO_NUGGETS, type NuggetId } from "@/data/demo-nuggets";
import { SectionLink } from "@/components/section-link";

type Props = {
  ids: readonly NuggetId[];
  currentId: NuggetId | null;
  playing: boolean;
  pending: boolean;
  shareUrl: string;
  notice: string;
  onChange: (ids: NuggetId[]) => void;
  onSelect: (id: NuggetId) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: () => void;
};

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DA33A]";
const ctrl = `inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;

/** Controlled playlist surface. Parent owns order, selection, playback and URL state. */
export function NuggetPlaylist({ ids, currentId, playing, pending, shareUrl, notice, onChange, onSelect, onPrevious, onNext, onToggle }: Props) {
  const [copyResult, setCopyResult] = useState<{ url: string; status: "ok" | "fail" } | null>(null);
  const copy = copyResult?.url === shareUrl ? copyResult.status : "idle";
  const titleOf = (id: NuggetId) => DEMO_NUGGETS.find((n) => n.id === id)?.title ?? id;
  const idx = currentId ? ids.indexOf(currentId) : -1;
  const empty = ids.length === 0;

  const toggleId = (id: NuggetId) => {
    if (ids.includes(id)) onChange(ids.filter((x) => x !== id));
    else onChange([...ids, id]);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const share = async () => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(shareUrl);
      setCopyResult({ url: shareUrl, status: "ok" });
    } catch {
      setCopyResult({ url: shareUrl, status: "fail" });
    }
  };

  const toggleLabel = pending ? "Cancel" : playing ? "Pause" : "Play";
  const ToggleIcon = pending ? X : playing ? Pause : Play;

  return (
    <section id="playlist" data-section-nav aria-labelledby="playlist-heading" className="mt-6 scroll-mt-24 rounded-[1.25rem] border border-[#11110D]/15 bg-[#FBFBF8] p-4 sm:p-5" data-testid="section-playlist">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-[0.65rem] uppercase tracking-[.12em] text-[#3F5A2A]">Presenter playlist</p>
          <h2 id="playlist-heading" className="flex items-center gap-1 text-lg font-semibold text-[#11110D]">
            Build a demo run <SectionLink id="playlist" label="Presenter playlist" />
          </h2>
          <p className="max-w-prose text-sm text-[#11110D]/70">Choose and order prepared simulations. Each one plays its fixed script with the same scope caveats; nothing acts on a live customer system.</p>
        </div>
        <ListVideo className="h-6 w-6 shrink-0 text-[#203524]" aria-hidden />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <fieldset className="rounded-2xl border border-[#CDD8BA] bg-[#EEF4E2] p-3">
          <legend className="px-1 text-xs font-semibold text-[#203524]">Include demos</legend>
          <ul className="grid gap-1.5">
            {DEMO_NUGGETS.map((n) => (
              <li key={n.id}>
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-[#E3EFCB] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#7DA33A]`}>
                  <input type="checkbox" className="h-4 w-4 accent-[#203524]" checked={ids.includes(n.id)} onChange={() => toggleId(n.id)} data-testid={`checkbox-playlist-${n.id}`} />
                  <span className="min-w-0 flex-1 font-medium text-[#11110D]">{n.title}</span>
                  <span className="mono text-[0.65rem] text-[#3F5A2A]">{n.stages.length} stages</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="min-w-0">
          {empty ? (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[#203524]/30 p-6 text-center" data-testid="status-playlist-empty">
              <div>
                <p className="text-sm font-semibold text-[#203524]">Your playlist is empty</p>
                <p className="mt-1 text-xs text-[#11110D]/60">Tick at least one demo to start a presenter run.</p>
              </div>
            </div>
          ) : (
            <ol className="grid gap-1.5" aria-label="Playlist order" data-testid="list-playlist">
              {ids.map((id, i) => {
                const cur = id === currentId;
                return (
                  <li key={id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-2 py-1.5 ${cur ? "border-[#203524] bg-[#203524] text-[#F5F5F2]" : "border-[#CDD8BA] bg-white/60 text-[#11110D]"}`} data-testid={`row-playlist-${id}`}>
                    <span className={`mono w-6 text-center text-xs ${cur ? "text-[#D1F470]" : "text-[#3F5A2A]"}`} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <button type="button" onClick={() => onSelect(id)} aria-current={cur ? "true" : undefined} className={`min-w-0 flex-1 rounded-lg px-1 text-left text-sm font-semibold ${focus}`} data-testid={`button-playlist-select-${id}`}>
                      {titleOf(id)}{cur && <span className="sr-only"> (current)</span>}
                    </button>
                    <a href={`#${id}`} className={`inline-flex items-center gap-0.5 rounded-lg px-1 text-xs font-semibold ${cur ? "text-[#D1F470]" : "text-[#203524]"} ${focus}`} data-testid={`link-playlist-open-${id}`}>
                      Full demo<ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                    <span className="flex gap-1">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${titleOf(id)} up`} className={`grid h-8 w-8 place-items-center rounded-full hover:bg-[#D1F470]/30 disabled:opacity-30 ${focus}`} data-testid={`button-playlist-up-${id}`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
                      <button type="button" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${titleOf(id)} down`} className={`grid h-8 w-8 place-items-center rounded-full hover:bg-[#D1F470]/30 disabled:opacity-30 ${focus}`} data-testid={`button-playlist-down-${id}`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
                      <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} aria-label={`Remove ${titleOf(id)}`} className={`grid h-8 w-8 place-items-center rounded-full hover:bg-[#D1F470]/30 ${focus}`} data-testid={`button-playlist-remove-${id}`}><X className="h-4 w-4" aria-hidden /></button>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Playlist controls">
            <button type="button" onClick={onPrevious} disabled={empty || idx <= 0} className={`${ctrl} border border-[#203524]/25 text-[#203524] hover:bg-[#203524]/10`} data-testid="button-playlist-previous"><SkipBack className="h-4 w-4" aria-hidden />Previous</button>
            <button type="button" onClick={onToggle} disabled={empty || !currentId} className={`${ctrl} bg-[#203524] text-[#D1F470] hover:bg-[#2B4630]`} data-testid="button-playlist-toggle"><ToggleIcon className="h-4 w-4" aria-hidden />{toggleLabel}</button>
            <button type="button" onClick={onNext} disabled={empty || idx >= ids.length - 1} className={`${ctrl} border border-[#203524]/25 text-[#203524] hover:bg-[#203524]/10`} data-testid="button-playlist-next">Next<SkipForward className="h-4 w-4" aria-hidden /></button>
            <span className="mono ml-auto text-xs text-[#3F5A2A]" data-testid="text-playlist-position">{empty ? "No demos" : idx >= 0 ? `${idx + 1} of ${ids.length}` : `${ids.length} queued`}</span>
          </div>
          <p className="mt-1 text-xs text-[#11110D]/60">Previous and Next move to that demo paused; press Play when you are ready.</p>
          <p className="mt-1 min-h-[1rem] text-xs font-medium text-[#203524]" role="status" aria-live="polite" data-testid="status-playlist-notice">{notice}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#11110D]/10 bg-[#F2F2EC] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={share} disabled={empty} className={`${ctrl} bg-[#D1F470] text-[#203524] hover:bg-[#C4EA5A]`} data-testid="button-playlist-share">
            {copy === "ok" ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}Copy share link
          </button>
          <p className="min-w-0 flex-1 text-xs text-[#11110D]/70">Shared links carry only the ordered demo IDs. Narration starts off for recipients, and no customer data is included.</p>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-xs font-medium" data-testid="status-playlist-share">
          {copy === "ok" && <span className="text-[#3F5A2A]">Link copied to clipboard.</span>}
          {copy === "fail" && <span className="text-[#8A2E1F]">Could not copy automatically. Select the link below and copy it manually.</span>}
        </p>
        {copy === "fail" && (
          <label className="mt-1 block text-xs text-[#11110D]/70">
            <span className="sr-only">Playlist share link</span>
            <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className={`mono w-full rounded-lg border border-[#CDD8BA] bg-white/70 px-2 py-1.5 text-xs text-[#11110D] ${focus}`} data-testid="input-playlist-share-url" />
          </label>
        )}
      </div>
    </section>
  );
}
