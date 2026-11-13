import { expect, test, type Locator, type Page } from "@playwright/test";
import { installResearchLayoutFixture, reportId } from "./research-layout-fixture";

type Rect = { x: number; y: number; width: number; height: number };
const rail = (page: Page) => page.getByTestId("section-navigation");
const up = (page: Page) => page.getByTestId("button-section-up");
const down = (page: Page) => page.getByTestId("button-section-down");
const direct = (page: Page) => page.getByTestId("link-current-section");

async function bounds(locator: Locator): Promise<Rect> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${locator} must have measurable bounds`).not.toBeNull();
  return box!;
}

function disjoint(a: Rect, b: Rect, label: string) {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  expect(overlapX > 0.5 && overlapY > 0.5,
    `${label}: overlapping rectangles ${JSON.stringify({ a, b })}`).toBe(false);
}

async function inViewport(page: Page, locator: Locator, minimum = 0) {
  const box = await bounds(locator);
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.y).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
  expect(box.width).toBeGreaterThanOrEqual(minimum);
  expect(box.height).toBeGreaterThanOrEqual(minimum);
  return box;
}

// Check the actual painted hit targets, not just CSS strings or DOM presence.
async function unobstructed(locator: Locator) {
  await expect.poll(() => locator.evaluate(element => {
    const b = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
  }), { message: `${locator} center must not be covered by another element` }).toBe(true);
}

async function phoneGeometry(page: Page, modalOpen = false) {
  const nav = await inViewport(page, rail(page));
  const previous = await inViewport(page, up(page), 44);
  const next = await inViewport(page, down(page), 44);
  disjoint(previous, next, "arrow targets");
  expect(Math.abs(previous.y - next.y), "phone arrows share a row").toBeLessThan(1);
  expect(next.x).toBeGreaterThan(previous.x);
  await expect(direct(page)).toBeHidden();
  for (const id of ["link-home-logo", "button-open-search", "button-mobile-menu"]) {
    const target = page.getByTestId(id);
    disjoint(nav, await inViewport(page, target), `rail versus ${id}`);
    if (!modalOpen) await unobstructed(target);
  }
  const logo = await bounds(page.getByTestId("link-home-logo"));
  expect(nav.y, "rail stays in header, not over reading content").toBeGreaterThanOrEqual(logo.y - 6);
  expect(nav.y + nav.height).toBeLessThanOrEqual(logo.y + logo.height + 6);
  if (!modalOpen) {
    await unobstructed(up(page));
    await unobstructed(down(page));
  }
}

async function scrollTo(page: Page, position: "top" | "middle" | "bottom") {
  await page.evaluate(position => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo({ top: position === "top" ? 0 : position === "middle" ? max / 2 : max, behavior: "instant" });
  }, position);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(0);
  // Two frames allow scroll listeners + navigation's requestAnimationFrame update.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function desktopGeometry(page: Page) {
  const nav = await inViewport(page, rail(page));
  const previous = await inViewport(page, up(page), 44);
  const next = await inViewport(page, down(page), 44);
  const link = await inViewport(page, direct(page), 44);
  expect(nav.x, "desktop restores left-side rail").toBeGreaterThanOrEqual(12);
  expect(nav.x).toBeLessThanOrEqual(32);
  expect(nav.y).toBeGreaterThan(100);
  expect(Math.abs(previous.x - next.x)).toBeLessThan(1);
  expect(Math.abs(previous.x - link.x)).toBeLessThan(1);
  expect(previous.y + previous.height).toBeLessThanOrEqual(next.y);
  expect(next.y + next.height).toBeLessThanOrEqual(link.y);
  expect(await rail(page).evaluate(el => getComputedStyle(el).transform)).toBe("none");
  await unobstructed(direct(page));
}

const routes = [
  { name: "Overview", path: "" },
  { name: "Resources", path: "resources" },
  { name: "Architecture components", path: "architecture/components" },
  { name: "Demos", path: "demos" },
  { name: "Research signed-out gate", path: "demos/brief" },
  { name: "Research report (browser-only fixture, NOT real authentication)",
    path: `demos/brief?report=${reportId}`, fixture: true },
];

for (const route of routes) {
  test(route.name, async ({ page }, testInfo) => {
    const unexpected = route.fixture ? await installResearchLayoutFixture(page) : [];
    if (!route.fixture) {
      // Signed-out state is deterministic even when the developer has a session.
      await page.route("**/api/auth/user", r => r.fulfill({ json: { user: null } }));
    } else {
      testInfo.annotations.push({ type: "fixture", description: "Browser response interception only; no OIDC, server authorization, research generation or persistence tested." });
    }
    await page.goto(route.path || "./");
    // The development-only notice covers the fixed header at phone widths.
    // Dismiss through its own control; never hide or restyle application nodes.
    const previewNotice = page.getByRole("button", { name: "Close banner", exact: true });
    if (await previewNotice.isVisible()) await previewNotice.click();
    await expect(page.locator("h1")).toBeVisible();
    if (route.fixture) {
      await expect(page.getByTestId("report-agenda-section")).toHaveCount(6);
      await expect(page.getByText("Browser-only fixture; authentication and provider access have not been tested.")).toBeVisible();
    }
    await page.evaluate(() => document.fonts.ready);
    await scrollTo(page, "top");
    await expect(up(page)).toBeDisabled();
    await expect(down(page)).toBeEnabled();

    const phone = page.viewportSize()!.width < 768;
    for (const position of ["top", "middle", "bottom"] as const) {
      await scrollTo(page, position);
      if (!phone) {
        await desktopGeometry(page);
        continue;
      }
      await phoneGeometry(page);
      await page.getByTestId("button-mobile-menu").click();
      await expect(page.getByRole("navigation", { name: "Mobile", exact: true })).toBeVisible();
      await phoneGeometry(page);
      disjoint(await bounds(rail(page)), await bounds(page.locator("#mobile-nav")), "rail versus open menu");
      await page.getByTestId("button-mobile-menu").click();
      await expect(page.locator("#mobile-nav")).toHaveCount(0);

      await page.getByTestId("button-open-search").click();
      const dialog = page.getByRole("dialog", { name: "Search ZCC Depot", exact: true });
      await expect(dialog).toBeVisible();
      await page.getByTestId("input-global-search").fill("routing");
      await phoneGeometry(page, true);
      disjoint(await bounds(rail(page)), await inViewport(page, dialog), "rail versus search dialog");
      await inViewport(page, page.getByTestId("input-global-search"));
      await inViewport(page, page.getByRole("button", { name: "Close search", exact: true }));
      await unobstructed(page.getByTestId("input-global-search"));
      await unobstructed(page.getByRole("button", { name: "Close search", exact: true }));
      await page.getByRole("button", { name: "Close search", exact: true }).click();
      await expect(dialog).toBeHidden();
      await phoneGeometry(page);
    }
    await expect(down(page)).toBeDisabled();
    await expect(up(page)).toBeEnabled();
    const bottom = await page.evaluate(() => scrollY);
    await up(page).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(bottom - 1);
    await scrollTo(page, "top");
    await down(page).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1);

    // Exercise the responsive transition itself, not only fresh desktop loads.
    if (phone) await page.setViewportSize({ width: 1440, height: 844 });
    await desktopGeometry(page);
    await scrollTo(page, "middle");
    await expect.poll(() => direct(page).getAttribute("href")).not.toBe("#main");
    const fragment = await direct(page).getAttribute("href");
    expect(fragment).toMatch(/^#[^#]+$/);
    const id = decodeURIComponent(fragment!.slice(1));
    expect(await page.evaluate(id => !!document.getElementById(id), id)).toBe(true);
    const before = new URL(page.url());
    await direct(page).click();
    await expect.poll(() => new URL(page.url()).hash).toBe(fragment);
    expect(new URL(page.url()).pathname).toBe(before.pathname);
    expect(new URL(page.url()).search).toBe(before.search);
    await page.reload();
    await expect(direct(page)).toBeVisible();
    await expect.poll(() => page.evaluate(id => {
      const target = document.getElementById(id);
      if (!target) return false;
      const top = target.getBoundingClientRect().top;
      // Native scrolling adds html scroll-padding and the target's scroll-margin.
      return top >= 76 && top < innerHeight / 2;
    }, id), { message: "reloaded fragment target is visible below the fixed header" }).toBe(true);
    await desktopGeometry(page);
    expect(unexpected, "fixture must never contact unmocked APIs or perform writes").toEqual([]);
  });
}
