/** Audio is the clock: a visual stage never finishes before its spoken line. */
export type NarrationSnapshot = {
  stepIndex: number; fraction: number; interacted: boolean;
  playing: boolean; pending: boolean; complete: boolean; error: string | null;
};
export const initialNarration = (): NarrationSnapshot => ({
  stepIndex: 0, fraction: 0, interacted: false, playing: false, pending: false, complete: false, error: null,
});
export type DemoAudio = {
  src: string; currentTime: number; duration: number; volume: number;
  play(): Promise<void>; pause(): void; load(): void;
  removeAttribute?(name: string): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
};
type Options = {
  count: number;
  audio: DemoAudio;
  loadClip: (index: number, signal: AbortSignal) => Promise<Blob>;
  createUrl: (blob: Blob) => string;
  revokeUrl: (url: string) => void;
  onChange: (snapshot: NarrationSnapshot) => void;
  onFinish: () => void;
};

export function voiceError(error: unknown): string {
  if (error && typeof error === "object") {
    if ("status" in error && error.status === 401) return "Your session expired. Sign in again to use ElevenLabs narration.";
    if ("name" in error && error.name === "NotAllowedError") return "Your browser blocked sound. Press Play again to allow audio, or choose visual-only playback.";
    if ("data" in error && error.data && typeof error.data === "object" && "error" in error.data && typeof error.data.error === "string") return error.data.error;
  }
  return error instanceof Error ? error.message : "Narration could not play. Retry or choose visual-only playback.";
}

export class NarratedPlayback {
  snapshot = initialNarration();
  private options: Options;
  private desired = false;
  private epoch = 0;
  private abort?: AbortController;
  private url: string | null = null;
  private loadedIndex = -1;
  private disposed = false;
  private handlers: Record<string, () => void>;

  constructor(options: Options) {
    if (!Number.isInteger(options.count) || options.count < 1) throw new Error("Narration requires at least one stage.");
    this.options = options;
    this.handlers = {
      timeupdate: () => {
        const { currentTime, duration } = options.audio;
        if (!this.desired || this.loadedIndex !== this.snapshot.stepIndex || !Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
        // Let 'ended', not time rounding, advance to the next stage.
        this.update({ fraction: Math.min(0.999999, Math.max(0, currentTime / duration)) });
      },
      waiting: () => { if (this.desired) this.update({ pending: true, playing: false }); },
      playing: () => { if (this.desired) this.update({ pending: false, playing: true }); },
      ended: () => {
        if (!this.desired || this.loadedIndex !== this.snapshot.stepIndex) return;
        if (this.snapshot.stepIndex < options.count - 1) this.seek(this.snapshot.stepIndex + 1, true);
        else {
          this.pause();
          this.update({ fraction: 1, complete: true, error: null });
          options.onFinish();
        }
      },
      error: () => {
        if (this.desired) { this.release(); this.fail(new Error("The generated audio could not be decoded. Retry or choose visual-only playback.")); }
      },
    };
    for (const [event, handler] of Object.entries(this.handlers)) options.audio.addEventListener(event, handler);
  }
  private update(patch: Partial<NarrationSnapshot>) {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, ...patch };
    this.options.onChange(this.snapshot);
  }
  private release() {
    this.options.audio.pause();
    if (this.options.audio.removeAttribute) this.options.audio.removeAttribute("src");
    else this.options.audio.src = "";
    this.options.audio.load();
    if (this.url) this.options.revokeUrl(this.url);
    this.url = null; this.loadedIndex = -1;
  }
  private fail(error: unknown) {
    this.pause();
    this.update({ error: voiceError(error) });
  }
  async play(): Promise<void> {
    if (this.disposed || (this.desired && (this.snapshot.playing || this.snapshot.pending))) return;
    if (this.snapshot.complete) this.seek(0, false);
    this.desired = true;
    const token = ++this.epoch;
    this.abort?.abort();
    const controller = new AbortController();
    this.abort = controller;
    this.update({ interacted: true, pending: true, error: null });
    try {
      if (this.loadedIndex !== this.snapshot.stepIndex || !this.url) {
        const blob = await this.options.loadClip(this.snapshot.stepIndex, controller.signal);
        if (token !== this.epoch || !this.desired || this.disposed) return;
        if (!blob.size || !blob.type.startsWith("audio/")) throw new Error("ElevenLabs returned no playable audio.");
        this.release();
        this.url = this.options.createUrl(blob);
        this.loadedIndex = this.snapshot.stepIndex;
        this.update({ fraction: 0 });
        this.options.audio.src = this.url;
        this.options.audio.load();
      }
      await this.options.audio.play();
      if (token === this.epoch && this.desired) this.update({ playing: true, pending: false });
    } catch (error) {
      if (token === this.epoch && !this.disposed) this.fail(error);
    }
  }
  pause() {
    this.desired = false; this.epoch++;
    this.abort?.abort();
    this.options.audio.pause();
    this.update({ playing: false, pending: false });
  }
  seek(index: number, resume = this.desired) {
    if (this.disposed) return;
    this.pause(); this.release();
    const stepIndex = Math.max(0, Math.min(this.options.count - 1, Number.isFinite(index) ? Math.floor(index) : 0));
    this.update({ stepIndex, fraction: 0, complete: false, interacted: true, error: null });
    if (resume) void this.play();
  }
  restart() { this.seek(0, true); }
  reset() { this.seek(0, false); this.update({ interacted: false }); }
  setVolume(volume: number) { this.options.audio.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1)); }
  dispose() {
    this.disposed = true; this.desired = false; this.epoch++;
    this.abort?.abort(); this.release();
    for (const [event, handler] of Object.entries(this.handlers)) this.options.audio.removeEventListener(event, handler);
  }
}
