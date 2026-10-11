import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When an invoice is written off, by hand or after collections, its debit adjustment notes still
// owing are written off the same day, each writing INVOICE_WRITTEN_OFF id=<note id> amount=<amount>
// and counted in the risk score as paid that day.
test.describe("an invoice's notes go with it", () => {
  test('writing an invoice off writes off its notes too', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-31', adjustmentOf: 1,
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          reminders: ['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-01'],
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-04-20', dueDate: '2026-05-04', adjustmentOf: 4,
          lineItems: [{ id: 5, description: 'Extra', qty: 1, unitPrice: 60 }] },
        { id: 6, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 6, description: 'Support', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-write-off').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount=550.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=2 amount=110.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Written off');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$55.00');
    // both count as paid today: 71 and 10 days late
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('71.0');
    // so Acme is HIGH and its draft needs two approvals
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // Globex's invoice went with collections; its note went with it on 2026-05-31
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Written off');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$66.00');
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('$0.00');
  });
});
