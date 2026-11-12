import {
  CreateAgendaBody,
  CreateAgendaResponse,
  DeleteAgendaParams,
  GetAgendaParams,
  GetAgendaResponse,
  ListAgendasResponse,
  UpdateAgendaBody,
  UpdateAgendaParams,
  UpdateAgendaResponse,
} from "@workspace/api-zod";
import { agendasTable, db } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { ObjectPermission } from "../lib/objectAcl";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

async function canUseLogo(req: Request, objectPath: string): Promise<boolean> {
  if (!objectPath.startsWith("/objects/uploads/")) return false;
  try {
    const file = await objectStorage.getObjectEntityFile(objectPath);
    return objectStorage.canAccessObjectEntity({
      userId: req.user?.id,
      objectFile: file,
      requestedPermission: ObjectPermission.READ,
    });
  } catch {
    return false;
  }
}

router.get("/agendas", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to view shared agendas." });
    return;
  }

  const agendas = await db
    .select({
      id: agendasTable.id,
      company: agendasTable.company,
      description: agendasTable.description,
      logoPath: agendasTable.logoPath,
      updatedAt: agendasTable.updatedAt,
    })
    .from(agendasTable)
    .orderBy(desc(agendasTable.updatedAt));

  res.json(ListAgendasResponse.parse(agendas));
});

router.post("/agendas", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to create shared agendas." });
    return;
  }

  const parsed = CreateAgendaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  if (input.logoPath && !(await canUseLogo(req, input.logoPath))) {
    res.status(400).json({ error: "The selected logo is not available to this account." });
    return;
  }

  const [agenda] = await db
    .insert(agendasTable)
    .values({
      company: input.company,
      description: input.description ?? "",
      currentState: input.currentState ?? "",
      conversation: input.conversation ?? "",
      problems: input.problems ?? "",
      outcomes: input.outcomes ?? "",
      logoPath: input.logoPath ?? null,
    })
    .returning();

  res.status(201).json(CreateAgendaResponse.parse(agenda));
});

router.get("/agendas/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to view shared agendas." });
    return;
  }

  const params = GetAgendaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agenda] = await db
    .select()
    .from(agendasTable)
    .where(eq(agendasTable.id, params.data.id));

  if (!agenda) {
    res.status(404).json({ error: "Agenda not found." });
    return;
  }

  res.json(GetAgendaResponse.parse(agenda));
});

router.patch("/agendas/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to update shared agendas." });
    return;
  }

  const params = UpdateAgendaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAgendaBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: parsed.success ? "At least one field is required." : parsed.error.message });
    return;
  }

  if (parsed.data.logoPath && !(await canUseLogo(req, parsed.data.logoPath))) {
    res.status(400).json({ error: "The selected logo is not available to this account." });
    return;
  }

  const [agenda] = await db
    .update(agendasTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(agendasTable.id, params.data.id))
    .returning();

  if (!agenda) {
    res.status(404).json({ error: "Agenda not found." });
    return;
  }

  res.json(UpdateAgendaResponse.parse(agenda));
});

router.delete("/agendas/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign-in is required to delete shared agendas." });
    return;
  }

  const params = DeleteAgendaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(agendasTable)
    .where(eq(agendasTable.id, params.data.id))
    .returning({ id: agendasTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Agenda not found." });
    return;
  }

  res.sendStatus(204);
});

export default router;
