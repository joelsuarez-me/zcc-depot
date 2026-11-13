import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import express from "express";
import { inArray } from "drizzle-orm";
import { db, pool, usersTable, narrationPreferencesTable } from "@workspace/db";
import { createVideoVoiceRouter } from "../src/routes/video-demo-voice.ts";
import { DEFAULT_NARRATION_PREFERENCES } from "../src/lib/narration-preferences.ts";

test("narration preferences are private, durable and contain settings only", async t => {
  const users = [randomUUID(), randomUUID()];
  await db.insert(usersTable).values(users.map(id => ({ id })));
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = req.get("x-test-user") ? { id: req.get("x-test-user") } : undefined;
    req.isAuthenticated = () => Boolean(req.user);
    next();
  });
  let voiceCalls = 0;
  app.use(createVideoVoiceRouter({
    voices: async () => { voiceCalls++; throw new Error("Preferences must not call ElevenLabs"); },
    cached: () => undefined,
    speech: async () => { throw new Error("Preferences must not generate speech"); },
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/demo-nuggets/preferences`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.delete(usersTable).where(inArray(usersTable.id, users));
    await pool.end();
  });
  const call = (user = users[0], body, extra = {}) => fetch(url, {
    method: body === undefined ? "GET" : "PUT",
    headers: { "Content-Type": "application/json", ...(user ? { "x-test-user": user } : {}), ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const saved = {
    voices: { caller: "oldVoice", "ai-agent": "aiVoice", "human-agent": "humanVoice", narrator: "narratorVoice" },
    enabled: false, volume: 0, captions: false,
  };
  await t.test("anonymous and cross-site access is rejected", async () => {
    for (const body of [undefined, saved]) assert.equal((await call("", body)).status, 401);
    assert.equal((await call(users[0], saved, { Origin: "https://foreign.example" })).status, 403);
    assert.equal((await call(users[0], saved, { "Sec-Fetch-Site": "cross-site" })).status, 403);
  });
  await t.test("new presenters receive defaults without creating rows", async () => {
    const response = await call();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.match(response.headers.get("vary"), /Cookie/);
    assert.deepEqual(await response.json(), DEFAULT_NARRATION_PREFERENCES);
    assert.equal((await db.select().from(narrationPreferencesTable).where(inArray(narrationPreferencesTable.userId, users))).length, 0);
  });
  await t.test("roundtrips all settings and unavailable IDs without consulting the speech provider", async () => {
    assert.deepEqual(await (await call(users[0], saved)).json(), saved);
    assert.deepEqual(await (await call()).json(), saved);
    assert.deepEqual(await (await call(users[1])).json(), DEFAULT_NARRATION_PREFERENCES);
    const second = { ...saved, voices: { caller: "differentVoice" }, volume: 1, captions: true };
    assert.deepEqual(await (await call(users[1], second)).json(), second);
    assert.deepEqual(await (await call()).json(), saved);
    assert.equal(voiceCalls, 0);
  });
  await t.test("rejects secrets, audio, ownership fields, unknown roles and invalid preferences", async () => {
    for (const body of [
      { ...saved, apiKey: "forbidden" }, { ...saved, speech: "base64bytes" },
      { ...saved, userId: users[1] }, { ...saved, voices: { administrator: "voice" } },
      { ...saved, voices: { caller: "../voice" } }, { ...saved, voices: { caller: "x".repeat(101) } },
      { ...saved, volume: -1 }, { ...saved, volume: 1.1 }, { ...saved, volume: "0.5" },
      { ...saved, enabled: "true" }, { ...saved, captions: null }, { voices: {} },
    ]) assert.equal((await call(users[0], body)).status, 400, JSON.stringify(body));
    assert.deepEqual(await (await call()).json(), saved);
    const [row] = await db.select().from(narrationPreferencesTable).where(inArray(narrationPreferencesTable.userId, [users[0]]));
    assert.deepEqual(Object.keys(row).sort(), ["userId", "voices", "enabled", "volume", "captions"].sort());
  });
  await t.test("reset replaces preferences for only the current user", async () => {
    assert.equal((await call(users[0], DEFAULT_NARRATION_PREFERENCES)).status, 200);
    assert.deepEqual(await (await call()).json(), DEFAULT_NARRATION_PREFERENCES);
    assert.equal((await (await call(users[1])).json()).voices.caller, "differentVoice");
  });
});
