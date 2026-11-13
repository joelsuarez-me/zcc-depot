import { Router, type IRouter } from "express";
import { GetPricingGuideResponse } from "@workspace/api-zod";
import { pricingGuide } from "../lib/pricingGuide";

const router: IRouter = Router();

router.get("/pricing-guide", (req, res): void => {
  res.setHeader("Cache-Control", "private, no-store");
  res.vary("Cookie, Authorization, X-Depot-Mode");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to access pricing and internal packaging guidance." });
    return;
  }
  res.json(GetPricingGuideResponse.parse(pricingGuide));
});

export default router;
