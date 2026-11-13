import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const useCaseShortlistsTable = pgTable("use_case_shortlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  customer: text("customer").notNull(),
  notes: text("notes").notNull().default(""),
  scenarioIds: text("scenario_ids").array().notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUseCaseShortlistSchema = createInsertSchema(useCaseShortlistsTable).omit({
  id: true, revision: true, createdAt: true, updatedAt: true,
});
export type InsertUseCaseShortlist = z.infer<typeof insertUseCaseShortlistSchema>;
export type UseCaseShortlist = typeof useCaseShortlistsTable.$inferSelect;
