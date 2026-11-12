import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  ResolveResearchCompanyBody, ResolveResearchCompanyResponse,
  GenerateResearchReportBody, GenerateResearchReportResponse,
} from "@workspace/api-zod";
import { getCompanyLogo, resolveCompany } from "../lib/demo-research/company";
import { generateReport } from "../lib/demo-research/report";
import { publicUrl } from "../lib/demo-research/public-web";

type Services = { company: typeof resolveCompany; report: typeof generateReport };
const windows = new Map<string, { count: number; until: number }>();
const running = new Set<string>();
let activeReports = 0;

function consume(key: string, limit: number): boolean {
  const now = Date.now();
  for (const [id, value] of windows) if (value.until <= now) windows.delete(id);
  const window = windows.get(key) ?? { count: 0, until: now + 60 * 60_000 };
  if (window.count >= limit || windows.size > 10_000) return false;
  window.count++;
  windows.set(key, window);
  return true;
}

function privateAccess(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie, Authorization");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!req.isAuthenticated() || !req.user?.id) {
    res.status(401).json({ error: "Sign in to use live company research." }); return;
  }
  // Cookie-authenticated paid requests must originate from the portal, not a foreign site.
  if (req.headers["sec-fetch-site"] === "cross-site") {
    res.status(403).json({ error: "Start research from the portal." }); return;
  }
  next();
}

export function createResearchRouter(services: Services = { company: resolveCompany, report: generateReport }): IRouter {
  const router = Router();
  router.use("/demo-research", privateAccess);

  router.post("/demo-research/company", async (req, res): Promise<void> => {
    const parsed = ResolveResearchCompanyBody.safeParse(req.body);
    if (!parsed.success || parsed.data.companyName.trim().length < 2) {
      res.status(400).json({ error: "Enter a company name using 2–120 characters." }); return;
    }
    if (parsed.data.companyWebsite?.trim()) {
      try { publicUrl(parsed.data.companyWebsite.trim()); }
      catch { res.status(400).json({ error: "Enter a valid public company website." }); return; }
    }
    if (!consume(`lookup:${req.user!.id}`, 40) || !consume("lookup:global", 200)) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "Company lookup limit reached. Try again later; use the company website to prepare context." }); return;
    }
    const controller = new AbortController();
    res.on("close", () => { if (!res.writableEnded) controller.abort(); });
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(65_000)]);
    try {
      const profile = await services.company({
        companyName: parsed.data.companyName.trim(), companyWebsite: parsed.data.companyWebsite?.trim(),
      }, req.user!.id, signal);
      if (!res.destroyed) res.json(ResolveResearchCompanyResponse.parse(profile));
    } catch {
      if (!res.destroyed) res.status(502).json({ error: "Company lookup could not be completed. Enter or check the official website, then retry. A logo is not required to generate research." });
    }
  });

  router.get("/demo-research/logo/:id", (req, res): void => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const bytes = getCompanyLogo(id, req.user!.id);
    if (!bytes) { res.status(404).json({ error: "Logo expired or unavailable. Refresh company lookup." }); return; }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.type("png").send(bytes);
  });

  router.post("/demo-research/report", async (req, res): Promise<void> => {
    const parsed = GenerateResearchReportBody.safeParse(req.body);
    if (!parsed.success || Object.values(parsed.data).some(value => value.trim().length < 2)) {
      res.status(400).json({ error: "Complete company name, official website, region and audience." }); return;
    }
    try { publicUrl(parsed.data.companyWebsite); }
    catch { res.status(400).json({ error: "Enter a valid public company website." }); return; }
    const owner = req.user!.id;
    if (running.has(owner) || activeReports >= 2) {
      res.setHeader("Retry-After", "30");
      res.status(429).json({ error: "Research is already running. Wait for it to finish or try again shortly." }); return;
    }
    if (!consume(`report:${owner}`, 6) || !consume("report:global", 30)) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "The hourly research limit has been reached. Please try again later." }); return;
    }
    const controller = new AbortController();
    res.on("close", () => { if (!res.writableEnded) controller.abort(); });
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(200_000)]);
    const streaming = req.get("Accept")?.includes("text/event-stream") ?? false;
    const send = (event: object) => { if (!res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`); };
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    running.add(owner); activeReports++;
    try {
      if (streaming) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();
        send({ type: "status", message: "Searching current public sources and preparing an evidence-based demo report…" });
        heartbeat = setInterval(() => { if (!res.destroyed) res.write(": keep-alive\n\n"); }, 15_000);
      }
      const input = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value.trim()])) as typeof parsed.data;
      const report = GenerateResearchReportResponse.parse(await services.report(input, signal, text => {
        if (streaming) send({ type: "delta", text });
      }));
      if (!res.destroyed) {
        if (streaming) { send({ type: "complete", report }); res.end(); }
        else res.json(report);
      }
    } catch {
      if (!res.destroyed) {
        const message = signal.aborted ? "Research was canceled or timed out. Any draft is incomplete; please retry." : "Live research could not produce a complete, cited report. Please retry. The displayed draft is not a completed report.";
        if (streaming) { send({ type: "error", message }); res.end(); }
        else res.status(502).json({ error: message });
      }
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      running.delete(owner); activeReports--;
    }
  });
  return router;
}

export default createResearchRouter();
