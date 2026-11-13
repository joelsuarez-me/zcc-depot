import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, agendasTable, researchReportsTable, type SavedResearchRow } from "@workspace/db";
import {
  CreateAgendaBody, GetAgendaResponse, GetSavedResearchReportResponse,
  GetResearchAgendaDraftParams, GetResearchAgendaDraftResponse,
  SaveResearchReportBody, type SavedResearchReport,
} from "@workspace/api-zod";
import { getCompanyLogo } from "../lib/demo-research/company";
import { researchToAgenda } from "../lib/research-to-agenda";
import { ObjectStorageService, objectStorageClient } from "../lib/objectStorage";
import { ObjectAccessGroupType, ObjectPermission } from "../lib/objectAcl";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const validId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);

router.use("/demo-research/saved", (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Sign in to access the shared research library." }); return;
  }
  next();
});

function snapshot(row: SavedResearchRow): SavedResearchReport {
  return GetSavedResearchReportResponse.parse({
    id: row.id,
    fields: row.snapshot.fields,
    report: row.snapshot.report,
    company: {
      companyName: row.companyName, companyWebsite: row.companyWebsite,
      logoUrl: row.logoPath ? `/api/demo-research/saved/${row.id}/logo` : null,
      logoSourceUrl: null, note: row.logoNote || "Opened from the shared research library.",
    },
    savedAt: row.createdAt.toISOString(), agendaId: row.agendaId, logoNote: row.logoNote,
  });
}

router.get("/demo-research/saved", async (req, res) => {
  try {
    const rows = await db.select({
      id: researchReportsTable.id, companyName: researchReportsTable.companyName,
      companyWebsite: researchReportsTable.companyWebsite, region: researchReportsTable.region,
      audience: researchReportsTable.audience, savedAt: researchReportsTable.createdAt,
      researchedAt: sql<string>`${researchReportsTable.snapshot} #>> '{report,researchedAt}'`,
      agendaId: researchReportsTable.agendaId,
    }).from(researchReportsTable).orderBy(desc(researchReportsTable.createdAt));
    res.json(rows.map(row => ({ ...row, savedAt: row.savedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Could not list saved research");
    res.status(500).json({ error: "The research library could not be loaded. Please retry." });
  }
});

router.post("/demo-research/saved", async (req, res) => {
  const parsed = SaveResearchReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "A complete report and its original company context are required." }); return; }
  const { saveKey, fields, report, logoUrl } = parsed.data;
  try {
    if (report.markdown.length > 100_000 || !report.sources.length || report.sources.length > 100 ||
        Number.isNaN(Date.parse(report.researchedAt)) ||
        ["companyName", "companyWebsite", "region", "audience"].some(key =>
          fields[key as keyof typeof fields].trim() !== report[key as keyof typeof fields].trim())) throw new Error("Invalid report");
    researchToAgenda(report); // Reject partial, canceled or incorrectly structured drafts.
  } catch {
    res.status(400).json({ error: "Only a completed five-section research report with sources can be saved. Its context must match." }); return;
  }
  try {
    const [existing] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.saveKey, saveKey));
    if (existing) { res.status(201).json(snapshot(existing)); return; }
    let logoPath: string | null = null;
    let logoNote = "";
    if (logoUrl) {
      const cached = /^\/api\/demo-research\/logo\/([0-9a-f-]+)$/i.exec(logoUrl);
      const saved = /^\/api\/demo-research\/saved\/([0-9a-f-]+)\/logo$/i.exec(logoUrl);
      if (!cached && !saved) { res.status(400).json({ error: "Refresh company lookup before saving this logo." }); return; }
      if (saved && validId(saved[1])) {
        const [source] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.id, saved[1]));
        logoPath = source?.logoPath ?? null;
      } else if (cached) {
        const bytes = getCompanyLogo(cached[1], req.user!.id);
        if (bytes) {
          try {
            const privateDir = storage.getPrivateObjectDir().replace(/^\/+/, "");
            const slash = privateDir.indexOf("/");
            if (slash < 1) throw new Error("Invalid storage configuration");
            const relativePath = `uploads/research-${saveKey}.png`;
            await objectStorageClient.bucket(privateDir.slice(0, slash))
              .file(`${privateDir.slice(slash + 1)}/${relativePath}`)
              .save(bytes, { resumable: false, metadata: { contentType: "image/png", cacheControl: "private, no-store" } });
            logoPath = `/objects/${relativePath}`;
            await storage.trySetObjectEntityAclPolicy(logoPath, {
              owner: req.user!.id, visibility: "private",
              aclRules: [{ group: { type: ObjectAccessGroupType.AUTHENTICATED, id: "signed-in-portal-users" }, permission: ObjectPermission.READ }],
            });
          } catch (err) { logoPath = null; req.log.warn({ err }, "Could not preserve research logo"); }
        }
      }
      if (!logoPath) logoNote = "Report saved without a logo: the cached image expired or could not be preserved. The research and sources are intact.";
    }
    await db.insert(researchReportsTable).values({
      saveKey, ...fields, snapshot: { fields, report }, logoPath, logoNote, createdBy: req.user!.id,
    }).onConflictDoNothing({ target: researchReportsTable.saveKey });
    const [row] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.saveKey, saveKey));
    res.status(201).json(snapshot(row));
  } catch (err) {
    req.log.error({ err }, "Could not save research");
    res.status(500).json({ error: "The report could not be saved. Your on-screen report is unchanged; please retry." });
  }
});

router.get("/demo-research/saved/:id", async (req, res) => {
  if (!validId(req.params.id)) { res.status(404).json({ error: "Report not found." }); return; }
  try {
    const [row] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.id, req.params.id));
    if (!row) { res.status(404).json({ error: "Report not found." }); return; }
    res.json(snapshot(row));
  } catch (err) {
    req.log.error({ err }, "Could not open saved research");
    res.status(500).json({ error: "The saved report could not be opened. Please retry." });
  }
});

router.get("/demo-research/saved/:id/logo", async (req, res) => {
  if (!validId(req.params.id)) { res.sendStatus(404); return; }
  try {
    const [row] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.id, req.params.id));
    if (!row?.logoPath) { res.sendStatus(404); return; }
    const file = await storage.getObjectEntityFile(row.logoPath);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.type("png");
    file.createReadStream().on("error", err => {
      req.log.warn({ err }, "Could not stream saved research logo");
      if (!res.headersSent) res.sendStatus(404); else res.destroy();
    }).pipe(res);
  } catch { res.sendStatus(404); }
});

router.get("/demo-research/saved/:id/agenda-draft", async (req, res): Promise<void> => {
  const params = GetResearchAgendaDraftParams.safeParse(req.params);
  if (!params.success) { res.status(404).json({ error: "Report not found." }); return; }
  try {
    const [row] = await db.select().from(researchReportsTable).where(eq(researchReportsTable.id, params.data.id));
    if (!row) { res.status(404).json({ error: "Report not found." }); return; }
    const mapped = CreateAgendaBody.safeParse({ ...researchToAgenda(snapshot(row).report), logoPath: row.logoPath });
    if (!mapped.success) {
      res.status(422).json({ error: "This report exceeds an agenda's field limits. Your complete research is unchanged; open it in Demo Researcher to review it." });
      return;
    }
    // Read-only: editing and cancellation must never create a saved agenda.
    res.json(GetResearchAgendaDraftResponse.parse(mapped.data));
  } catch (err) {
    req.log.error({ err }, "Could not prepare research agenda draft");
    res.status(500).json({ error: "The agenda draft could not be prepared. Your saved research is unchanged; please retry." });
  }
});

router.post("/demo-research/saved/:id/agenda", async (req, res) => {
  if (!validId(req.params.id)) { res.status(404).json({ error: "Report not found." }); return; }
  const id = req.params.id;
  try {
    const result = await db.transaction(async tx => {
      // A row lock makes repeated clicks/retries return the same agenda, never duplicates.
      const [row] = await tx.select().from(researchReportsTable).where(eq(researchReportsTable.id, id)).for("update");
      if (!row) return null;
      if (row.agendaId) {
        const [existing] = await tx.select().from(agendasTable).where(eq(agendasTable.id, row.agendaId));
        if (existing) return existing;
      }
      const mapped = CreateAgendaBody.safeParse({ ...researchToAgenda(snapshot(row).report), logoPath: row.logoPath });
      if (!mapped.success) throw new RangeError("This report exceeds an agenda's field limits. The complete research remains saved and can still be exported.");
      const [agenda] = await tx.insert(agendasTable).values(mapped.data).returning();
      await tx.update(researchReportsTable).set({ agendaId: agenda.id }).where(eq(researchReportsTable.id, row.id));
      return agenda;
    });
    if (!result) { res.status(404).json({ error: "Report not found." }); return; }
    res.json(GetAgendaResponse.parse(result));
  } catch (err) {
    req.log.error({ err }, "Could not convert research to agenda");
    res.status(err instanceof RangeError ? 422 : 500).json({
      error: err instanceof RangeError ? err.message : "The agenda could not be created. Your saved report is unchanged; please retry.",
    });
  }
});
export default router;
