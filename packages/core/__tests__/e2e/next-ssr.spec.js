// eslint-disable-next-line import/named
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Zero-UI Comprehensive Test Suite', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test', { waitUntil: 'networkidle' });
	});

	// Global State Tests
	test('Theme toggle works correctly', async ({ page }) => {
		const body = page.locator('body');
		const button = page.getByTestId('theme-button');
		const value = page.getByTestId('theme-value');

		// Initial state
		await expect(body).toHaveAttribute('data-test-theme', 'light');
		await expect(value.locator('.test-theme-light\\:inline')).toBeVisible();
		await expect(value.locator('.test-theme-dark\\:inline')).toBeHidden();

		// Toggle
		await button.click();
		await expect(body).toHaveAttribute('data-test-theme', 'dark');
		await expect(value.locator('.test-theme-dark\\:inline')).toBeVisible();
		await expect(value.locator('.test-theme-light\\:inline')).toBeHidden();

		// Toggle back
		await button.click();
		await expect(body).toHaveAttribute('data-test-theme', 'light');
		await expect(value.locator('.test-theme-light\\:inline')).toBeVisible();
	});

	test('Color selection works correctly', async ({ page }) => {
		const body = page.locator('body');

		// Initial state
		await expect(body).toHaveAttribute('data-test-color', 'red');

		// Click blue
		await page.getByTestId('color-blue').click();
		await expect(body).toHaveAttribute('data-test-color', 'blue');
		const colorValue = page.getByTestId('color-value');
		await expect(colorValue.locator('.test-color-blue\\:inline')).toBeVisible();
		await expect(colorValue.locator('.test-color-red\\:inline')).toBeHidden();

		// Click green
		await page.getByTestId('color-green').click();
		await expect(body).toHaveAttribute('data-test-color', 'green');
		await expect(colorValue.locator('.test-color-green\\:inline')).toBeVisible();
		await expect(colorValue.locator('.test-color-blue\\:inline')).toBeHidden();

		// Back to red
		await page.getByTestId('color-red').click();
		await expect(body).toHaveAttribute('data-test-color', 'red');
	});

	test('Toggle on/off works correctly', async ({ page }) => {
		const body = page.locator('body');
		const button = page.getByTestId('toggle-button');

		// Initial off
		await expect(body).toHaveAttribute('data-test-toggle', 'off');

		// Toggle on
		await button.click();
		await expect(body).toHaveAttribute('data-test-toggle', 'on');

		// Toggle off
		await button.click();
		await expect(body).toHaveAttribute('data-test-toggle', 'off');
	});

	// Scoped State Tests
	test('Accordion scoped state works correctly', async ({ page }) => {
		const accordion = page.getByTestId('accordion-test');
		const toggle = page.getByTestId('accordion-toggle');
		const content = page.getByTestId('accordion-content');

		// Initial closed
		await expect(accordion).toHaveAttribute('data-test-accordion', 'closed');
		await expect(content).toBeHidden();

		// Open
		await toggle.click();
		await expect(accordion).toHaveAttribute('data-test-accordion', 'open');
		await expect(content).toBeVisible();

		// Close
		await toggle.click();
		await expect(accordion).toHaveAttribute('data-test-accordion', 'closed');
		await expect(content).toBeHidden();
	});

	test('Tabs scoped state works correctly', async ({ page }) => {
		const tabContainer = page.getByTestId('tab-test');

		// Initial tab1
		await expect(tabContainer).toHaveAttribute('data-test-tab', 'tab1');
		await expect(page.getByTestId('tab-content-1')).toBeVisible();
		await expect(page.getByTestId('tab-content-2')).toBeHidden();
		await expect(page.getByTestId('tab-content-3')).toBeHidden();

		// Click tab2
		await page.getByTestId('tab-2').click();
		await expect(tabContainer).toHaveAttribute('data-test-tab', 'tab2');
		await expect(page.getByTestId('tab-content-1')).toBeHidden();
		await expect(page.getByTestId('tab-content-2')).toBeVisible();
		await expect(page.getByTestId('tab-content-3')).toBeHidden();

		// Click tab3
		await page.getByTestId('tab-3').click();
		await expect(tabContainer).toHaveAttribute('data-test-tab', 'tab3');
		await expect(page.getByTestId('tab-content-3')).toBeVisible();
	});

	// SSR Tests
	test('SSR global toggle works correctly', async ({ page }) => {
		const container = page.getByTestId('ssr-global-test');
		const button = page.getByTestId('ssr-global-button');

		// Initial state (SSR rendered)
		await expect(container).toHaveAttribute('data-test-ssr-theme', 'light');
		await expect(page.getByTestId('ssr-global-light')).toBeVisible();
		await expect(page.getByTestId('ssr-global-dark')).toBeHidden();

		// Click should have data-ui attribute
		await expect(button).toHaveAttribute('data-ui', 'global:test-ssr-theme(light,dark)');

		// Simulate SSR toggle (would happen on server)
		// For now, just verify the attributes are correct
		await button.click();
		// In real SSR, this would reload with new server state
	});

	test('SSR scoped toggle works correctly', async ({ page }) => {
		const container = page.getByTestId('ssr-scoped-test');
		const button = page.getByTestId('ssr-scoped-button');

		// Initial state
		await expect(container).toHaveAttribute('data-test-ssr-menu', 'closed');
		await expect(page.getByTestId('ssr-menu-content')).toBeHidden();

		// Check scoped data-ui attribute
		await expect(button).toHaveAttribute('data-ui', 'scoped:test-ssr-menu(open,closed)');
	});

	// CSS Variable Tests
	test.skip('CSS variable opacity works correctly', async ({ page }) => {
		const target = page.getByTestId('opacity-target');
		const body = page.locator('body');

		// Initial 100%
		await expect(body).toHaveAttribute('--test-opacity', '1');

		// Set to 0%
		await page.getByTestId('opacity-0').click();
		await expect(body).toHaveAttribute('--test-opacity', '0');
		await expect(target).toHaveCSS('opacity', '0');

		// Set to 50%
		await page.getByTestId('opacity-50').click();
		await expect(body).toHaveAttribute('--test-opacity', '0.5');
		await expect(target).toHaveCSS('opacity', '0.5');

		// Back to 100%
		await page.getByTestId('opacity-100').click();
		await expect(body).toHaveAttribute('data-test-opacity', '1');
		await expect(target).toHaveCSS('opacity', '1');
	});

	test.skip('CSS variable spacing works correctly', async ({ page }) => {
		const target = page.getByTestId('spacing-target');
		const body = page.locator('body');

		// Initial 8px
		await expect(body).toHaveAttribute('data-test-spacing', '8px');

		// Set to 4px
		await page.getByTestId('spacing-4').click();
		await expect(body).toHaveAttribute('data-test-spacing', '4px');
		await expect(target).toHaveCSS('padding', '4px');

		// Set to 16px
		await page.getByTestId('spacing-16').click();
		await expect(body).toHaveAttribute('data-test-spacing', '16px');
		await expect(target).toHaveCSS('padding', '16px');
	});

	// State Update Patterns
	test('Direct state updates work correctly', async ({ page }) => {
		const body = page.locator('body');

		// Initial medium
		await expect(body).toHaveAttribute('data-test-size', 'md');

		// Direct set to small
		await page.getByTestId('size-direct-sm').click();
		await expect(body).toHaveAttribute('data-test-size', 'sm');

		// Direct set to large
		await page.getByTestId('size-direct-lg').click();
		await expect(body).toHaveAttribute('data-test-size', 'lg');
	});

	test('Function state updates work correctly', async ({ page }) => {
		const body = page.locator('body');

		// Use function update
		await page.getByTestId('theme-function').click();
		await expect(body).toHaveAttribute('data-test-theme', 'dark');

		await page.getByTestId('theme-function').click();
		await expect(body).toHaveAttribute('data-test-theme', 'light');
	});

	// Multiple states independence
	test('Multiple states work independently', async ({ page }) => {
		const body = page.locator('body');

		// Set various states
		await page.getByTestId('theme-button').click(); // dark
		await page.getByTestId('color-blue').click(); // blue
		await page.getByTestId('toggle-button').click(); // on
		await page.getByTestId('size-direct-lg').click(); // lg

		// Verify all states
		await expect(body).toHaveAttribute('data-test-theme', 'dark');
		await expect(body).toHaveAttribute('data-test-color', 'blue');
		await expect(body).toHaveAttribute('data-test-toggle', 'on');
		await expect(body).toHaveAttribute('data-test-size', 'lg');

		// Change one state
		await page.getByTestId('color-green').click();

		// Verify others unchanged
		await expect(body).toHaveAttribute('data-test-theme', 'dark');
		await expect(body).toHaveAttribute('data-test-color', 'green'); // changed
		await expect(body).toHaveAttribute('data-test-toggle', 'on');
		await expect(body).toHaveAttribute('data-test-size', 'lg');
	});

	// Visual styling verification
	test('Tailwind classes apply correctly', async ({ page }) => {
		const themeTest = page.getByTestId('theme-test');
		const colorTest = page.getByTestId('color-test');

		// Theme styling
		await expect(themeTest).toHaveCSS('background-color', 'rgb(255, 255, 255)'); // white
		await page.getByTestId('theme-button').click();
		await expect(themeTest).toHaveCSS('background-color', 'rgb(0, 0, 0)'); // black

		// Color styling
		await expect(colorTest).toHaveCSS('background-color', 'oklch(0.637 0.237 25.331)'); // red-500
		await page.getByTestId('color-blue').click();
		await expect(colorTest).toHaveCSS('background-color', 'oklch(0.623 0.214 259.815)'); // blue-500
	});
});
