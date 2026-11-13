import { expect, test, type Page } from "@playwright/test";

const panels = [
  { id: "component-connect", title: "Amazon Connect", term: "contact flows" },
  { id: "component-app", title: "Contact Center app", term: "agent interface" },
  { id: "component-identity", title: "Identity and sign-in", term: "Cognito user pool" },
  { id: "component-cloudformation", title: "CloudFormation", term: "stack lifecycle" },
];

async function clearPreviewNotice(page: Page) {
  const close = page.getByRole("button", { name: "Close banner", exact: true });
  if (await close.isVisible()) await close.click();
}

async function titleClearsNavigation(page: Page, id: string, title: string) {
  const heading = page.locator(`#${id}-title`);
  await expect(heading).toHaveText(title);
  await expect.poll(() => heading.evaluate(element => {
    const box = element.getBoundingClientRect();
    const header = document.querySelector("header")?.getBoundingClientRect();
    return box.top >= (header?.bottom ?? 0) && box.bottom <= innerHeight;
  }), { message: `${title} stays visible below sticky navigation` }).toBe(true);
}

test("keyboard search reaches each architecture panel across routes and on the same page", async ({ page }) => {
  await page.goto("./");
  await clearPreviewNotice(page);
  for (const panel of panels) {
    await page.keyboard.press("Control+k");
    const input = page.getByTestId("input-global-search");
    await input.fill(panel.term);
    const result = page.getByTestId(`result-search-section-${panel.id}`);
    await expect(result).toBeVisible();
    await expect(result).toContainText(`${panel.title} · Architecture panel`);
    // Traverse real cmdk selection rather than invoking its onSelect handler.
    const selected = page.locator('[cmdk-item][data-selected="true"]');
    for (let steps = 0; await selected.getAttribute("data-testid") !== `result-search-section-${panel.id}`; steps++) {
      expect(steps, "panel is reachable with arrow keys").toBeLessThan(40);
      await input.press("ArrowDown");
    }
    await input.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/architecture#${panel.id}$`));
    await expect(page.getByRole("dialog")).toBeHidden();
    await clearPreviewNotice(page);
    await titleClearsNavigation(page, panel.id, panel.title);
  }
  // Existing Components guide remains separately discoverable.
  await page.keyboard.press("Control+k");
  await page.getByTestId("input-global-search").fill("Cognito");
  await expect(page.getByTestId("result-search-page-contact-center-components"))
    .toContainText("Understanding Contact Center components");
  await expect(page.getByTestId("result-search-section-component-identity"))
    .toContainText("Identity and sign-in · Architecture panel");
  await page.keyboard.press("Escape");
});

test("direct panel hashes and reloads preserve unnumbered visible titles", async ({ page }) => {
  for (const panel of panels) {
    await page.goto(`architecture#${panel.id}`);
    await clearPreviewNotice(page);
    await titleClearsNavigation(page, panel.id, panel.title);
    await page.reload();
    await clearPreviewNotice(page);
    await expect(page).toHaveURL(new RegExp(`/architecture#${panel.id}$`));
    await titleClearsNavigation(page, panel.id, panel.title);
  }
});
