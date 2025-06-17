import { test, expect } from '@playwright/test';

// Table-driven so every toggle runs in its own fresh browser context.
const scenarios = [
  { toggle: 'theme-toggle', attr: 'data-theme' },
  { toggle: 'theme-toggle-secondary', attr: 'data-theme-2' },
  { toggle: 'theme-toggle-3', attr: 'data-theme-three' },
];

test.describe('Zero-UI Vite Integration', () => {
  for (const { toggle, attr } of scenarios) {
    test(`toggles <${attr}> from light → dark`, async ({ page }) => {
      // 1️⃣ Load fully hydrated page
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator('body').waitFor({ state: 'visible', timeout: 5000 });
      console.log(`✅ page loaded testing ${attr} from light → dark`);

      const body = page.locator('body');
      const button = page.getByTestId(toggle);


      // 2️⃣ Assert initial state
      await expect.poll(async () => await body.getAttribute(attr)).toBe('light');
      await expect.poll(async () => await button.isVisible()).toBe(true);   // auto-retries until true


      // 3️⃣ Action
      await button.click((console.log(`✅ ${button} clicked`)));

      // 4️⃣ Final state
      await expect.poll(async () => await body.getAttribute(attr)).toBe('dark');
    });
  }
});