import { Router, type IRouter } from "express";
import { GetSellSheetResponse } from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { SELL_SHEET_PDF_PATH, sellSheet } from "../lib/sellSheet";

const router: IRouter = Router();
const storage = new ObjectStorageService();

// Protect both the readable guide and the raw PDF on the server, not only in UI.
router.use("/sell-sheet", (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie, Authorization");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to access this internal sales guide." });
    return;
  }
  next();
});

router.get("/sell-sheet", (_req, res): void => {
  res.json(GetSellSheetResponse.parse(sellSheet));
});

router.get("/sell-sheet/pdf", async (req, res): Promise<void> => {
  try {
    const file = await storage.getObjectEntityFile(SELL_SHEET_PDF_PATH);
    const [bytes] = await file.download();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="Zendesk-Contact-Center-Sales-Cheat-Sheet.pdf"');
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(bytes);
  } catch (error) {
    req.log.error({ err: error }, "Internal sales PDF unavailable");
    res.status(503).json({ error: "The source PDF is temporarily unavailable. Please try again." });
  }
});

export default router;
