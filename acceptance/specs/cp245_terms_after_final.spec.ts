import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client one of whose invoices had its final notice in the last 90 days gets at most 7 days'
// terms on an invoice sent now (as for a high-risk client), however the final notice ended.
test.describe('short terms after a final notice', () => {
  test('a client given a final notice in the last 90 days gets at most 7 days', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          reminders: ['2026-03-11', '2026-04-01', '2026-05-01'],
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-05-15', creditOf: 1,
          lineItems: [{ id: 2, description: 'Audit', qty: 1, unitPrice: 400, creditOfLine: 1 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2025-11-01', dueDate: '2025-12-01',
          reminders: ['2025-12-11', '2026-01-01', '2026-02-01'],
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-02-15', creditOf: 4,
          lineItems: [{ id: 5, description: 'Audit', qty: 1, unitPrice: 400, creditOfLine: 4 }] },
        { id: 6, clientId: 2, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 6, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    // Acme's final notice went out on 2026-05-01, 40 days ago (the invoice was later credited)
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('LOW');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-06-17');
    // Globex's was on 2026-02-01, 129 days ago: the usual end of next month
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-6').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-due')).toHaveText('2026-07-31');
  });
});
