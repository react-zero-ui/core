import { test, expect } from '@playwright/test';

const scenarios = [
  { toggle: 'theme-toggle', attr: 'data-theme' },
  { toggle: 'theme-toggle-secondary', attr: 'data-theme-2' },
  { toggle: 'theme-toggle-3', attr: 'data-theme-three' },
];

test.describe.configure({ mode: 'serial' });   // run one after another
test.describe('Zero-UI Next.js integration', () => {
  for (const { toggle, attr } of scenarios) {
    test(`starts "light" and flips <${attr}> → "dark"`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const body = page.locator('body');
      const button = page.getByTestId(toggle);

      /* ①  Wait until the attribute exists at all */
      await expect.poll(async () => {
        const v = await body.getAttribute(attr);
        return v !== null;
      }).toBe(true);                      // attribute now present (any value)

      /* ②  Now assert it is "light" */
      await expect(body).toHaveAttribute(attr, 'light');

      /* ③  Click & assert "dark" */
      await button.click();
      await expect.poll(async () => {
        const v = await body.getAttribute(attr);
        return v !== null;
      }).toBe(true);
      await expect(body).toHaveAttribute(attr, 'dark');
    });
  }
});
