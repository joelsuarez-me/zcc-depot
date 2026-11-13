import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { agendasTable } from "./agendas";

export const researchReportsTable = pgTable("demo_research_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  saveKey: uuid("save_key").notNull().unique(),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website").notNull(),
  region: text("region").notNull(),
  audience: text("audience").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  logoPath: text("logo_path"),
  logoNote: text("logo_note").notNull().default(""),
  createdBy: text("created_by").notNull(),
  agendaId: uuid("agenda_id").references(() => agendasTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertResearchReportSchema = createInsertSchema(researchReportsTable).omit({ id: true, createdAt: true });
export type InsertResearchReport = z.infer<typeof insertResearchReportSchema>;
export type SavedResearchRow = typeof researchReportsTable.$inferSelect;
