import { eq } from "drizzle-orm";
import { db, narrationPreferencesTable } from "@workspace/db";
import { GetDemoNarrationPreferencesResponse, type DemoNarrationPreferences } from "@workspace/api-zod";

export const DEFAULT_NARRATION_PREFERENCES: DemoNarrationPreferences = {
  voices: {}, enabled: true, volume: 0.9, captions: true,
};

export const narrationPreferencesStore = {
  async get(userId: string): Promise<DemoNarrationPreferences> {
    const [row] = await db.select().from(narrationPreferencesTable).where(eq(narrationPreferencesTable.userId, userId));
    if (!row) return DEFAULT_NARRATION_PREFERENCES;
    return GetDemoNarrationPreferencesResponse.parse({
      voices: row.voices, enabled: row.enabled, volume: row.volume, captions: row.captions,
    });
  },
  async save(userId: string, preferences: DemoNarrationPreferences): Promise<DemoNarrationPreferences> {
    await db.insert(narrationPreferencesTable).values({ userId, ...preferences })
      .onConflictDoUpdate({ target: narrationPreferencesTable.userId, set: preferences });
    return preferences;
  },
};
