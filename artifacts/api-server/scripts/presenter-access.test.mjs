import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import presenterRouter from "../src/routes/presenter.ts";
import { presenterAccess } from "../src/middlewares/presenterAccess.ts";

test("Presenter authorization requires identity and explicit presentation intent", async t => {
  const app = express();
  // Identity fixtures exist in this isolated test process only, never in app.ts.
  app.use((req, _res, next) => {
    req.isAuthenticated = () => req.get("x-test-authenticated") === "yes";
    next();
  });
  app.use(presenterRouter);
  for (const path of ["/pricing-guide", "/sell-sheet", "/sell-sheet/pdf", "/pitch-deck", "/pitch-deck/pdf", "/pitch-deck/slides/1"]) {
    app.get(path, presenterAccess, (_req, res) => res.json({ protected: true }));
  }
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (path, headers = {}) => fetch(base + path, { headers });
  const paths = ["/presenter/content", "/pricing-guide", "/sell-sheet", "/sell-sheet/pdf", "/pitch-deck", "/pitch-deck/pdf", "/pitch-deck/slides/1"];

  await t.test("anonymous mode spoofing never returns restricted bytes", async () => {
    for (const path of paths) {
      const res = await call(path, { "X-Depot-Mode": "presenter" });
      assert.equal(res.status, 401, path);
      assert.match(res.headers.get("cache-control"), /no-store/);
      assert.doesNotMatch(await res.text(), /FY2027|Native Contact Center parity/);
    }
  });
  await t.test("a signed-in Customer session cannot fetch Presenter content", async () => {
    for (const path of paths) {
      assert.equal((await call(path, { "x-test-authenticated": "yes" })).status, 403, path);
      assert.equal((await call(path, { "x-test-authenticated": "yes", "X-Depot-Mode": "customer" })).status, 403, path);
    }
  });
  await t.test("authenticated Presenters receive the six-room guidance and preserved materials", async () => {
    const res = await call("/presenter/content", { "x-test-authenticated": "yes", "X-Depot-Mode": "presenter" });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("vary"), /Cookie.*Authorization.*X-Depot-Mode/);
    assert.match(res.headers.get("x-robots-tag"), /noindex/);
    const body = await res.json();
    assert.equal(body.rooms.length, 6);
    assert.equal(new Set(body.rooms.map(r => r.id)).size, 6);
    assert.ok(body.legacy.roadmap.internal.length);
    assert.ok(body.legacy.gtm.length);
    assert.ok(body.legacy.briefing.length);
    assert.ok(body.legacy.resources.some(r => r.kind === "Internal"));
    for (const room of body.rooms) {
      for (const field of ["speakerNotes", "technicalPoints", "discoveryQuestions", "objections", "progression"]) {
        assert.ok(room[field].length, `${room.id}:${field}`);
      }
    }
  });
  await t.test("cross-site requests are denied even when authenticated and labelled Presenter", async () => {
    assert.equal((await call("/presenter/content", {
      "x-test-authenticated": "yes", "X-Depot-Mode": "presenter", "Sec-Fetch-Site": "cross-site",
    })).status, 403);
  });
});
