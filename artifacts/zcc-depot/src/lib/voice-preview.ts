import type { DemoVoiceRole } from "@workspace/api-client-react";

export type VoicePreviewState = {
  status: "idle" | "loading" | "playing" | "error";
  voiceId: string | null;
  role: DemoVoiceRole | null;
  error: string | null;
};
export const IDLE_VOICE_PREVIEW: VoicePreviewState = { status: "idle", voiceId: null, role: null, error: null };
type PreviewOptions = {
  load: (role: DemoVoiceRole, voiceId: string, signal: AbortSignal) => Promise<Blob>;
  onChange: (state: VoicePreviewState) => void;
  createAudio?: () => HTMLAudioElement;
  urls?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
};

/** One user-initiated audition at a time; it never changes the assigned cast. */
export class VoicePreviewController {
  private epoch = 0;
  private abort?: AbortController;
  private audio?: HTMLAudioElement;
  private objectUrl?: string;
  private volume = 0.9;
  private disposed = false;
  private options: PreviewOptions;
  constructor(options: PreviewOptions) { this.options = options; }

  private emit(state: VoicePreviewState) { if (!this.disposed) this.options.onChange(state); }
  private cleanup() {
    this.abort?.abort(); this.abort = undefined;
    if (this.audio) {
      this.audio.onended = null; this.audio.onerror = null;
      this.audio.pause(); this.audio.removeAttribute("src"); this.audio.load();
      this.audio = undefined;
    }
    if (this.objectUrl) {
      (this.options.urls ?? URL).revokeObjectURL(this.objectUrl); this.objectUrl = undefined;
    }
  }
  stop = () => { this.epoch++; this.cleanup(); this.emit({ ...IDLE_VOICE_PREVIEW }); };
  setVolume(value: number) {
    this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.9;
    if (this.audio) this.audio.volume = this.volume;
  }
  async play(role: DemoVoiceRole, voiceId: string) {
    if (this.disposed) return;
    this.stop();
    const epoch = this.epoch;
    const abort = new AbortController(); this.abort = abort;
    this.emit({ status: "loading", voiceId, role, error: null });
    const fail = (message: string) => {
      if (epoch !== this.epoch || this.disposed) return;
      this.epoch++; this.cleanup();
      this.emit({ status: "error", voiceId, role, error: message });
    };
    try {
      const blob = await this.options.load(role, voiceId, abort.signal);
      if (abort.signal.aborted || epoch !== this.epoch || this.disposed) return;
      if (!blob.size || !blob.type.startsWith("audio/")) throw new Error("No playable voice sample was returned.");
      const audio = (this.options.createAudio ?? (() => new Audio()))();
      this.audio = audio;
      this.objectUrl = (this.options.urls ?? URL).createObjectURL(blob);
      audio.src = this.objectUrl; audio.volume = this.volume;
      audio.onended = () => { if (epoch === this.epoch) this.stop(); };
      audio.onerror = () => fail("The voice sample could not be played. Try Preview again.");
      await audio.play();
      if (abort.signal.aborted || epoch !== this.epoch || this.disposed) return;
      this.emit({ status: "playing", voiceId, role, error: null });
    } catch (error) {
      if (abort.signal.aborted || epoch !== this.epoch || this.disposed) return;
      const message = error instanceof Error ? error.message : "The voice sample could not be played.";
      fail(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Your browser blocked audio. Click Preview again to allow the voice sample."
        : message);
    }
  }
  dispose() { this.disposed = true; this.stop(); }
}
