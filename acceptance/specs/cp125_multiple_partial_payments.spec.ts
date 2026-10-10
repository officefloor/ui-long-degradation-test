import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Several part payments can be recorded against one invoice over time, and the remaining balance is
// always correct. A part payment recorded wrongly can be corrected — its amount changed or the
// payment deleted — and what is left and the status follow the correction.
test.describe('multiple partial payments', () => {
  test('tracks the balance across several part payments', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-02-01' },
        { id: 2, invoiceId: 1, amount: 120, date: '2026-02-10' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$80.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PARTIAL');
  });

  test('a wrong part payment can be deleted or changed', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-02-01' },
        { id: 2, invoiceId: 1, amount: 120, date: '2026-02-10' },
      ],
    });
    page.on('dialog', (d) => d.accept()); // accept a "are you sure?" prompt if the app asks one
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // The 120 was recorded by mistake: delete it. 300 - 100 = 200 left, still part paid.
    await page.getByTestId('payment-delete-2').click();
    await expect(page.getByTestId('payment-row-2')).toHaveCount(0);
    await expect(page.getByTestId('payment-row-1')).toBeVisible();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PARTIAL');

    // The 100 should have been 300: correct it, and the invoice is paid in full.
    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('payment-edit-1').click();
    await page.getByTestId('payment-edit-amount').fill('300');
    await page.getByTestId('payment-edit-save').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$300.00');
    await expect(page.getByTestId('invoice-status')).toHaveText('PAID');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });
});
