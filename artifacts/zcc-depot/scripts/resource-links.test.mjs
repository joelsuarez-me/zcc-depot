import test from "node:test";
import assert from "node:assert/strict";
import { publicDocumentationUrl, collectResources, classifyPage, checkResource, checkResources, exitCode, formatReport } from "./resource-links.mjs";
import { loadInventory } from "./check-resource-links.mjs";

const zendesk = "https://support.zendesk.com/hc/en-us/articles/12345-A-guide";
const aws = "https://docs.aws.amazon.com/connect/latest/adminguide/example.html";
const resource = (url = zendesk) => ({ url, entries: [{ source: "content.ts:RESOURCES[guide]", label: "Demo guide" }] });
const html = (text = "Using Contact Center") => `<html><title>${text}</title><h1>${text}</h1></html>`;
const response = (body = html(), status = 200, headers = {}) => new Response(body, {
  status, headers: { "content-type": "text/html; charset=utf-8", ...headers },
});

test("allowlist excludes private, signed, credentialed, non-document and unrelated destinations", () => {
  assert.equal(publicDocumentationUrl(`${zendesk}#topic`), zendesk);
  assert.equal(publicDocumentationUrl(aws), aws);
  assert.ok(publicDocumentationUrl("https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html"));
  assert.ok(publicDocumentationUrl("https://support.zendesk.com/hc/en-us/sections/123-Basics"));
  for (const url of [
    "http://support.zendesk.com/hc/en-us/articles/123",
    "https://user:secret@support.zendesk.com/hc/en-us/articles/123",
    `${zendesk}?token=private`, `${aws}?X-Amz-Signature=private`,
    "https://support.zendesk.com:8443/hc/en-us/articles/123",
    "https://docs.aws.amazon.com/private.pdf", "https://docs.aws.amazon.com/",
    "https://support.zendesk.com/hc/en-us/signin",
    "https://support.zendesk.com/attachments/private.pdf",
    "https://docs.google.com/document/d/private", "https://example.com/",
    "https://support.zendesk.com.evil.test/hc/en-us/articles/123",
    "https://support.zendesk.com/hc/en-us/articles/123/../../access",
  ]) assert.equal(publicDocumentationUrl(url), undefined, url);
});

test("inventory uses live portal exports, chips, component helper, and all source references", async () => {
  const inventory = await loadInventory();
  assert.ok(inventory.resources.length > 30);
  assert.ok(inventory.resources.some((item) => item.url === aws.replace("example", "concepts-telephony")));
  assert.ok(inventory.resources.some((item) => item.entries.some((entry) => entry.source.includes('COMPONENT_DOCUMENTATION["Corporate MFA policies"]'))));
  assert.ok(inventory.resources.some((item) => item.entries.some((entry) => entry.source.includes("APP_GUIDE_URL"))));
  assert.ok(!inventory.excluded.some((entry) => entry.source.includes('RESOURCES["gtm"]')),
    "private GTM data was moved server-side and must not be imported by the public resource inventory");
  assert.ok(inventory.resources.every((item) => publicDocumentationUrl(item.url)));
  const components = inventory.resources.find((item) => item.entries.some((entry) => entry.source.endsWith("LINKS.components")));
  assert.ok(components.entries.length >= 4, "duplicate and fragment references retained");
  assert.ok(inventory.resources.every((item) => !item.url.includes("#")));
});

test("known internal resources are excluded even if a shared link or chip also references them", () => {
  const data = { LINKS: { private: zendesk }, RESOURCES: [{ id: "private", title: "Signed-in guide", url: zendesk, kind: "Internal" }], COMPONENT_DOCUMENTATION: { Voice: zendesk } };
  const inventory = collectResources(data, {}, (_, mapping) => mapping.Voice);
  assert.deepEqual(inventory.resources, []);
  assert.equal(inventory.excluded.length, 3);
});

test("soft 404 detection uses primary headings, not ordinary article text about errors", () => {
  for (const title of ["404 Not Found", "Page not found - Zendesk", "The page you were looking for doesn't exist", "Oops! The page you were looking for doesn't exist.", "We couldn't find that page", "Article not found"]) {
    assert.equal(classifyPage(200, html(title)).status, "missing", title);
  }
  assert.equal(classifyPage(200, html() + "<p>If you see Page not found or a 404 error, retry.</p>").status, "ok");
  assert.equal(classifyPage(200, "<html><title>Docs</title><h1>Page <em>not found</em></h1></html>").status, "missing");
  assert.equal(classifyPage(200, '<title>Documentation</title><meta http-equiv="refresh" content="0;url=/">').status, "unverified");
});

test("status and challenge classification never confuses access problems with missing articles", () => {
  for (const status of [404, 410]) assert.equal(classifyPage(status, html()).status, "missing");
  for (const status of [401, 403]) assert.equal(classifyPage(status, html("Page not found")).status, "restricted");
  for (const status of [429, 500, 502, 503, 408]) assert.equal(classifyPage(status, html("Page not found")).status, "temporary");
  for (const status of [200, 403, 404, 503]) assert.equal(classifyPage(status, '<title>Just a moment...</title><script src="/cdn-cgi/challenge-platform/test"></script>').status, "restricted");
  assert.equal(classifyPage(200, html("Sign in - Zendesk")).status, "restricted");
  assert.equal(classifyPage(400, html()).status, "failed");
  assert.equal(classifyPage(204, "").status, "unverified");
});

test("requests omit credentials, never follow cookies, and strip fragments", async () => {
  let count = 0;
  const result = await checkResource(resource(`${zendesk}#topic`), {
    fetchImpl: async (url, options) => {
      count++;
      assert.equal(url, zendesk);
      assert.equal(options.credentials, "omit");
      assert.equal(options.redirect, "manual");
      assert.deepEqual(Object.keys(options.headers).sort(), ["Accept", "User-Agent"]);
      return response(html(), 200, { "set-cookie": "session=do-not-replay" });
    },
  });
  assert.equal(count, 1);
  assert.equal(result.status, "ok");
});

test("safe documentation redirects report moved without modifying entries", async () => {
  let calls = 0;
  const input = resource();
  const result = await checkResource(input, {
    fetchImpl: async () => ++calls === 1 ? response("", 301, { location: aws, "set-cookie": "session=private" }) : response(),
  });
  assert.equal(result.status, "moved");
  assert.equal(result.finalUrl, aws);
  assert.equal(input.url, zendesk);
});

test("unsafe or sign-in redirects are never requested, including signed URLs on approved hosts", async () => {
  for (const [location, expected] of [
    ["https://example.com/private", "unverified"],
    ["/hc/en-us/signin?return_to=secret", "restricted"],
    ["https://support.zendesk.com/access/unauthenticated", "restricted"],
    [`${aws}?token=secret`, "unverified"],
    ["https://docs.aws.amazon.com/index.html", "unverified"],
  ]) {
    let calls = 0;
    const result = await checkResource(resource(), {
      fetchImpl: async () => { calls++; return response("", 302, { location }); },
    });
    assert.equal(calls, 1);
    assert.equal(result.status, expected);
    assert.ok(!JSON.stringify(result).includes("secret"));
  }
});

test("loops, redirect depth and absent destinations fail explicitly", async () => {
  assert.equal((await checkResource(resource(), { fetchImpl: async () => response("", 302, { location: zendesk }) })).status, "failed");
  assert.equal((await checkResource(resource(), { fetchImpl: async () => response("", 302) })).status, "failed");
  let count = 100;
  const result = await checkResource(resource(), { fetchImpl: async () => response("", 301, { location: `/hc/en-us/articles/${count++}` }) });
  assert.match(result.reason, /More than 5 redirects/);
});

test("timeouts and network failures are inconclusive, not broken links", async () => {
  const result = await checkResource(resource(), {
    timeoutMs: 5,
    fetchImpl: (_, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("abort")))),
  });
  assert.equal(result.status, "temporary");
  assert.match(result.reason, /timed out/);
  const network = await checkResource(resource(), { fetchImpl: async () => { throw new Error("private diagnostic data"); } });
  assert.equal(network.status, "temporary");
  assert.ok(!network.reason.includes("private diagnostic"));
});

test("body reading is bounded and partial/non-HTML pages cannot pass", async () => {
  const large = await checkResource(resource(), { maxBytes: 50, fetchImpl: async () => response(html() + "a".repeat(500)) });
  assert.equal(large.status, "unverified");
  const json = await checkResource(resource(), { fetchImpl: async () => response('{"title":"guide"}', 200, { "content-type": "application/json" }) });
  assert.equal(json.status, "unverified");
});

test("only two requests run at once and rate-limited hosts stop receiving requests", async () => {
  let active = 0;
  let peak = 0;
  let calls = 0;
  const results = await checkResources(Array.from({ length: 8 }, (_, i) => resource(`${zendesk}-${i}`)), {
    delayMs: 0,
    fetchImpl: async () => {
      active++; peak = Math.max(peak, active); calls++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return response("", 429);
    },
  });
  assert.ok(peak <= 2);
  assert.equal(calls, 2);
  assert.ok(results.every((result) => result.status === "temporary"));
  assert.equal(results.length, 8);
});

test("challenges pause only their host; other providers are still checked", async () => {
  const results = await checkResources([resource(), resource(), resource(aws), resource()], {
    delayMs: 0, fetchImpl: async (url) => url === aws ? response() : response(html("Just a moment...")),
  });
  assert.equal(results[2].status, "ok");
  assert.equal(results[3].status, "restricted");
});

test("report includes affected source and label; exit codes distinguish uncertain checks", () => {
  const missing = { ...resource(), status: "missing", reason: "HTTP 404" };
  const report = formatReport({ results: [missing], excluded: [] });
  assert.match(report, /Demo guide/);
  assert.match(report, /content\.ts:RESOURCES\[guide\]/);
  assert.match(report, /MISSING/);
  assert.equal(exitCode([missing]), 1);
  assert.equal(exitCode([{ status: "restricted" }]), 2);
  assert.equal(exitCode([{ status: "temporary" }, missing]), 1);
  assert.equal(exitCode([{ status: "ok" }, { status: "moved" }]), 0);
});
