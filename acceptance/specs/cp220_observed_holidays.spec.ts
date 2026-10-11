import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A listed holiday that falls on a Saturday is observed on the Friday before it, and one on a
// Sunday on the Monday after it: that weekday is not a business day, for every count of business
// days (terms, grace, the early-payment window, milestones, approvals and dunning).
test.describe('holidays on weekends', () => {
  test('a holiday on a weekend is observed on the nearest weekday', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-30',
      settings: { taxRate: 10, holidays: ['2026-07-04', '2026-07-12'] },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 5 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-06-29', dueDate: '2026-07-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-06-29', dueDate: '2026-07-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    // Saturday 2026-07-04 is observed on Friday 2026-07-03: 5 business days from Tuesday 2026-06-30 run
    // Wednesday, Thursday, then Monday to Wednesday 2026-07-08
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-07-08');
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    // and Sunday 2026-07-12 on Monday 2026-07-13: 10 business days end on Thursday 2026-07-16
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-07-16');
  });

  test('grace skips an observed holiday', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-07-08',
      settings: { taxRate: 10, lateInterestRate: 12, holidays: ['2026-07-04'] },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', graceDays: 3 }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-06-02', dueDate: '2026-07-02',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // due Thursday 2026-07-02: 3 business days of grace are Monday 2026-07-06 to Wednesday 2026-07-08
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
  });
});
