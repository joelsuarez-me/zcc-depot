import { ReplitConnectors } from "@replit/connectors-sdk";
import type { DemoNarrationLine, DemoVoice, DemoNuggetId, DemoVoiceRole } from "@workspace/api-zod";

/** Prepared dialogue only: never accept arbitrary text or customer information. */
const scripts: Record<DemoNuggetId, { id: string; role: DemoVoiceRole; text: string }[]> = {
  "voice-copilot": [
    { id: "connected", role: "caller", text: "Hi, I'm Terry. I would like to return the order that arrived yesterday. Could you help me?" },
    { id: "intent", role: "narrator", text: "In this prepared example, a returns request and sample transcript appear beside the customer's context." },
    { id: "knowledge", role: "narrator", text: "An illustrative returns and refunds article is surfaced for the agent to review. Actual availability depends on configuration." },
    { id: "guidance", role: "human-agent", text: "I'll check your order, review the return conditions, and explain the next steps. Let me verify those details first." },
    { id: "wrap-up", role: "narrator", text: "The human agent reviews the suggested guidance and its source before responding. No return or account change is performed in this simulation." },
  ],
  "voice-qa": [
    { id: "conversation", role: "caller", text: "I'd like to return a bag of coffee from my recent order, please." },
    { id: "review", role: "human-agent", text: "Of course. I have your order number, fifteen thousand twenty-three. Let me review the details with you." },
    { id: "risk", role: "narrator", text: "This prepared quality-review example highlights a possible customer retention follow-up. It is an illustrative spotlight, not a real assessment." },
    { id: "product", role: "narrator", text: "A sample product-issue spotlight helps a reviewer identify a conversation to inspect. No recording is uploaded or analyzed." },
    { id: "service", role: "narrator", text: "The final sample spotlight recognizes the agent's prompt order confirmation. Quality capabilities require the relevant product and configuration." },
  ],
  "voice-ai-agents": [
    { id: "request", role: "caller", text: "My delivery arrived damaged. Could I get a replacement and have the original item collected?" },
    { id: "confirmation", role: "ai-agent", text: "I can walk you through a replacement and collection. Would you like to proceed with that option?" },
    { id: "replacement", role: "narrator", text: "A prepared action illustrates creating a replacement. This simulation does not change any order." },
    { id: "pickup", role: "ai-agent", text: "Next, I'll show the collection step and confirm the pickup details with you." },
    { id: "notification", role: "narrator", text: "The example ends with an illustrative confirmation. No replacement, pickup or notification is actually created or sent." },
  ],
  "video-screen-sharing": [
  { id: "invitation", role: "human-agent", text: "Let's take a look together. I'll send a video invitation here in the chat. You can join when you're ready." },
  { id: "preview", role: "caller", text: "I've opened the invitation. I'll check my camera and microphone in the preview before I join." },
  { id: "connected", role: "narrator", text: "The customer and agent meet in a browser-based video call. The original ticket and customer context stay alongside the conversation." },
  { id: "select-screen", role: "human-agent", text: "Please choose the device setup window to share. Only share what you want me to see, and keep private information out of view." },
  { id: "sharing", role: "narrator", text: "The selected window is shared while participant video remains visible. The agent guides the customer through the device settings." },
  { id: "resolution", role: "caller", text: "That worked. My device is connected now. Thanks for walking through the setup with me." },
  ],
};
export const DEMO_NARRATION_LINES: DemoNarrationLine[] = Object.entries(scripts)
  .flatMap(([nuggetId, lines]) => lines.map(line => ({ ...line, nuggetId: nuggetId as DemoNuggetId })));

export class VoiceUnavailable extends Error {}
const connectors = new ReplitConnectors();
let voiceCache: { voices: DemoVoice[]; until: number } | undefined;
let voicePending: Promise<DemoVoice[]> | undefined;
let failedUntil = 0;
let failureMessage = "";
const clips = new Map<string, { bytes: Buffer; until: number }>();
const MAX_AUDIO_BYTES = 1_000_000;
const MAX_CACHE_BYTES = 24_000_000;

async function providerError(response: Response): Promise<never> {
  let invalidCredential = response.status === 401 || response.status === 403;
  try {
    const detail = ((await response.json()) as { detail?: { status?: string; code?: string } })?.detail;
    invalidCredential ||= ["invalid_api_key", "api_key_id_used_as_api_key"].includes(detail?.status ?? "")
      || detail?.code === "invalid_api_key";
  } catch { /* Do not expose provider payloads or connector details. */ }
  throw new VoiceUnavailable(invalidCredential
    ? "ElevenLabs rejected the saved connection. Ask the portal owner to update its full API key in Integrations; no audio was generated."
    : response.status === 429
      ? "ElevenLabs is rate-limited or out of available credits. Try again later; no replacement voice is used."
      : "ElevenLabs could not provide audio. Check the connection, permissions and available credits, then retry.");
}

export async function listDemoVoices(signal: AbortSignal): Promise<DemoVoice[]> {
  if (voiceCache && voiceCache.until > Date.now()) return voiceCache.voices;
  if (failedUntil > Date.now()) throw new VoiceUnavailable(failureMessage);
  if (voicePending) return voicePending;
  voicePending = (async () => {
    const response = await connectors.proxy("elevenlabs", "/v1/voices", { signal });
    if (!response.ok) await providerError(response);
    const body = await response.json() as { voices?: unknown };
    if (!Array.isArray(body.voices)) throw new VoiceUnavailable("ElevenLabs returned an invalid voice list.");
    const voices: DemoVoice[] = body.voices
      .filter((v: unknown): v is { voice_id: string; name: string } =>
        !!v && typeof v === "object" && "voice_id" in v && "name" in v &&
        typeof v.voice_id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v.voice_id) && typeof v.name === "string")
      .slice(0, 500)
      .map((v: { voice_id: string; name: string }) => ({ id: v.voice_id, name: v.name.slice(0, 120) }));
    if (!voices.length) throw new VoiceUnavailable("No usable voices are available in the connected ElevenLabs account.");
    voiceCache = { voices, until: Date.now() + 60_000 };
    return voices;
  })().catch(error => {
    failureMessage = error instanceof VoiceUnavailable ? error.message : "The ElevenLabs connection is unavailable. Check Integrations and retry.";
    failedUntil = Date.now() + 10_000;
    throw new VoiceUnavailable(failureMessage);
  }).finally(() => { voicePending = undefined; });
  return voicePending;
}

export function cachedVideoClip(nuggetId: DemoNuggetId, lineId: string, voiceId: string): Buffer | undefined {
  const key = `${nuggetId}:${lineId}:${voiceId}`;
  const entry = clips.get(key);
  if (!entry || entry.until < Date.now()) { clips.delete(key); return; }
  return entry.bytes;
}

export async function generateVideoClip(nuggetId: DemoNuggetId, lineId: string, voiceId: string, signal: AbortSignal): Promise<Buffer> {
  const line = DEMO_NARRATION_LINES.find(item => item.nuggetId === nuggetId && item.id === lineId);
  if (!line) throw new Error("Unknown prepared line.");
  const response = await connectors.proxy("elevenlabs", `/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST", signal, headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: line.text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.75 } }),
  });
  if (!response.ok) await providerError(response);
  if (!response.headers.get("content-type")?.startsWith("audio/") || !response.body) {
    throw new VoiceUnavailable("ElevenLabs returned no playable audio. Please retry.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUDIO_BYTES) throw new VoiceUnavailable("The generated audio exceeded the clip size limit.");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (!size) throw new VoiceUnavailable("ElevenLabs returned an empty audio clip.");
  const bytes = Buffer.concat(chunks);
  // Ephemeral bounded cache of fixed, non-customer dialogue; no audio files or DB payloads.
  let used = 0;
  for (const [key, entry] of clips) {
    if (entry.until < Date.now()) clips.delete(key);
    else used += entry.bytes.length;
  }
  for (const [key, entry] of clips) {
    if (used + bytes.length <= MAX_CACHE_BYTES && clips.size < 64) break;
    used -= entry.bytes.length; clips.delete(key);
  }
  clips.set(`${nuggetId}:${lineId}:${voiceId}`, { bytes, until: Date.now() + 60 * 60_000 });
  return bytes;
}
