import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import sharp from "sharp";
import { createResearchRouter } from "../src/routes/demo-research.ts";
import { publicUrl, isPublicAddress } from "../src/lib/demo-research/public-web.ts";
import { normalizeLogo, logoCandidates } from "../src/lib/demo-research/company.ts";
import { groundReport } from "../src/lib/demo-research/report.ts";
import { REPORT_HEADINGS } from "../src/lib/demo-research/report-format.ts";

const input = { companyName: "Acme", companyWebsite: "https://example.com/", region: "North America", audience: "Platform architects" };
const report = { ...input, researchedAt: "2026-11-12T12:00:00.000Z", markdown: REPORT_HEADINGS.map(heading => `## ${heading}\nVerified public evidence. [1](https://example.com/)`).join("\n\n") + "\n\n## Sources\n1. Official source", sources: [{ id: 1, title: "Official company", publisher: "example.com", url: "https://example.com/", accessedAt: "2026-11-12" }] };

async function withRouter(signedIn, services, run) {
  const app = express();
  app.use(express.json());
  const owner = randomUUID();
  app.use((req, _res, next) => {
    req.isAuthenticated = () => signedIn;
    if (signedIn) req.user = { id: owner };
    next();
  });
  app.use("/api", createResearchRouter(services));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

const post = data => ({ method: "POST", headers: { "Content-Type": "application/json", Accept: "text/event-stream" }, body: JSON.stringify(data) });
const services = {
  company: async data => ({ ...data, logoUrl: null, logoSourceUrl: null, note: "No verified logo found." }),
  report: async (_data, _signal, delta) => { delta("Draft"); return report; },
};

test("anonymous paid endpoints and logo bytes require sign-in", async () => {
  await withRouter(false, {
    company: async () => { throw new Error("Must never execute"); },
    report: async () => { throw new Error("Must never execute"); },
  }, async base => {
    for (const [path, options] of [["/demo-research/company", post({ companyName: "Acme" })], ["/demo-research/report", post(input)], ["/demo-research/logo/unknown", {}]]) {
      const response = await fetch(base + path, options);
      assert.equal(response.status, 401);
      assert.match(response.headers.get("cache-control"), /private, no-store/);
      assert.deepEqual(Object.keys(await response.json()), ["error"]);
    }
  });
});

test("invalid contexts, private URLs and cross-site requests cannot start research", async () => {
  let calls = 0;
  await withRouter(true, { ...services, report: async () => { calls++; return report; } }, async base => {
    for (const data of [{ ...input, companyName: "  " }, { ...input, companyWebsite: "http://127.0.0.1" }, { ...input, audience: "" }]) {
      assert.equal((await fetch(base + "/demo-research/report", post(data))).status, 400);
    }
    const options = post(input);
    options.headers["Sec-Fetch-Site"] = "cross-site";
    assert.equal((await fetch(base + "/demo-research/report", options)).status, 403);
    assert.equal(calls, 0);
  });
});

test("stream sends status, draft, and a schema-validated complete report", async () => {
  await withRouter(true, services, async base => {
    const response = await fetch(base + "/demo-research/report", post(input));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/event-stream/);
    const events = (await response.text()).trim().split("\n\n").filter(line => line.startsWith("data:")).map(line => JSON.parse(line.slice(6)));
    assert.deepEqual(events.map(event => event.type), ["status", "delta", "complete"]);
    assert.equal(events.at(-1).report.companyName, input.companyName);
    assert.equal(events.at(-1).report.sources[0].url, "https://example.com/");
  });
});

test("a failed stream never emits a completed or exportable report", async () => {
  await withRouter(true, { ...services, report: async (_data, _signal, delta) => { delta("Unverified partial"); throw new Error("Provider failed"); } }, async base => {
    const response = await fetch(base + "/demo-research/report", post(input));
    const body = await response.text();
    assert.match(body, /"type":"delta"/);
    assert.match(body, /"type":"error"/);
    assert.doesNotMatch(body, /"type":"complete"/);
  });
});

test("grounding attaches only attributable source links and requires live evidence", () => {
  const metadata = [{ webSearchQueries: ["company source"], groundingChunks: [{ web: { uri: "https://example.com/", title: "Official company" } }], groundingSupports: [{ segment: { startIndex: 0, endIndex: 15, text: "A verified fact" }, groundingChunkIndices: [0] }] }];
  const grounded = groundReport("A verified fact", metadata, "2026-11-12");
  assert.match(grounded.markdown, /\[1\]\(https:\/\/example\.com\/\)/);
  assert.match(grounded.markdown, /## Sources/);
  assert.equal(grounded.sources.length, 1);
  assert.throws(() => groundReport("Fact", [], "2026-11-12"), /no attributable sources/);
  assert.throws(() => groundReport("Other text", metadata, "2026-11-12"), /no attributable statements/);
});

test("public web boundary rejects private/reserved IPv4, IPv6 and unsafe schemes", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "2001:db8::1"]) assert.equal(isPublicAddress(address), false, address);
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(address), true, address);
  for (const url of ["file:///etc/passwd", "http://127.0.0.1", "https://user:pass@example.com", "http://example.com:8080", "https://example.internal"]) assert.throws(() => publicUrl(url));
  assert.equal(publicUrl("www.example.com").href, "https://www.example.com/");
});

test("logo discovery prefers official markup and rasterization keeps aspect ratio", async () => {
  const candidates = logoCandidates('<script type="application/ld+json">{"@type":"Organization","logo":"/official.svg"}</script><img src="/photo.jpg"><link rel="icon" href="/icon.png">', "https://example.com/");
  assert.deepEqual(candidates.slice(0, 2), ["https://example.com/official.svg", "https://example.com/icon.png"]);
  assert.ok(!candidates.some(url => url.includes("photo.jpg")));
  const bytes = await normalizeLogo(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="100"><rect width="1000" height="100" fill="red"/></svg>'));
  const image = await sharp(bytes).metadata();
  assert.equal(image.format, "png");
  assert.equal(image.width / image.height, 10);
  await assert.rejects(normalizeLogo(Buffer.from('<svg><script>alert(1)</script></svg>')), /Unsafe image/);
});
