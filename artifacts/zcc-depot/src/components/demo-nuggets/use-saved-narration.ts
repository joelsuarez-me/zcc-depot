import { useCallback, useEffect, useRef, useState } from "react";
import { getDemoNarrationPreferences, saveDemoNarrationPreferences, type DemoNarrationPreferences } from "@workspace/api-client-react";

export const defaultNarrationPreferences = (): DemoNarrationPreferences => ({
  voices: {}, enabled: true, volume: 0.9, captions: true,
});

/** Mounted separately for each account. Hydration never starts audio or writes defaults. */
export function useSavedNarration(owner: string) {
  const [settings, setSettings] = useState(defaultNarrationPreferences);
  const [loaded, setLoaded] = useState(!owner);
  const [persisted, setPersisted] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    if (owner) {
      setLoadError(false);
      getDemoNarrationPreferences({ signal: controller.signal, credentials: "include" }).then(value => {
        if (controller.signal.aborted) return;
        setSettings(value);
        setPersisted(JSON.stringify(value));
        setLoaded(true);
      }).catch(() => { if (!controller.signal.aborted) setLoadError(true); });
    }
    return () => controller.abort();
  }, [owner, attempt]);

  const serialized = JSON.stringify(settings);
  useEffect(() => {
    if (!owner || !loaded || saving || saveError || serialized === persisted) return;
    const timer = setTimeout(() => {
      const controller = lifecycle.current!;
      setSaving(true);
      // Only one write runs at a time. Changes made during a write are saved next.
      saveDemoNarrationPreferences(JSON.parse(serialized), { signal: controller.signal, credentials: "include" }).then(() => {
        if (!controller.signal.aborted) setPersisted(serialized);
      }).catch(() => {
        if (!controller.signal.aborted) setSaveError(true);
      }).finally(() => { if (!controller.signal.aborted) setSaving(false); });
    }, 400);
    return () => clearTimeout(timer);
  }, [owner, loaded, saving, saveError, serialized, persisted]);

  const update = useCallback((patch: Partial<DemoNarrationPreferences>) => {
    if (!loaded || !owner) return;
    setSaveError(false);
    setSettings(previous => ({ ...previous, ...patch }));
  }, [loaded, owner]);

  return {
    settings, update,
    preferencesReady: loaded,
    preferencesStatus: !loaded ? (loadError ? "Could not load your saved settings. Retry before changing them." : "Loading your saved settings…")
      : saveError ? "Could not save your settings. Your changes apply here, but may be lost when you leave."
      : saving || serialized !== persisted ? "Saving your settings…" : "Settings saved to your account.",
    preferencesError: loadError || saveError,
    retryPreferences() { if (loadError) setAttempt(value => value + 1); else setSaveError(false); },
  };
}
