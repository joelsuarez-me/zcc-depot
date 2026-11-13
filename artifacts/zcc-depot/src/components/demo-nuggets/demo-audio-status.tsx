import { Volume2, VolumeX } from "lucide-react";
import { useNarration } from "./narration-provider";

/** Keep audio recovery beside the player, even when opened by a deep link. */
export function DemoAudioStatus({ id, dark = false }: { id: string; dark?: boolean }) {
  const n = useNarration();
  let message: string;
  let action: { label: string; run: () => void } | undefined;
  if (!n.auth.isAuthenticated) {
    message = "Sound is off. Sign in to play this demo with ElevenLabs voices.";
    action = { label: "Sign in for audio", run: () => n.auth.login() };
  } else if (!n.preferencesReady) {
    message = n.preferencesError ? "Your audio settings could not load. Retry before playing with sound." : "Loading your audio settings…";
    if (n.preferencesError) action = { label: "Retry audio settings", run: n.retryPreferences };
  } else if (!n.enabled) {
    message = "Sound is off. This demo is currently using visual-only playback.";
    action = { label: "Enable ElevenLabs audio", run: () => { n.setEnabled(true); if (n.volume === 0) n.setVolume(.9); } };
  } else if (n.volume === 0) {
    message = "Narration is muted: your saved volume is 0%.";
    action = { label: "Unmute audio", run: () => n.setVolume(.9) };
  } else {
    message = `ElevenLabs audio on · volume ${Math.round(n.volume * 100)}%`;
  }
  const audible = n.enabled && n.volume > 0;
  return (
    <div className={`rounded-xl border p-3 text-sm ${dark ? "border-white/20 bg-white/5" : "border-[#203524]/20 bg-[#ECF4DE]"}`}
      data-testid={`audio-status-${id}`}>
      <p role="status" className="flex items-start gap-2">
        {audible ? <Volume2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <VolumeX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
        {message}
      </p>
      {action && <button type="button" onClick={action.run}
        className="mt-2 min-h-11 rounded-full bg-[#D1F470] px-4 font-semibold text-[#11110D]"
        data-testid={`button-audio-enable-${id}`}>{action.label}</button>}
      <a href="#voice-talent" className="mt-2 block min-h-8 text-xs font-semibold underline underline-offset-4">Voice and volume settings</a>
    </div>
  );
}
