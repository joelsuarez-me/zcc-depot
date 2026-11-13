import { Router, type IRouter } from "express";
import { CreateVideoDemoSpeechBody, GetVideoDemoVoicesResponse } from "@workspace/api-zod";
import { VIDEO_DEMO_LINES, VoiceUnavailable, listVideoVoices, cachedVideoClip, generateVideoClip } from "../lib/video-demo-voice";

type Services = {
  voices: typeof listVideoVoices;
  cached: typeof cachedVideoClip;
  speech: typeof generateVideoClip;
};

/** Exported for isolated tests; all paid operations remain authenticated. */
export function createVideoVoiceRouter(services: Services = { voices: listVideoVoices, cached: cachedVideoClip, speech: generateVideoClip }): IRouter {
  const router = Router();
  const windows = new Map<string, { count: number; until: number }>();
  const owners = new Set<string>();
  const consume = (key: string, limit: number) => {
    const now = Date.now();
    for (const [id, item] of windows) if (item.until <= now) windows.delete(id);
    if (windows.size > 5000) return false;
    const item = windows.get(key) ?? { count: 0, until: now + 3_600_000 };
    if (item.count >= limit) return false;
    item.count++; windows.set(key, item); return true;
  };
  router.use("/demo-nuggets/video", (req, res, next): void => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Cookie, Authorization");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!req.isAuthenticated() || !req.user?.id) {
      res.status(401).json({ error: "Sign in to use the ElevenLabs voice overlay. Visual demos remain available." }); return;
    }
    const origin = req.get("Origin");
    let foreignOrigin = false;
    if (origin) {
      try { foreignOrigin = new URL(origin).host !== req.get("Host"); }
      catch { foreignOrigin = true; }
    }
    if (req.headers["sec-fetch-site"] === "cross-site" || foreignOrigin) {
      res.status(403).json({ error: "Start narration from the portal." }); return;
    }
    next();
  });
  router.get("/demo-nuggets/video/voices", async (req, res): Promise<void> => {
    if (!consume(`voices:${req.user!.id}`, 60) || !consume("voices:global", 500)) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "Voice lookup limit reached. Try again later." }); return;
    }
    try {
      const voices = await services.voices(AbortSignal.timeout(20_000));
      res.json(GetVideoDemoVoicesResponse.parse({ voices, lines: VIDEO_DEMO_LINES }));
    } catch (error) {
      req.log?.warn("Video demo voice lookup unavailable");
      res.status(503).json({ error: error instanceof VoiceUnavailable ? error.message : "ElevenLabs is unavailable. Check Integrations and retry." });
    }
  });
  router.post("/demo-nuggets/video/speech", async (req, res): Promise<void> => {
    const parsed = CreateVideoDemoSpeechBody.strict().safeParse(req.body);
    if (!parsed.success || !VIDEO_DEMO_LINES.some(line => line.id === parsed.data.lineId)) {
      res.status(400).json({ error: "Choose a prepared demo line and an available voice. Custom text is not accepted." }); return;
    }
    const owner = req.user!.id;
    if (!consume(`requests:${owner}`, 120) || !consume("requests:global", 1000)) {
      res.setHeader("Retry-After", "3600"); res.status(429).json({ error: "Narration request limit reached." }); return;
    }
    if (owners.has(owner) || owners.size >= 2) {
      res.setHeader("Retry-After", "10"); res.status(429).json({ error: "Narration is already being prepared. Wait and retry." }); return;
    }
    const controller = new AbortController();
    res.on("close", () => { if (!res.writableEnded) controller.abort(); });
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]);
    owners.add(owner);
    try {
      const { lineId, voiceId } = parsed.data;
      const voices = await services.voices(signal);
      if (!voices.some(voice => voice.id === voiceId)) {
        res.status(400).json({ error: "That voice is no longer available. Reload the voice list." }); return;
      }
      let bytes = services.cached(lineId, voiceId);
      if (!bytes) {
        if (!consume(`speech:${owner}`, 36) || !consume("speech:global", 180)) {
          res.setHeader("Retry-After", "3600"); res.status(429).json({ error: "Hourly speech-generation limit reached. Try again later." }); return;
        }
        bytes = await services.speech(lineId, voiceId, signal);
      }
      if (!res.destroyed) res.type("audio/mpeg").send(bytes);
    } catch (error) {
      req.log?.warn("Video demo speech unavailable");
      if (!res.destroyed) res.status(503).json({ error: error instanceof VoiceUnavailable ? error.message : "ElevenLabs could not generate narration. Check the connection and retry." });
    } finally { owners.delete(owner); }
  });
  return router;
}

export default createVideoVoiceRouter();
