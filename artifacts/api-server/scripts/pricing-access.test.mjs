import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import pricingRouter from "../src/routes/pricing.ts";

// A test-only authentication stub; production always uses existing Replit Auth.
async function requestAs(signedIn) {
  const app = express();
  app.use((req, _res, next) => {
    req.isAuthenticated = () => signedIn;
    next();
  });
  app.use("/api", pricingRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/pricing-guide`);
    return {
      status: response.status,
      cache: response.headers.get("cache-control"),
      vary: response.headers.get("vary"),
      robots: response.headers.get("x-robots-tag"),
      body: await response.json(),
    };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("anonymous access reveals no prices, source URLs, or internal content", async () => {
  const result = await requestAs(false);
  assert.equal(result.status, 401);
  assert.match(result.cache, /private, no-store/);
  assert.match(result.vary, /Cookie, Authorization/);
  assert.match(result.robots, /noindex/);
  assert.deepEqual(Object.keys(result.body), ["error"]);
  assert.doesNotMatch(JSON.stringify(result.body), /\$83|\$50|\$33|docs\.google\.com/);
});

test("authenticated guide validates and preserves all supplied pricing details", async () => {
  const result = await requestAs(true);
  assert.equal(result.status, 200);
  assert.match(result.cache, /private, no-store/);
  const { methods, costs, notes, sources } = result.body;
  assert.deepEqual(methods.map((m) => m.id), ["bundle", "byoa", "team"]);
  assert.deepEqual(methods.map((m) => m.price), ["$83", "$50", "Request a quote"]);
  assert.equal(costs.length, 4);
  assert.equal(notes.length, 4);
  assert.equal(sources.length, 3);
  assert.equal(sources.filter((s) => s.internal).length, 1);
  const text = JSON.stringify(result.body);
  for (const detail of ["$50 Contact Center license + $33 Minutes Block", "1,000-minute", "Premier Plus", "Premier Enterprise", "12-month minimum", "multi-year", "GBP, EUR, and BRL", "November 11, 2026"]) {
    assert.ok(text.includes(detail), detail);
  }
});
