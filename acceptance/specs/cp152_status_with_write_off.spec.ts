import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice that is only cleared because the rest was written off is SETTLED, not PAID, so it can
// be told apart from an invoice paid in full. One that still has something owing after a part
// write-off stays PARTIAL. An invoice cleared by payments and credit notes is still PAID.
test.describe('status with write-off', () => {
  test('a write-off of the remainder settles the invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        // 40 paid, the other 60 written off: cleared, but not paid in full.
        { id: 1, projectId: 1, status: 'SENT', writeOff: 60, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] },
        // 20 paid, 30 written off: 50 still owed.
        { id: 2, projectId: 1, status: 'SENT', writeOff: 30, lineItems: [{ id: 2, description: 'Work', qty: 1, unitPrice: 100 }] },
        // 40 paid, 60 credited: paid in full.
        { id: 3, projectId: 1, status: 'SENT', lineItems: [{ id: 3, description: 'Work', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' },
        { id: 2, invoiceId: 2, amount: 20, date: '2026-02-01' },
        { id: 3, invoiceId: 3, amount: 40, date: '2026-02-01' },
      ],
      creditNotes: [{ id: 1, invoiceId: 3, amount: 60, date: '2026-02-02' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SETTLED');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('PARTIAL');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('writing off what is left on a part-paid invoice settles it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 70, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('invoice-partial-write-off-amount').fill('30');
    await page.getByTestId('invoice-partial-write-off-submit').click();
    await expect(page.getByTestId('invoice-status')).toHaveText('SETTLED');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SETTLED');
  });
});
