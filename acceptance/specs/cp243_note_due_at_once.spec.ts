import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A debit adjustment note on an invoice that is overdue when it is issued is due the day it is
// issued and has no grace period: it is overdue from the next day and earns late interest from its
// due date. Notes on other invoices keep the usual terms.
test.describe('notes on overdue invoices', () => {
  test('a note on an overdue invoice is due at once, with no grace', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 30 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-01', adjustmentOf: 1,
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 300 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-19',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // issued and due on 2026-06-01 with its invoice already overdue: overdue the next day, 330.00 earning
    // interest from 2026-06-01
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.99');
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Travel');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('80');
    await page.getByTestId('line-form-submit').click();
    // a new note on the overdue invoice is due today rather than in 30 days
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-06-10');
    // on an invoice that is not overdue the usual terms apply
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('line-form-description').fill('Copy');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('40');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('2026-07-10');
  });
});
