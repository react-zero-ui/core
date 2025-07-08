/* eslint-disable import/named */
import { test, expect } from '@playwright/test';

// Define test scenarios with proper expected values
const scenarios = [
	{
		name: 'Primary Theme Toggle',
		toggle: 'theme-toggle',
		container: 'theme-container',
		attr: 'data-theme',
		initialValue: 'light',
		toggledValue: 'dark',
		initialText: 'Light',
		toggledText: 'Dark',
	},
	{
		name: 'Secondary Theme Toggle',
		toggle: 'theme-toggle-secondary',
		container: 'theme-container-secondary',
		attr: 'data-theme-2',
		initialValue: 'light',
		toggledValue: 'dark',
		initialText: 'Light',
		toggledText: 'Dark',
	},
	{
		name: 'Tertiary Theme Toggle',
		toggle: 'theme-toggle-3',
		container: 'theme-container-3',
		attr: 'data-theme-three',
		initialValue: 'light',
		toggledValue: 'dark',
		initialText: 'Light',
		toggledText: 'Dark',
	},
	{
		name: 'Boolean Toggle',
		toggle: 'toggle-boolean',
		container: 'toggle-boolean-container',
		attr: 'data-toggle-boolean',
		initialValue: 'true',
		toggledValue: 'false',
		initialText: 'True',
		toggledText: 'False',
	},
	{
		name: 'Number Toggle',
		toggle: 'toggle-number',
		container: 'toggle-number-container',
		attr: 'data-number',
		initialValue: '1',
		toggledValue: '2',
		initialText: '1',
		toggledText: '2',
	},
	{
		name: 'UseEffect Component',
		toggle: 'use-effect-theme',
		container: 'use-effect-theme-container',
		attr: 'data-use-effect-theme',
		initialValue: 'light',
		toggledValue: 'dark',
		initialText: 'Light',
		toggledText: 'Dark',
	},
	{
		name: 'Toggle Function',
		toggle: 'toggle-function',
		container: 'toggle-function-container',
		attr: 'data-toggle-function',
		initialValue: 'white',
		toggledValue: 'black',
		initialText: 'White',
		toggledText: 'Black',
	},
];

test.describe.configure({ mode: 'serial' });

test.describe('Zero-UI Next.js Integration Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
	});

	// Test each scenario
	for (const scenario of scenarios) {
		test(`${scenario.name}: toggles from ${scenario.initialValue} to ${scenario.toggledValue}`, async ({ page }) => {
			console.log(`\n🧪 Testing ${scenario.name}`);

			const body = page.locator('body');
			const button = page.getByTestId(scenario.toggle);
			const container = page.getByTestId(scenario.container);

			// Verify button exists
			await expect(button).toBeVisible();
			console.log(`✅ Button ${scenario.toggle} is visible`);

			// Check initial state
			console.log(`🔍 Checking initial state...`);
			await expect(body).toHaveAttribute(scenario.attr, scenario.initialValue);

			// Verify initial text is visible (use more specific selector)
			const initialTextElement = container.locator('span').filter({ hasText: scenario.initialText });
			await expect(initialTextElement).toBeVisible();

			// Also verify the other text is hidden
			const toggledTextElement = container.locator('span').filter({ hasText: scenario.toggledText });
			await expect(toggledTextElement).toBeHidden();
			console.log(`✅ Initial state: ${scenario.attr}="${scenario.initialValue}", text="${scenario.initialText}"`);

			// Click to toggle
			console.log(`🖱️  Clicking ${scenario.toggle}...`);
			await button.click();

			// Check toggled state
			console.log(`🔍 Checking toggled state...`);
			await expect(body).toHaveAttribute(scenario.attr, scenario.toggledValue);

			// Verify toggled text is visible
			const newVisibleElement = container.locator('span').filter({ hasText: scenario.toggledText });
			const newHiddenElement = container.locator('span').filter({ hasText: scenario.initialText });
			await expect(newVisibleElement).toBeVisible();
			await expect(newHiddenElement).toBeHidden();
			console.log(`✅ Toggled state: ${scenario.attr}="${scenario.toggledValue}", text="${scenario.toggledText}"`);

			// Click again to toggle back
			console.log(`🖱️  Clicking ${scenario.toggle} again to toggle back...`);
			await button.click();

			// Verify it returns to initial state
			await expect(body).toHaveAttribute(scenario.attr, scenario.initialValue);
			const finalVisibleElement = container.locator('span').filter({ hasText: scenario.initialText });
			const finalHiddenElement = container.locator('span').filter({ hasText: scenario.toggledText });
			await expect(finalVisibleElement).toBeVisible();
			await expect(finalHiddenElement).toBeHidden();
			console.log(`✅ Returned to initial state: ${scenario.attr}="${scenario.initialValue}"`);
		});
	}

	// Separate test for visual styling
	test('Visual styling changes work correctly', async ({ page }) => {
		const body = page.locator('body');
		const themeButton = page.getByTestId('theme-toggle');

		await themeButton.click();
		await expect(body).toHaveAttribute('data-theme', 'dark');
	});

	// Test all toggles work independently
	test('Multiple toggles work independently', async ({ page }) => {
		const body = page.locator('body');

		// Click theme toggle
		await page.getByTestId('theme-toggle').click();
		await expect(body).toHaveAttribute('data-theme', 'dark');

		// Click boolean toggle
		await page.getByTestId('toggle-boolean').click();
		await expect(body).toHaveAttribute('data-toggle-boolean', 'false');

		// Verify theme is still dark
		await expect(body).toHaveAttribute('data-theme', 'dark');

		// Click number toggle
		await page.getByTestId('toggle-number').click();
		await expect(body).toHaveAttribute('data-number', '2');

		// Click scope toggle
		await page.getByTestId('scope-toggle').click();
		await expect(body).toHaveAttribute('data-scope', 'off');

		// Verify other states are preserved
		await expect(body).toHaveAttribute('data-theme', 'dark');
		await expect(body).toHaveAttribute('data-toggle-boolean', 'false');
	});

	test('Tailwind is generated correctly', async ({ page }) => {
		const pageContainer = page.getByTestId('page-container');
		await expect(pageContainer).toHaveCSS('background-color', 'rgb(255, 255, 255)');
	});
});
