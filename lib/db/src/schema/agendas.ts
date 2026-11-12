import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const agendasTable = pgTable("customer_agendas", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  description: text("description").notNull().default(""),
  currentState: text("current_state").notNull().default(""),
  problems: text("problems").notNull().default(""),
  outcomes: text("outcomes").notNull().default(""),
  logoPath: text("logo_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAgendaSchema = createInsertSchema(agendasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgenda = z.infer<typeof insertAgendaSchema>;
export type Agenda = typeof agendasTable.$inferSelect;
