import type { Request, Response, NextFunction } from "express";

/** All signed-in portal users may present. A UI preference alone grants nothing. */
export function presenterAccess(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie, Authorization, X-Depot-Mode");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to access Presenter content." });
    return;
  }
  if (req.get("X-Depot-Mode") !== "presenter") {
    res.status(403).json({ error: "Switch to Presenter mode to access internal enablement." });
    return;
  }
  // Do not serve restricted bytes to a cross-site browser with ambient cookies.
  if (req.get("Sec-Fetch-Site") === "cross-site") {
    res.status(403).json({ error: "Open Presenter content from the portal." });
    return;
  }
  next();
}
