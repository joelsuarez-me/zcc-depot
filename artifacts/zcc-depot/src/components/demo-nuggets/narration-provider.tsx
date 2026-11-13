import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { createDemoSpeech, getGetDemoVoicesQueryKey, useGetDemoVoices, type DemoVoiceRole } from "@workspace/api-client-react";
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
  const previewStop = useRef<(() => void) | null>(null);
  const blobs = useRef(new Map<string, Blob>());
  const clearPlayback = useCallback(() => {
    previewStop.current?.();
    stops.current.forEach(stop => stop());
    stopRef.current();
  }, []);
  useEffect(() => {
    setChoices({}); blobs.current.clear(); clearPlayback();
  }, [owner, clearPlayback]);
  useEffect(() => () => { previewStop.current?.(); stops.current.forEach(stop => stop()); blobs.current.clear(); }, []);
  const voices = catalog.data?.voices ?? [];
  const selected = Object.fromEntries(VOICE_ROLES.map((role, index) => [
    role.id, voices.some(v => v.id === choices[role.id]) ? choices[role.id]! : voices[index % Math.max(1, voices.length)]?.id ?? "",
  ])) as Record<DemoVoiceRole, string>;
  const settingsKey = `${owner}:${enabled}:${VOICE_ROLES.map(r => selected[r.id]).join(":")}`;
  const lines = catalog.data?.lines;
  const getClip = useCallback(async (nuggetId: NuggetId, lineId: string, signal: AbortSignal, auditionVoiceId?: string) => {
    if (!enabled) throw new Error("Enable the ElevenLabs voice overlay and sign in to prepare narration.");
    if (catalog.error) throw catalog.error;
    const line = lines?.find(item => item.nuggetId === nuggetId && item.id === lineId);
    if (!line) throw new Error("Available voices are still loading. Wait for the voice list or retry it before playing narration.");
    const voiceId = auditionVoiceId ?? selected[line.role];
    if (!voiceId) throw new Error(`Choose a voice for ${line.role} before playing.`);
    if (!voices.some(voice => voice.id === voiceId)) throw new Error("That voice is no longer available. Reload the voice list.");
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
    previewStop.current?.();
    for (const [key, stop] of stops.current) if (key !== id) stop();
  }, []);
  const registerPreview = useCallback((stop: () => void) => {
    previewStop.current = stop;
    return () => { if (previewStop.current === stop) previewStop.current = null; };
  }, []);
  const getPreviewClip = useCallback(async (role: DemoVoiceRole, voiceId: string, signal: AbortSignal) => {
    const line = lines?.find(item => item.role === role);
    if (!line) throw new Error("The voice samples are still loading. Reload the voice list and try again.");
    try { return await getClip(line.nuggetId, line.id, signal, voiceId); }
    catch (error) {
      if (signal.aborted) throw error;
      throw new Error(voiceError(error));
    }
  }, [lines, getClip]);
  return {
    auth, enabled, wanted, volume, captions, voices, selected, settingsKey, lines,
    catalog, getClip, getPreviewClip, register, claim, registerPreview, stopPlayback: clearPlayback,
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
