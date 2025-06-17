
import { test, expect } from '@playwright/test';

test.describe('Zero-UI Vite Integration', () => {


  test('Browser loads initial theme on body ⚛️', async ({ page }) => {

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // body attribute check + theme = initial theme
    const theme = await page.getAttribute('body', 'data-theme');
    expect(theme).toBe('light');
  });

  test('theme toggles on button click', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration and button
    const button = page.getByTestId('theme-toggle');
    await expect(button).toBeVisible();

    // Wait for container to ensure styles are applied
    const container = page.getByTestId('theme-container');
    await expect(container).toHaveClass(/theme-light:/); // initially light

    // Read initial theme attribute
    const before = await page.getAttribute('body', 'data-theme');
    console.log('🌞 before:', before);

    // Click to toggle
    await button.click();

    // Wait for DOM to reflect change
    await page.waitForTimeout(100); // Optional: add debounce if needed
    const after = await page.getAttribute('body', 'data-theme');
    console.log('🌙 after:', after);

    // Assertion
    expect(before).toBe('light');
    expect(after).toBe('dark');
  });

  test('theme2 toggles on button click', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration and button
    const button = page.getByTestId('theme-toggle-secondary');
    await expect(button).toBeVisible();

    // Wait for container to ensure styles are applied
    const container = page.getByTestId('theme-container-secondary');
    await expect(container).toHaveClass(/theme-2-light:/); // initially light

    // Read initial theme attribute
    const before = await page.getAttribute('body', 'data-theme-2');
    console.log('🌞 before:', before);

    // Click to toggle
    await button.click();

    // Wait for DOM to reflect change
    await page.waitForTimeout(100); // Optional: add debounce if needed
    const after = await page.getAttribute('body', 'data-theme-2');
    console.log('🌙 after:', after);

    // Assertion
    expect(before).toBe('light');
    expect(after).toBe('dark');
  });

  test('theme3 toggles on button click', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration and button
    const button = page.getByTestId('theme-toggle-3');
    await expect(button).toBeVisible();

    // Wait for container to ensure styles are applied
    const container = page.getByTestId('theme-container-3');
    await expect(container).toHaveClass(/theme-three-light:/); // initially light

    // Read initial theme attribute
    const before = await page.getAttribute('body', 'data-theme-three');
    console.log('🌞 before:', before);

    // Click to toggle
    await button.click();

    // Wait for DOM to reflect change
    await page.waitForTimeout(100); // Optional: add debounce if needed
    const after = await page.getAttribute('body', 'data-theme-three');
    console.log('🌙 after:', after);

    // Assertion
    expect(before).toBe('light');
    expect(after).toBe('dark');
  });
});
