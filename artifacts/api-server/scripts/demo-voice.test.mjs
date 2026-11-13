import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { createVideoVoiceRouter } from "../src/routes/video-demo-voice.ts";
import { DEMO_NARRATION_LINES, LOCALIZED_DEMO_LINES, demoClipCacheKey, VoiceUnavailable } from "../src/lib/video-demo-voice.ts";
import { DEMO_SCRIPT_TRANSLATIONS } from "../src/lib/demo-script-translations.ts";
import { DEMO_NUGGETS } from "../../zcc-depot/src/data/demo-nuggets.ts";
import { voiceCatalogMetadata, DEMO_SPEECH_MODEL } from "../src/lib/voice-catalog-metadata.ts";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { cachedVideoClip, generateVideoClip } from "../src/lib/video-demo-voice.ts";

const voices = [{ id: "voiceA", name: "Caller", languageAccents: [{ language: "en", accent: "american" }] }, { id: "voiceB", name: "AI" }, { id: "voiceC", name: "Human" }];
test("catalog metadata preserves pairs, deduplicates and ignores unrelated models and malformed labels", () => {
  assert.deepEqual(voiceCatalogMetadata({
    labels: { language: " en ", accent: "American", gender: "female" },
    verified_languages: [
      { language: "en", accent: "american", model_id: DEMO_SPEECH_MODEL },
      { language: "fr", accent: "standard", model_id: DEMO_SPEECH_MODEL },
      { language: "de", accent: "standard", model_id: "other_model" },
      { language: null, accent: "  ", model_id: DEMO_SPEECH_MODEL },
      null,
    ],
  }), [{ language: "en", accent: "American" }, { language: "fr", accent: "standard" }]);
  for (const input of [null, {}, { labels: [] }, { labels: { language: 4, accent: {} }, verified_languages: "en" }]) {
    assert.deepEqual(voiceCatalogMetadata(input), []);
  }
  assert.deepEqual(voiceCatalogMetadata({ labels: { accent: "british" } }), [{ accent: "british" }]);
  assert.deepEqual(voiceCatalogMetadata({ labels: { language: "x".repeat(200) } }), [{ language: "x".repeat(120) }]);
});
const prepared = { nuggetId: "video-screen-sharing", lineId: "invitation", voiceId: "voiceC" };
const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture(t, overrides = {}) {
  const calls = [];
  const app = express();
  app.use(express.json());
  // Isolated test server only: the production router still requires real authentication.
  app.use((req, _res, next) => {
    req.user = req.get("x-test-user") ? { id: req.get("x-test-user") } : undefined;
    req.isAuthenticated = () => Boolean(req.user);
    next();
  });
  app.use(createVideoVoiceRouter({
    voices: async () => voices,
    cached: () => undefined,
    speech: async (...args) => { calls.push(args); return Buffer.from("prepared-mp3-transport-fixture"); },
    ...overrides,
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body = prepared, extra = {}, user = "tester") => fetch(`${url}/demo-nuggets/speech`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(user ? { "x-test-user": user } : {}), ...extra },
    body: JSON.stringify(body),
  });
  return { url, post, calls };
}
test("every visual stage has exactly one fixed narration line and all roles are represented", () => {
  const expected = DEMO_NUGGETS.flatMap(n => n.stages.map(s => `${n.id}:${s.id}`));
  const actual = DEMO_NARRATION_LINES.map(l => `${l.nuggetId}:${l.id}`);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, expected.length);
  assert.deepEqual(new Set(DEMO_NARRATION_LINES.map(l => l.role)), new Set(["caller", "human-agent", "ai-agent", "narrator"]));
});
test("anonymous lookups and paid speech are blocked without touching the provider", async t => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.url}/demo-nuggets/voices`)).status, 401);
  const response = await f.post(prepared, {}, "");
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(f.calls.length, 0);
});
test("voice catalog returns all fixed scripts only to signed-in users", async t => {
  const f = await fixture(t);
  const r = await fetch(`${f.url}/demo-nuggets/voices`, { headers: { "x-test-user": "tester" } });
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.lines.length, 63);
  assert.deepEqual(data.lines, LOCALIZED_DEMO_LINES);
  assert.deepEqual(data.voices, voices);
});
test("valid fixed speech is returned privately as audio bytes", async t => {
  const f = await fixture(t);
  const r = await f.post();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "audio/mpeg");
  assert.match(r.headers.get("cache-control"), /private, no-store/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.match(await r.text(), /prepared-mp3/);
  assert.deepEqual(f.calls[0].slice(0, 3), ["video-screen-sharing", "invitation", "voiceC"]);
});
test("rejects arbitrary text, unknown nugget/line pairs, missing fields and malformed voice IDs", async t => {
  const f = await fixture(t);
  for (const body of [
    { ...prepared, text: "arbitrary billable customer text" },
    { ...prepared, locale: "de-DE" },
    { ...prepared, locale: "" },
    { ...prepared, locale: null },
    { ...prepared, nuggetId: "voice-copilot" },
    { ...prepared, nuggetId: "unknown" },
    { ...prepared, lineId: "anything" },
    { ...prepared, voiceId: "../bad" },
    { ...prepared, voiceId: "x".repeat(101) },
    { nuggetId: "voice-qa", lineId: "risk" },
  ]) assert.equal((await f.post(body)).status, 400);
  assert.equal(f.calls.length, 0);
});
test("all supported locales have identical stage/role coverage and no English fallback", () => {
  const signature = line => `${line.nuggetId}:${line.id}:${line.role}`;
  for (const locale of ["en-US", "es-ES", "fr-FR"]) {
    const lines = LOCALIZED_DEMO_LINES.filter(line => line.locale === locale);
    assert.deepEqual(lines.map(signature), DEMO_NARRATION_LINES.map(signature));
    assert.equal(new Set(lines.map(signature)).size, 21);
    for (const [i, line] of lines.entries()) {
      assert.ok(line.text.trim());
      if (locale !== "en-US") assert.notEqual(line.text, DEMO_NARRATION_LINES[i].text);
    }
  }
  for (const translations of Object.values(DEMO_SCRIPT_TRANSLATIONS)) {
    for (const [nugget, lines] of Object.entries(translations)) {
      assert.deepEqual(Object.keys(lines).sort(), DEMO_NARRATION_LINES.filter(l => l.nuggetId === nugget).map(l => l.id).sort());
    }
  }
});
test("audio identity separates accounts, locales, lines and voices and follows script revisions", () => {
  const key = (owner = "one", locale = "en-US", id = "connected", voice = "a") => demoClipCacheKey(owner, "voice-copilot", id, voice, locale);
  assert.equal(key(), key());
  assert.equal(new Set([key(), key("two"), key("one", "es-ES"), key("one", "fr-FR"), key("one", "en-US", "intent"), key("one", "en-US", "connected", "b")]).size, 6);
  assert.throws(() => key("one", "de-DE"), /Unknown prepared/);
  const line = LOCALIZED_DEMO_LINES[0];
  const original = line.text, before = key();
  try { line.text += " Revised."; assert.notEqual(key(), before); }
  finally { line.text = original; }
});
test("requested script locale and authenticated owner reach both cache and generation; old clients use English", async t => {
  const lookups = [];
  const f = await fixture(t, { cached: (...args) => { lookups.push(args); } });
  for (const locale of ["en-US", "es-ES", "fr-FR"]) {
    assert.equal((await f.post({ ...prepared, locale }, {}, "presenter")).status, 200);
    assert.deepEqual(lookups.at(-1).slice(3), ["presenter", locale]);
    assert.deepEqual(f.calls.at(-1).slice(4), ["presenter", locale]);
  }
  assert.equal((await f.post()).status, 200);
  assert.deepEqual(f.calls.at(-1).slice(4), ["tester", "en-US"]);
});
test("provider receives the exact localized caption text and caches it only for that presenter and locale", async () => {
  const original = ReplitConnectors.prototype.proxy;
  const requests = [];
  // No network and no paid generation: inspect the real generation function's transport.
  ReplitConnectors.prototype.proxy = async (...args) => {
    requests.push(args);
    return new Response("mock audio", { headers: { "Content-Type": "audio/mpeg" } });
  };
  try {
    for (const locale of ["es-ES", "fr-FR"]) {
      const bytes = await generateVideoClip("voice-copilot", "wrap-up", "testVoice", new AbortController().signal, "cache-owner", locale);
      const payload = JSON.parse(requests.at(-1)[2].body);
      assert.equal(payload.text, LOCALIZED_DEMO_LINES.find(l => l.nuggetId === "voice-copilot" && l.id === "wrap-up" && l.locale === locale).text);
      assert.equal(payload.model_id, DEMO_SPEECH_MODEL);
      assert.deepEqual(cachedVideoClip("voice-copilot", "wrap-up", "testVoice", "cache-owner", locale), bytes);
      assert.equal(cachedVideoClip("voice-copilot", "wrap-up", "testVoice", "another-owner", locale), undefined);
    }
    assert.equal(cachedVideoClip("voice-copilot", "wrap-up", "testVoice", "cache-owner", "en-US"), undefined);
    assert.equal(requests.length, 2);
  } finally { ReplitConnectors.prototype.proxy = original; }
});
test("stale or unavailable voices are rejected before speech generation", async t => {
  const f = await fixture(t);
  assert.equal((await f.post({ ...prepared, voiceId: "deletedVoice" })).status, 400);
  assert.equal(f.calls.length, 0);
});
test("cross-site requests are rejected even with an authenticated session", async t => {
  const f = await fixture(t);
  assert.equal((await f.post(prepared, { Origin: "https://unrelated.example" })).status, 403);
  assert.equal((await f.post(prepared, { "Sec-Fetch-Site": "cross-site" })).status, 403);
  assert.equal((await f.post(prepared, { Origin: f.url })).status, 200);
});
test("credential errors stay actionable and unexpected provider payloads never leak", async t => {
  const f = await fixture(t, { speech: async () => { throw new VoiceUnavailable("ElevenLabs rejected the saved connection. Update it in Integrations."); } });
  const r = await f.post();
  assert.equal(r.status, 503);
  assert.match((await r.json()).error, /Integrations/);
  const other = await fixture(t, { speech: async () => { throw new Error("private-provider-payload"); } });
  assert.doesNotMatch(await (await other.post()).text(), /private-provider-payload/);
});
test("per-user hourly generation is limited and cached clips avoid paid generation", async t => {
  const f = await fixture(t);
  for (let i = 0; i < 36; i++) assert.equal((await f.post()).status, 200);
  const r = await f.post();
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("retry-after"), "3600");
  assert.equal(f.calls.length, 36);
  const cached = await fixture(t, { cached: () => Buffer.from("already generated") });
  assert.equal((await cached.post()).status, 200);
  assert.equal(cached.calls.length, 0);
});
test("one request per user and two global generations prevent overlapping paid work", async t => {
  const held = []; let started;
  const firstStarted = new Promise(resolve => { started = resolve; });
  const f = await fixture(t, { speech: (...args) => new Promise(resolve => {
    held.push({ resolve, args }); started();
  }) });
  const first = f.post(); await firstStarted;
  assert.equal((await f.post()).status, 429);
  const second = f.post(prepared, {}, "another-user");
  while (held.length < 2) await tick();
  assert.equal((await f.post(prepared, {}, "third-user")).status, 429);
  held.forEach(entry => entry.resolve(Buffer.from("audio")));
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
});
test("disconnect cancellation reaches the provider and releases the user's concurrency slot", async t => {
  let started, aborted;
  const isStarted = new Promise(resolve => { started = resolve; });
  const isAborted = new Promise(resolve => { aborted = resolve; });
  let requests = 0;
  const f = await fixture(t, { speech: (_n, _l, _v, signal) => {
    if (requests++ > 0) return Promise.resolve(Buffer.from("retry audio"));
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => { aborted(); reject(signal.reason); }, { once: true });
      started();
    });
  } });
  const controller = new AbortController();
  const pending = fetch(`${f.url}/demo-nuggets/speech`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-test-user": "tester" },
    body: JSON.stringify(prepared), signal: controller.signal,
  }).catch(error => error.name);
  await isStarted; controller.abort(); await isAborted; await tick();
  assert.equal(await pending, "AbortError");
  assert.equal((await f.post()).status, 200);
});
