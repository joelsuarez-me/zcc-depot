import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, useCaseShortlistsTable as table } from "@workspace/db";
import {
  CreateUseCaseShortlistBody, CreateUseCaseShortlistResponse,
  GetUseCaseShortlistParams, GetUseCaseShortlistResponse,
  ListUseCaseShortlistsResponse, UpdateUseCaseShortlistBody, UpdateUseCaseShortlistResponse,
  DeleteUseCaseShortlistBody,
} from "@workspace/api-zod";
import { presenterAccess } from "../middlewares/presenterAccess";

const router: IRouter = Router();
router.use("/use-case-shortlists", presenterAccess);

function validFields(input: { name: string; customer: string; scenarioIds: string[] }) {
  return input.name.trim().length > 0 && input.customer.trim().length > 0 &&
    new Set(input.scenarioIds).size === input.scenarioIds.length;
}

router.get("/use-case-shortlists", async (_req, res): Promise<void> => {
  const rows = await db.select().from(table).orderBy(desc(table.updatedAt));
  res.json(ListUseCaseShortlistsResponse.parse(rows));
});

router.post("/use-case-shortlists", async (req, res): Promise<void> => {
  const parsed = CreateUseCaseShortlistBody.safeParse(req.body);
  if (!parsed.success || !validFields(parsed.data)) {
    res.status(400).json({ error: "Provide a name, customer and one or more unique public scenario IDs." }); return;
  }
  const [row] = await db.insert(table).values({
    ...parsed.data, name: parsed.data.name.trim(), customer: parsed.data.customer.trim(),
  }).returning();
  res.status(201).json(CreateUseCaseShortlistResponse.parse(row));
});

router.get("/use-case-shortlists/:id", async (req, res): Promise<void> => {
  const params = GetUseCaseShortlistParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid shortlist ID." }); return; }
  const [row] = await db.select().from(table).where(eq(table.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Shortlist not found." }); return; }
  res.json(GetUseCaseShortlistResponse.parse(row));
});

router.patch("/use-case-shortlists/:id", async (req, res): Promise<void> => {
  const params = GetUseCaseShortlistParams.safeParse(req.params);
  const parsed = UpdateUseCaseShortlistBody.safeParse(req.body);
  if (!params.success || !parsed.success || !validFields(parsed.data)) {
    res.status(400).json({ error: "Provide valid fields, unique public scenario IDs and the opened revision." }); return;
  }
  const { revision, ...input } = parsed.data;
  const [row] = await db.update(table).set({
    ...input, name: input.name.trim(), customer: input.customer.trim(),
    revision: sql`${table.revision} + 1`, updatedAt: new Date(),
  }).where(and(eq(table.id, params.data.id), eq(table.revision, revision))).returning();
  if (!row) {
    const [exists] = await db.select({ id: table.id }).from(table).where(eq(table.id, params.data.id));
    res.status(exists ? 409 : 404).json({ error: exists
      ? "Another presenter updated this shortlist. Your edits are unchanged. Reopen it to load the latest version."
      : "This shortlist was removed. Your edits are unchanged; save as a new shortlist to keep them." });
    return;
  }
  res.json(UpdateUseCaseShortlistResponse.parse(row));
});

router.delete("/use-case-shortlists/:id", async (req, res): Promise<void> => {
  const params = GetUseCaseShortlistParams.safeParse(req.params);
  const parsed = DeleteUseCaseShortlistBody.safeParse(req.body);
  if (!params.success || !parsed.success) { res.status(400).json({ error: "Provide a valid ID and revision." }); return; }
  const [row] = await db.delete(table).where(and(
    eq(table.id, params.data.id), eq(table.revision, parsed.data.revision),
  )).returning({ id: table.id });
  if (!row) {
    const [exists] = await db.select({ id: table.id }).from(table).where(eq(table.id, params.data.id));
    res.status(exists ? 409 : 404).json({ error: exists
      ? "Another presenter updated this shortlist. Reopen it before deleting."
      : "This shortlist has already been removed." }); return;
  }
  res.sendStatus(204);
});

export default router;
