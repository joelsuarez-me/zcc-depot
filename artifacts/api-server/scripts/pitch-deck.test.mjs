import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { createPitchDeckRouter } from "../src/routes/pitch-deck.ts";

async function runAs(signedIn, run) {
  const calls = [];
  const app = express();
  app.use((req, _res, next) => { req.isAuthenticated = () => signedIn; next(); });
  app.use("/api", createPitchDeckRouter(async path => {
    calls.push(path);
    return Buffer.from(path.includes("9b3a4154") ? "%PDF-1.7" : [255, 216, 255, 217]);
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/pitch-deck`, calls); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test("deck metadata, slide bytes, and PDF all require sign-in", async () => {
  await runAs(false, async (base, calls) => {
    for (const path of ["", "/slides/1", "/pdf"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 401);
      assert.match(response.headers.get("cache-control"), /private, no-store/);
      assert.deepEqual(Object.keys(await response.json()), ["error"]);
    }
    assert.equal(calls.length, 0);
  });
});

test("signed-in metadata preserves the 13 source pages and hides storage paths", async () => {
  await runAs(true, async base => {
    const data = await (await fetch(base)).json();
    assert.equal(data.totalSlides, 13);
    assert.deepEqual(data.slides.map(slide => slide.sourcePage), Array.from({ length: 13 }, (_, i) => i + 35));
    assert.deepEqual(data.slides.map(slide => slide.number), Array.from({ length: 13 }, (_, i) => i + 1));
    assert.equal(data.slides[0].title, "Ticketing");
    assert.equal(data.slides.at(-1).title, "Zendesk MCP client & server");
    assert.doesNotMatch(JSON.stringify(data), /objects\/uploads|storage\.googleapis/);
  });
});

test("signed-in slide and PDF routes serve only exact allowlisted objects", async () => {
  await runAs(true, async (base, calls) => {
    const image = await fetch(base + "/slides/13");
    assert.equal(image.status, 200);
    assert.match(image.headers.get("content-type"), /image\/jpeg/);
    assert.deepEqual([...new Uint8Array(await image.arrayBuffer())], [255, 216, 255, 217]);
    for (const number of ["0", "14", "-1", "1.1", "1abc"]) assert.equal((await fetch(base + "/slides/" + number)).status, 404);
    const pdf = await fetch(base + "/pdf");
    assert.match(pdf.headers.get("content-type"), /application\/pdf/);
    assert.match(pdf.headers.get("content-disposition"), /attachment/);
    assert.match(await pdf.text(), /^%PDF-/);
    assert.equal(calls.length, 2);
  });
});
