import { Router, type IRouter } from "express";
import { GetPitchDeckResponse } from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { PITCH_DECK_PDF, PITCH_SLIDES, pitchDeck } from "../lib/pitch-deck";

type Download = (path: string) => Promise<Buffer>;
const storage = new ObjectStorageService();
async function download(path: string): Promise<Buffer> {
  const file = await storage.getObjectEntityFile(path);
  const [bytes] = await file.download();
  return bytes;
}

export function createPitchDeckRouter(load: Download = download): IRouter {
  const router = Router();
  router.use("/pitch-deck", (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.vary("Cookie, Authorization, X-Depot-Mode");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Sign in to view and download the uploaded pitch deck." }); return;
    }
    next();
  });
  router.get("/pitch-deck", (_req, res): void => {
    res.json(GetPitchDeckResponse.parse(pitchDeck));
  });
  router.get("/pitch-deck/pdf", async (req, res): Promise<void> => {
    try {
      const bytes = await load(PITCH_DECK_PDF);
      res.type("pdf").setHeader("Content-Disposition", 'attachment; filename="Zendesk-Product-Deep-Dive.pdf"');
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(bytes);
    } catch {
      req.log?.warn("Pitch deck PDF unavailable");
      res.status(503).json({ error: "The pitch deck PDF is temporarily unavailable. Please retry." });
    }
  });
  router.get("/pitch-deck/slides/:number", async (req, res): Promise<void> => {
    const raw = typeof req.params.number === "string" ? req.params.number : "";
    const number = /^[1-9]\d*$/.test(raw) ? Number(raw) : 0;
    const slide = PITCH_SLIDES[number - 1];
    if (!slide) { res.status(404).json({ error: "Slide not found." }); return; }
    try {
      const bytes = await load(slide.objectPath);
      res.type("jpeg").setHeader("X-Content-Type-Options", "nosniff");
      res.send(bytes);
    } catch {
      req.log?.warn("Pitch deck slide unavailable");
      res.status(404).json({ error: "This slide is temporarily unavailable. Please retry." });
    }
  });
  return router;
}
export default createPitchDeckRouter();
