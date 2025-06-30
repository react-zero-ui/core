import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Zero-UI Scoped State Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
	});

	test('FAQ components start in closed state', async ({ page }) => {
		console.log('\n🧪 Testing initial FAQ states');

		// All FAQ answers should be hidden initially
		for (let i = 1; i <= 3; i++) {
			const answer = page.getByTestId(`faq-${i}-answer`);
			await expect(answer).toBeHidden();
			console.log(`✅ FAQ ${i} answer is initially hidden`);
		}
	});

	test('Each FAQ can be opened and closed independently', async ({ page }) => {
		console.log('\n🧪 Testing independent FAQ state management');

		// Open FAQ 1
		console.log('🖱️  Opening FAQ 1...');
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		console.log('✅ FAQ 1 is open');

		// Open FAQ 2 - FAQ 1 should stay open
		console.log('🖱️  Opening FAQ 2...');
		await page.getByTestId('faq-2-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();
		console.log('✅ FAQ 1 and FAQ 2 are both open');

		// Open FAQ 3 - FAQ 1 and 2 should stay open
		console.log('🖱️  Opening FAQ 3...');
		await page.getByTestId('faq-3-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();
		await expect(page.getByTestId('faq-3-answer')).toBeVisible();
		console.log('✅ All FAQs are open simultaneously');
	});

	test('Individual FAQ toggle functionality works correctly', async ({ page }) => {
		console.log('\n🧪 Testing individual FAQ toggle functionality');

		// Open all FAQs first
		await page.getByTestId('faq-1-toggle').click();
		await page.getByTestId('faq-2-toggle').click();
		await page.getByTestId('faq-3-toggle').click();

		// Verify all are open
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();
		await expect(page.getByTestId('faq-3-answer')).toBeVisible();
		console.log('✅ All FAQs opened');

		// Close FAQ 2 - others should stay open
		console.log('🖱️  Closing FAQ 2...');
		await page.getByTestId('faq-2-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		await expect(page.getByTestId('faq-2-answer')).toBeHidden();
		await expect(page.getByTestId('faq-3-answer')).toBeVisible();
		console.log('✅ FAQ 2 closed, FAQ 1 and 3 remain open');

		// Close FAQ 1 - FAQ 3 should stay open
		console.log('🖱️  Closing FAQ 1...');
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeHidden();
		await expect(page.getByTestId('faq-2-answer')).toBeHidden();
		await expect(page.getByTestId('faq-3-answer')).toBeVisible();
		console.log('✅ FAQ 1 closed, only FAQ 3 remains open');
	});

	test('Scoped state allows multiple FAQs to be open', async ({ page }) => {
		console.log('\n🧪 Testing scoped state - multiple FAQs can be open');

		// Function to count visible FAQ answers
		const countVisibleAnswers = async () => {
			let visibleCount = 0;
			for (let i = 1; i <= 3; i++) {
				const answer = page.getByTestId(`faq-${i}-answer`);
				if (await answer.isVisible()) {
					visibleCount++;
				}
			}
			return visibleCount;
		};

		// Initially, no FAQs should be open
		expect(await countVisibleAnswers()).toBe(0);
		console.log('✅ Initially 0 FAQs are open');

		// Open FAQ 1
		await page.getByTestId('faq-1-toggle').click();
		expect(await countVisibleAnswers()).toBe(1);
		console.log('✅ 1 FAQ is open');

		// Open FAQ 2 - should have 2 open
		await page.getByTestId('faq-2-toggle').click();
		expect(await countVisibleAnswers()).toBe(2);
		console.log('✅ 2 FAQs are open');

		// Open FAQ 3 - should have 3 open
		await page.getByTestId('faq-3-toggle').click();
		expect(await countVisibleAnswers()).toBe(3);
		console.log('✅ All 3 FAQs are open');

		// Close FAQ 2 - should have 2 open
		await page.getByTestId('faq-2-toggle').click();
		expect(await countVisibleAnswers()).toBe(2);
		console.log('✅ 2 FAQs remain open after closing one');
	});

	test('FAQ components have correct data attributes and structure', async ({ page }) => {
		console.log('\n🧪 Testing FAQ component structure and attributes');

		// Check that each FAQ has the correct data-index
		for (let i = 1; i <= 3; i++) {
			const faqContainer = page.locator(`[data-index="${i}"]`);
			await expect(faqContainer).toBeVisible();
			console.log(`✅ FAQ ${i} has correct data-index="${i}"`);
		}

		// Check button text content
		await expect(page.getByTestId('faq-1-toggle')).toHaveText('Question 1 +');
		await expect(page.getByTestId('faq-2-toggle')).toHaveText('Question 2 +');
		await expect(page.getByTestId('faq-3-toggle')).toHaveText('Question 3 +');
		console.log('✅ All FAQ buttons have correct text');

		// Check answer content when opened
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toHaveText('Answer 1');
		console.log('✅ FAQ answer content is correct');
	});

	test('FAQ styling classes are applied correctly', async ({ page }) => {
		console.log('\n🧪 Testing FAQ CSS classes');

		// Check that closed state has correct classes
		const answer1 = page.getByTestId('faq-1-answer');
		await expect(answer1).toHaveClass(/faq-closed:hidden/);
		await expect(answer1).toHaveClass(/faq-open:block/);
		console.log('✅ FAQ has correct CSS classes for open/closed states');

		// Open FAQ and verify styling
		await page.getByTestId('faq-1-toggle').click();
		// The answer should now be visible due to faq-open:block class
		await expect(answer1).toBeVisible();
		console.log('✅ FAQ styling works correctly when opened');
	});

	test('Each FAQ manages its own scoped state independently', async ({ page }) => {
		console.log('\n🧪 Testing scoped state independence');

		// Test that each FAQ can be toggled independently
		// Open FAQ 1
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();

		// Toggle FAQ 1 multiple times while keeping others in different states
		await page.getByTestId('faq-2-toggle').click(); // Open FAQ 2
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();

		// Close FAQ 1, FAQ 2 should stay open
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeHidden();
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();

		// Reopen FAQ 1, FAQ 2 should still be open
		await page.getByTestId('faq-1-toggle').click();
		await expect(page.getByTestId('faq-1-answer')).toBeVisible();
		await expect(page.getByTestId('faq-2-answer')).toBeVisible();

		console.log('✅ Each FAQ maintains independent scoped state');
	});
});
