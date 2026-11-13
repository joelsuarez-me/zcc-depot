import { expect, test, type Locator, type Page } from "@playwright/test";

// Exercise the real public wrappers and shared shell, not a replacement hero fixture.
// Uses the running preview URL supplied through SECTION_NAV_BASE_URL in the shared config.
const wrappers = [
  { name: "landing", path: "./", selector: ".hh", link: "link-home-logo" },
  { name: "RoomFrame", path: "rooms/executive-overview", selector: ".room-hero", link: "link-room-executive-overview" },
  { name: "PageHero", path: "resources", selector: ".zhero", link: "link-nav-resources" },
] as const;
const key = "zcc-depot:hero-motion";
const control = (page: Page) => page.getByTestId("button-hero-motion");
const hero = (page: Page, selector: string) => page.locator(`.depot-main ${selector}`);

// Override the geometry suite's reduced-motion default so missing animation or
// pause rules cannot accidentally pass because the OS preference disabled motion.
test.use({ reducedMotion: "no-preference" });
// The shared config also runs phone geometry projects. This focused suite uses
// the desktop sidebar for route transitions; don't run it with a hidden sidebar.
test.skip(({ viewport }) => !!viewport && viewport.width < 1024,
  "Hero motion regressions run in the desktop project; phone geometry has its own suite.");

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/user", route => route.fulfill({ json: { user: null } }));
});

async function open(page: Page, path: string) {
  await page.goto(path);
  const notice = page.getByRole("button", { name: "Close banner", exact: true });
  if (await notice.isVisible()) await notice.click();
  await expect(control(page)).toBeVisible();
}

async function pseudoStyles(target: Locator, pseudo: "::before" | "::after") {
  return target.evaluate((element, pseudo) => {
    const style = getComputedStyle(element, pseudo);
    return {
      display: style.display,
      animation: style.animationName,
      states: style.animationPlayState.split(",").map(value => value.trim()),
      opacity: style.opacity,
      filter: style.filter,
      transform: style.transform,
    };
  }, pseudo);
}

async function expectOrbit(target: Locator, state: "running" | "paused" | "reduced" | "print") {
  await expect(target).toBeVisible();
  // Both layers matter: a stopped outer ring must not mask a still-moving inner ring.
  for (const pseudo of ["::before", "::after"] as const) {
    await expect.poll(async () => {
      const style = await pseudoStyles(target, pseudo);
      if (state === "print") return style.display === "none";
      if (style.display === "none") return false;
      if (state === "reduced") {
        return style.animation === "none" && style.opacity === "0.24" && style.filter === "none";
      }
      return style.animation === "depot-orbit-turn, depot-orbit-glow"
        && style.states.every(value => value === state);
    }, { message: `${pseudo} orbit is ${state}` }).toBe(true);
  }
}

async function expectControl(page: Page, paused: boolean) {
  const label = paused ? "Resume hero animation" : "Pause hero animation";
  await expect(control(page)).toHaveRole("button");
  await expect(control(page)).toHaveAccessibleName(label);
  await expect(control(page)).toHaveAttribute("title", label);
  await expect(control(page)).toHaveAttribute("type", "button");
  await expect(control(page)).toHaveAttribute("aria-pressed", String(paused));
  await expect(control(page).locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("html")).toHaveAttribute("data-hero-motion", paused ? "paused" : "playing");
  await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), key))
    .toBe(paused ? "paused" : "playing");
}

async function navigate(page: Page, wrapper: typeof wrappers[number]) {
  // Real client-side links: full page.goto calls would miss shell state resetting
  // during route transitions. The marker proves the document was not replaced.
  await page.getByTestId("nav-sidebar").getByTestId(wrapper.link).click();
  await expect(hero(page, wrapper.selector)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-hero-route-test", "same-document");
}

test("keyboard pause/resume and session state survive all wrapper routes and reloads", async ({ page }) => {
  await open(page, "./");
  await page.evaluate(() => { document.documentElement.dataset.heroRouteTest = "same-document"; });
  await expectControl(page, false);
  await expectOrbit(hero(page, ".hh"), "running");

  // Reach the control using sequential keyboard navigation, not element.focus().
  for (let tabs = 0; !(await control(page).evaluate(element => element === document.activeElement)); tabs++) {
    expect(tabs, "hero motion control is in the normal tab order").toBeLessThan(60);
    await page.keyboard.press("Tab");
  }
  await expect(control(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expectControl(page, true);

  for (const wrapper of wrappers) {
    await navigate(page, wrapper);
    await expectControl(page, true);
    const target = hero(page, wrapper.selector);
    await expectOrbit(target, "paused");
    const before = await pseudoStyles(target, "::before");
    const after = await pseudoStyles(target, "::after");
    await page.waitForTimeout(120); // Sample two different times while paused.
    expect((await pseudoStyles(target, "::before")).transform).toBe(before.transform);
    expect((await pseudoStyles(target, "::after")).transform).toBe(after.transform);

    // Verify Space's native button activation and labels on each wrapper.
    await control(page).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(control(page)).toBeFocused();
    await page.keyboard.press("Space");
    await expectControl(page, false);
    await expectOrbit(target, "running");
    await page.keyboard.press("Enter");
    await expectControl(page, true);
  }

  await page.reload(); // Remounting must restore the paused session preference.
  await expectControl(page, true);
  await expectOrbit(hero(page, ".zhero"), "paused");
  await control(page).press("Space");
  await expectControl(page, false);
  await page.evaluate(() => { document.documentElement.dataset.heroRouteTest = "same-document"; });
  for (const wrapper of [...wrappers].reverse()) {
    await navigate(page, wrapper);
    await expectControl(page, false);
    await expectOrbit(hero(page, wrapper.selector), "running");
  }
  await page.reload();
  await expectControl(page, false);
  await expectOrbit(hero(page, ".hh"), "running");
});

for (const wrapper of wrappers) {
  test(`${wrapper.name}: reduced motion wins over resume, including live preference changes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, wrapper.path);
    const target = hero(page, wrapper.selector);
    await expectControl(page, false);
    await expectOrbit(target, "reduced");
    await control(page).press("Enter");
    await expectControl(page, true);
    await expectOrbit(target, "reduced");
    await control(page).press("Space");
    await expectControl(page, false);
    await expectOrbit(target, "reduced");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expectOrbit(target, "running");
    await control(page).press("Enter");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectOrbit(target, "reduced");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expectControl(page, true);
    await expectOrbit(target, "paused");
  });

  test(`${wrapper.name}: print hides both decorative layers without hiding the hero`, async ({ page }) => {
    await open(page, wrapper.path);
    const target = hero(page, wrapper.selector);
    await expectOrbit(target, "running");
    for (const paused of [false, true]) {
      if (paused) await control(page).press("Enter");
      await page.emulateMedia({ media: "print" });
      await expectOrbit(target, "print");
      await expect(target.locator("h1")).toBeVisible();
      await page.emulateMedia({ media: "screen" });
      await expectOrbit(target, paused ? "paused" : "running");
    }
  });
}
