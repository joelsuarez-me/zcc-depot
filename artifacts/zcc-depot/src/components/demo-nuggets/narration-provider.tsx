import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { createDemoSpeech, getGetDemoVoicesQueryKey, useGetDemoVoices, type DemoVoiceRole } from "@workspace/api-client-react";
import { Volume2, Loader2, RefreshCw } from "lucide-react";
import type { NuggetId } from "@/data/demo-nuggets";
import { voiceError } from "@/lib/narrated-playback";

export const VOICE_ROLES: { id: DemoVoiceRole; label: string }[] = [
  { id: "caller", label: "Caller" }, { id: "ai-agent", label: "AI Agent" },
  { id: "human-agent", label: "Human Agent" }, { id: "narrator", label: "Narrator" },
];

function useNarrationSettings(onStop: () => void) {
  const auth = useAuth();
  const [wanted, setWanted] = useState(true);
  const [volume, setVolume] = useState(0.9);
  const [captions, setCaptions] = useState(true);
  const [choices, setChoices] = useState<Partial<Record<DemoVoiceRole, string>>>({});
  const enabled = wanted && auth.isAuthenticated;
  const owner = auth.user?.id ?? "";
  const catalog = useGetDemoVoices({ query: {
    queryKey: [...getGetDemoVoicesQueryKey(), owner], enabled, retry: false, staleTime: 60_000,
  } });
  const stopRef = useRef(onStop); stopRef.current = onStop;
  const stops = useRef(new Map<NuggetId, () => void>());
  const blobs = useRef(new Map<string, Blob>());
  const clearPlayback = useCallback(() => {
    stops.current.forEach(stop => stop());
    stopRef.current();
  }, []);
  useEffect(() => {
    setChoices({}); blobs.current.clear(); clearPlayback();
  }, [owner, clearPlayback]);
  useEffect(() => () => { stops.current.forEach(stop => stop()); blobs.current.clear(); }, []);
  const voices = catalog.data?.voices ?? [];
  const selected = Object.fromEntries(VOICE_ROLES.map((role, index) => [
    role.id, voices.some(v => v.id === choices[role.id]) ? choices[role.id]! : voices[index % Math.max(1, voices.length)]?.id ?? "",
  ])) as Record<DemoVoiceRole, string>;
  const settingsKey = `${owner}:${enabled}:${VOICE_ROLES.map(r => selected[r.id]).join(":")}`;
  const lines = catalog.data?.lines;
  const getClip = useCallback(async (nuggetId: NuggetId, lineId: string, signal: AbortSignal) => {
    if (!enabled) throw new Error("Enable the ElevenLabs voice overlay and sign in to prepare narration.");
    if (catalog.error) throw catalog.error;
    const line = lines?.find(item => item.nuggetId === nuggetId && item.id === lineId);
    if (!line) throw new Error("Available voices are still loading. Wait for the voice list or retry it before playing narration.");
    const voiceId = selected[line.role];
    if (!voiceId) throw new Error(`Choose a voice for ${line.role} before playing.`);
    const key = `${owner}:${nuggetId}:${lineId}:${voiceId}`;
    const cached = blobs.current.get(key);
    if (cached) return cached;
    const blob = await createDemoSpeech({ nuggetId, lineId, voiceId }, { signal, credentials: "include" });
    signal.throwIfAborted();
    if (!(blob instanceof Blob) || !blob.type.startsWith("audio/") || !blob.size) throw new Error("No playable speech was returned.");
    let bytes = [...blobs.current.values()].reduce((sum, b) => sum + b.size, 0);
    for (const [id, b] of blobs.current) {
      if (blobs.current.size < 48 && bytes + blob.size <= 16_000_000) break;
      bytes -= b.size; blobs.current.delete(id);
    }
    if (blob.size <= 16_000_000) blobs.current.set(key, blob);
    return blob;
  // The settings key captures the selected voices without object-identity churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, owner, settingsKey, lines, catalog.error]);
  const register = useCallback((id: NuggetId, stop: () => void) => {
    stops.current.set(id, stop);
    return () => { if (stops.current.get(id) === stop) stops.current.delete(id); };
  }, []);
  const claim = useCallback((id: NuggetId) => {
    for (const [key, stop] of stops.current) if (key !== id) stop();
  }, []);
  return {
    auth, enabled, wanted, volume, captions, voices, selected, settingsKey, lines,
    catalog, getClip, register, claim,
    setEnabled(value: boolean) { clearPlayback(); setWanted(value); },
    setVoice(role: DemoVoiceRole, id: string) {
      clearPlayback(); setChoices(previous => ({ ...previous, ...selected, [role]: id }));
    },
    setVolume, setCaptions,
  };
}
type Narration = ReturnType<typeof useNarrationSettings>;
const NarrationContext = createContext<Narration | null>(null);

export function NarrationProvider({ children, onStop }: { children: ReactNode; onStop: () => void }) {
  const settings = useNarrationSettings(onStop);
  return <NarrationContext.Provider value={settings}>{children}</NarrationContext.Provider>;
}
export function useNarration() {
  const value = useContext(NarrationContext);
  if (!value) throw new Error("Demo narration requires NarrationProvider.");
  return value;
}

export function NarrationControls() {
  const n = useNarration();
  const voiceCount = n.voices.length;
  const roleVoices = useMemo(() => n.voices, [n.voices]);
  return (
    <section aria-label="ElevenLabs narration settings" className="mt-6 rounded-2xl border border-[#203524]/20 bg-[#EEF4E2] p-5 text-[#11110D]" data-testid="narration-settings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4" aria-hidden />ElevenLabs voice overlay</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed opacity-70">AI-generated sample dialogue, not a real call. Changing voices or playback mode pauses the demo.</p>
        </div>
        {n.auth.isAuthenticated ? (
          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={n.wanted} onChange={e => n.setEnabled(e.target.checked)} className="h-4 w-4 accent-[#203524]" data-testid="toggle-narration" />
            Voice overlay {n.enabled ? "on" : "off"}
          </label>
        ) : <button type="button" onClick={() => n.auth.login()} className="min-h-11 rounded-full bg-[#203524] px-4 text-sm font-semibold text-[#D1F470]" data-testid="button-narration-sign-in">Sign in for voice overlay</button>}
      </div>
      {!n.auth.isAuthenticated && <p className="mt-3 text-xs opacity-70">Visual-only playback is available without signing in. Speech generation requires a signed-in session.</p>}
      {n.enabled && (
        <>
          {n.catalog.isFetching && <p role="status" className="mt-4 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading available ElevenLabs voices…</p>}
          {n.catalog.error && (
            <div role="alert" className="mt-4 rounded-xl border border-[#9A4C2C]/25 bg-white/70 p-3 text-sm" data-testid="error-voice-catalog">
              <p>{voiceError(n.catalog.error)}</p>
              <button type="button" onClick={() => void n.catalog.refetch()} className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold underline" disabled={n.catalog.isFetching}><RefreshCw className="h-4 w-4" aria-hidden />Retry voice connection</button>
            </div>
          )}
          {voiceCount > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {VOICE_ROLES.map(role => (
                <label key={role.id} className="min-w-0 text-xs font-semibold">{role.label}
                  <select value={n.selected[role.id]} onChange={e => n.setVoice(role.id, e.target.value)} data-testid={`select-voice-${role.id}`} className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-[#203524]/25 bg-white px-3 text-sm font-normal">
                    {roleVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
          {voiceCount > 0 && voiceCount < 3 && <p className="mt-3 text-xs opacity-70">Only {voiceCount} {voiceCount === 1 ? "voice is" : "voices are"} available. Add voices in ElevenLabs to give Caller, AI Agent and Human Agent distinct voices.</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex min-h-11 items-center gap-3 text-xs font-semibold">Volume
              <input aria-label="Narration volume" type="range" min="0" max="1" step="0.05" value={n.volume} onChange={e => n.setVolume(Number(e.target.value))} className="w-28 accent-[#203524]" />
              <span className="w-8">{Math.round(n.volume * 100)}%</span>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={n.captions} onChange={e => n.setCaptions(e.target.checked)} className="h-4 w-4 accent-[#203524]" />Dialogue captions</label>
            <button type="button" onClick={() => n.setEnabled(false)} className="min-h-11 text-xs font-semibold underline underline-offset-4" data-testid="button-visual-only">Use visual-only playback</button>
          </div>
        </>
      )}
      {n.auth.isAuthenticated && !n.enabled && <p className="mt-3 text-xs opacity-70">Visual-only mode. Enable the overlay to use the connected ElevenLabs voices.</p>}
    </section>
  );
}
