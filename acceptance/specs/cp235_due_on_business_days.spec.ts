import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// With a holiday calendar, a due date set when an invoice is sent that falls on a Saturday, a
// Sunday or a holiday (as observed) moves to the next business day.
test.describe('due dates on business days', () => {
  test('a due date on a weekend moves to the next business day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-09-15',
      settings: { taxRate: 10, holidays: ['2026-11-30'] },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-09-14', dueDate: '2026-10-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-09-14', dueDate: '2026-10-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=550.00');
    // the end of next month, Saturday 2026-10-31, moves to Monday 2026-11-02
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-11-02');
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF03 0000 018');
    // 10 business days already end on a business day: Tuesday 2026-09-29
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-09-29');
  });

  test('a due date on a holiday moves to the next business day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-10-14',
      settings: { taxRate: 10, holidays: ['2026-11-30'] },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-10-13', dueDate: '2026-11-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    // the end of next month, Monday 2026-11-30, is a holiday: due Tuesday 2026-12-01
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-12-01');
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000034');
  });
});
