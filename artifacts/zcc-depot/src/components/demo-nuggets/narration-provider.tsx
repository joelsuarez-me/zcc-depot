import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { createDemoSpeech, getGetDemoVoicesQueryKey, useGetDemoVoices, type DemoVoiceRole, type DemoScriptLocale } from "@workspace/api-client-react";
import type { NuggetId } from "@/data/demo-nuggets";
import { voiceError } from "@/lib/narrated-playback";
import { defaultNarrationPreferences, useSavedNarration } from "./use-saved-narration";

export const VOICE_ROLES: { id: DemoVoiceRole; label: string }[] = [
  { id: "caller", label: "Caller" }, { id: "ai-agent", label: "AI Agent" },
  { id: "human-agent", label: "Human Agent" }, { id: "narrator", label: "Narrator" },
];
export const SCRIPT_LANGUAGES: { id: DemoScriptLocale; label: string }[] = [
  { id: "en-US", label: "English (US)" },
  { id: "es-ES", label: "Español (España)" },
  { id: "fr-FR", label: "Français (France)" },
];

function useNarrationSettings(auth: ReturnType<typeof useAuth>, onStop: () => void, requireOptIn: boolean) {
  const owner = auth.user?.id ?? "";
  const preferences = useSavedNarration(owner);
  // Visit-only and account-owned; shared playlist URLs never select a paid script.
  const [scriptLocale, setScriptLocale] = useState<DemoScriptLocale>("en-US");
  const { enabled: wanted, volume, captions, voices: choices } = preferences.settings;
  const [consented, setConsented] = useState(!requireOptIn);
  const effectiveWanted = wanted && consented;
  const enabled = effectiveWanted && auth.isAuthenticated && preferences.preferencesReady;
  const catalog = useGetDemoVoices({ query: {
    queryKey: [...getGetDemoVoicesQueryKey(), owner], enabled: auth.isAuthenticated && preferences.preferencesReady, retry: false, staleTime: 60_000,
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
    blobs.current.clear(); clearPlayback();
  }, [owner, clearPlayback]);
  useEffect(() => () => { previewStop.current?.(); stops.current.forEach(stop => stop()); blobs.current.clear(); }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) clearPlayback(); };
    const navigate = () => {
      clearPlayback();
      if (new URLSearchParams(window.location.search).has("playlist")) setConsented(false);
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", clearPlayback);
    window.addEventListener("popstate", navigate);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", clearPlayback);
      window.removeEventListener("popstate", navigate);
    };
  }, [clearPlayback]);
  const voices = catalog.data?.voices ?? [];
  const selected = Object.fromEntries(VOICE_ROLES.map((role, index) => [
    role.id, choices[role.id] ?? voices[index % Math.max(1, voices.length)]?.id ?? "",
  ])) as Record<DemoVoiceRole, string>;
  const unavailableRoles = catalog.data ? VOICE_ROLES.filter(role => choices[role.id] && !voices.some(v => v.id === choices[role.id])) : [];
  const settingsKey = `${owner}:${enabled}:${scriptLocale}:${VOICE_ROLES.map(r => selected[r.id]).join(":")}`;
  const lines = useMemo(() => catalog.data?.lines.filter(line => line.locale === scriptLocale), [catalog.data?.lines, scriptLocale]);
  const getClip = useCallback(async (nuggetId: NuggetId, lineId: string, signal: AbortSignal, auditionVoiceId?: string) => {
    if (!enabled) throw new Error("Enable the ElevenLabs voice overlay and sign in to prepare narration.");
    if (catalog.error) throw catalog.error;
    if (!auditionVoiceId && VOICE_ROLES.some(role => choices[role.id] && !voices.some(v => v.id === choices[role.id]))) {
      throw new Error("A saved voice is unavailable. Assign a replacement or reset your narration settings. No substitute voice will be used.");
    }
    const line = lines?.find(item => item.nuggetId === nuggetId && item.id === lineId);
    if (!line) throw new Error("Available voices are still loading. Wait for the voice list or retry it before playing narration.");
    const voiceId = auditionVoiceId ?? selected[line.role];
    if (!voiceId) throw new Error(`Choose a voice for ${line.role} before playing.`);
    if (!voices.some(voice => voice.id === voiceId)) throw new Error("That voice is no longer available. Reload the voice list.");
    const key = JSON.stringify([owner, scriptLocale, nuggetId, lineId, voiceId, line.text]);
    const cached = blobs.current.get(key);
    if (cached) return cached;
    const blob = await createDemoSpeech({ nuggetId, lineId, voiceId, locale: scriptLocale }, { signal, credentials: "include" });
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
  }, [enabled, owner, settingsKey, lines, catalog.data, catalog.error]);
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
    auth, enabled, wanted: effectiveWanted, volume, captions, voices, selected, settingsKey, lines, unavailableRoles,
    scriptLocale,
    setScriptLanguage(locale: DemoScriptLocale) {
      if (!SCRIPT_LANGUAGES.some(language => language.id === locale)) return;
      clearPlayback();
      setScriptLocale(locale);
    },
    preferencesReady: preferences.preferencesReady,
    preferencesStatus: preferences.preferencesStatus,
    preferencesError: preferences.preferencesError,
    retryPreferences: preferences.retryPreferences,
    catalog, getClip, getPreviewClip, register, claim, registerPreview, stopPlayback: clearPlayback,
    setEnabled(value: boolean) { clearPlayback(); setConsented(value); preferences.update({ enabled: value }); },
    setVoice(role: DemoVoiceRole, id: string) {
      clearPlayback(); preferences.update({ voices: { ...selected, [role]: id } });
    },
    setVolume(value: number) { preferences.update({ volume: value }); },
    setCaptions(value: boolean) { preferences.update({ captions: value }); },
    resetPreferences() {
      clearPlayback();
      setScriptLocale("en-US");
      preferences.update(defaultNarrationPreferences());
    },
  };
}
type Narration = ReturnType<typeof useNarrationSettings>;
const NarrationContext = createContext<Narration | null>(null);

export function NarrationProvider({ children, onStop, requireOptIn = false }: { children: ReactNode; onStop: () => void; requireOptIn?: boolean }) {
  const auth = useAuth();
  return <OwnedNarrationProvider key={auth.user?.id ?? ""} auth={auth} onStop={onStop} requireOptIn={requireOptIn}>{children}</OwnedNarrationProvider>;
}
function OwnedNarrationProvider({ auth, children, onStop, requireOptIn }: { auth: ReturnType<typeof useAuth>; children: ReactNode; onStop: () => void; requireOptIn: boolean }) {
  const settings = useNarrationSettings(auth, onStop, requireOptIn);
  return <NarrationContext.Provider value={settings}>{children}</NarrationContext.Provider>;
}
export function useNarration() {
  const value = useContext(NarrationContext);
  if (!value) throw new Error("Demo narration requires NarrationProvider.");
  return value;
}
