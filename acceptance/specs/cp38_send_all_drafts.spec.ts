import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Send all drafts sends every draft of the selected client that has at least one line, lowest id
// first, exactly as sending each one by hand would (dates, audit line); drafts with no lines stay
// drafts, and other clients' drafts are untouched.
test.describe('send all drafts', () => {
  test("sends every one of the client's drafts that has lines", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 30 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 20 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-02-15', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 50 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-02-20', dueDate: '2026-03-31', lineItems: [] },
        { id: 6, clientId: 2, status: 'DRAFT', issueDate: '2026-02-20', dueDate: '2026-03-31',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-send-all').click();

    for (const id of [3, 4]) {
      const row = page.getByTestId(`invoice-row-${id}`);
      await expect(row.getByTestId('invoice-status')).toHaveText('Sent');
      await expect(row.getByTestId('invoice-issue')).toHaveText('2026-03-10');
      await expect(row.getByTestId('invoice-due')).toHaveText('2026-04-09'); // 2026-03-10 + 30 days' terms
    }
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-issue')).toHaveText('2026-02-01');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([
      'INVOICE_SENT id=3 number=INV-0000034 total=100.00',
      'INVOICE_SENT id=4 number=INV-0000042 total=50.00',
    ]);
    await page.getByTestId('client-row-2').click();
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('Draft');
  });
});
