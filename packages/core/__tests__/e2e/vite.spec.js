import { test, expect } from '@playwright/test';

const scenarios = [
	{ toggle: 'theme-toggle', attr: 'data-theme' },
	{ toggle: 'theme-toggle-secondary', attr: 'data-theme-2' },
	{ toggle: 'theme-toggle-3', attr: 'data-theme-three' },
];

test.describe.configure({ mode: 'serial' }); // run one after another
test.describe(`Zero-UI Vite integration ${scenarios.map(({ toggle }) => toggle).join(', ')}`, () => {
	for (const { toggle, attr } of scenarios) {
		test(`starts "light" and flips <${attr}> → "dark"`, async ({ page }) => {
			console.log(`\n🧪 Testing ${toggle} with attribute ${attr}`);

			await page.goto('/', { waitUntil: 'networkidle' });
			console.log('📄 Page loaded');

			const body = page.locator('body');
			const button = page.getByTestId(toggle);

			/* ①  Wait until the attribute is "light" */
			console.log(`🔍 Checking initial ${attr} attribute...`);

			// Debug: Check what the actual attribute value is
			const actualValue = await body.getAttribute(attr);
			console.log(`🐛 DEBUG: Current ${attr} value is:`, actualValue);

			// Check if button exists
			const buttonExists = await button.count();
			console.log(`🐛 DEBUG: Button ${toggle} count:`, buttonExists);

			await expect(body).toHaveAttribute(attr, 'light');
			console.log(`✅ Initial ${attr} is "light"`);

			/* ②  Click & assert "dark" */
			console.log(`🖱️  Clicking ${toggle} button...`);
			await button.click();
			console.log(`🔍 Checking ${attr} attribute after click...`);

			// Debug: Check what the actual attribute value is after click
			const actualValueAfter = await body.getAttribute(attr);
			console.log(`🐛 DEBUG: ${attr} value after click is:`, actualValueAfter);

			await expect(body).toHaveAttribute(attr, 'dark');
			console.log(`✅ ${attr} is now "dark"`);
		});
	}
});
