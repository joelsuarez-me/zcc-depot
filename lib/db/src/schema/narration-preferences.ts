import { boolean, doublePrecision, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const narrationPreferencesTable = pgTable("narration_preferences", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  voices: jsonb("voices").$type<Partial<Record<"caller" | "ai-agent" | "human-agent" | "narrator", string>>>().notNull(),
  enabled: boolean("enabled").notNull(),
  volume: doublePrecision("volume").notNull(),
  captions: boolean("captions").notNull(),
});

export const insertNarrationPreferencesSchema = createInsertSchema(narrationPreferencesTable);
export type InsertNarrationPreferences = z.infer<typeof insertNarrationPreferencesSchema>;
export type NarrationPreferences = typeof narrationPreferencesTable.$inferSelect;
