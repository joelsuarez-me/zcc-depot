import assert from "node:assert/strict";
import { test } from "node:test";
import { companyLogoKey, findAgendaCompanyLogo } from "../src/lib/agenda-company-logo.ts";

const png = () => new Blob(["test-logo"], { type: "image/png" });
function services(overrides = {}) {
  return {
    resolve: async () => ({ logoUrl: "/api/demo-research/logo/temporary" }),
    download: async () => png(),
    store: async file => {
      assert.equal(file.type, "image/png");
      assert.equal(file.name, "company-logo.png");
      return "/objects/uploads/persistent";
    },
    ...overrides,
  };
}

test("Company keys ignore case and extra whitespace", () => {
  assert.equal(companyLogoKey("  Morningstar   Inc "), companyLogoKey("morningstar inc"));
});

test("Lookup returns a persistent storage path, never the expiring research URL", async () => {
  const path = await findAgendaCompanyLogo("Morningstar", new AbortController().signal, services());
  assert.equal(path, "/objects/uploads/persistent");
});

test("Missing logos leave the agenda unchanged without uploading a placeholder", async () => {
  assert.equal(await findAgendaCompanyLogo("Unknown", new AbortController().signal, services({
    resolve: async () => ({ logoUrl: null }),
    download: async () => assert.fail("No image should be fetched"),
    store: async () => assert.fail("No placeholder should be uploaded"),
  })), null);
});

test("A changed company or manual override cancels stale lookup results", async () => {
  const controller = new AbortController();
  await assert.rejects(findAgendaCompanyLogo("Old company", controller.signal, services({
    resolve: async () => { controller.abort(); return { logoUrl: "/old-logo" }; },
    download: async () => assert.fail("Cancelled results must not download"),
  })), { name: "AbortError" });
});

test("Cancellation after download prevents storage and cancellation after storage prevents application", async () => {
  for (const cancelAt of ["download", "store"]) {
    const controller = new AbortController();
    await assert.rejects(findAgendaCompanyLogo("Company", controller.signal, services({
      download: async () => { if (cancelAt === "download") controller.abort(); return png(); },
      store: async () => {
        assert.equal(cancelAt, "store");
        controller.abort();
        return "/objects/uploads/stale";
      },
    })), { name: "AbortError" });
  }
});

test("Unexpected response types and oversized images fail explicitly", async () => {
  for (const blob of [new Blob(["not an image"], { type: "text/html" }), new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: "image/png" })]) {
    await assert.rejects(findAgendaCompanyLogo("Company", new AbortController().signal, services({
      download: async () => blob,
      store: async () => assert.fail("Invalid image must not be stored"),
    })), /could not be used/);
  }
});
