import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp04 (mutates: [3]): each line is now rounded to the cent before the lines are added,
// so the fractional-quantity invoice totals $25.26 instead of $25.25. Carries both tests.
// Clicking a client lists that client's invoices with their status, total and due date. An
// invoice's total is the sum of its lines' quantity x unit price, each rounded half up to
// the cent per line, then added.
test.describe('client invoices', () => {
  test("lists only the selected client's invoices", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }, { id: 2, description: 'Hosting', qty: 1, unitPrice: 10 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Copywriting', qty: 3, unitPrice: 20 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-03-02', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-list')).toBeVisible();
    await expect(page.getByTestId(/^invoice-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-row-3')).toHaveCount(0);
    const inv1 = page.getByTestId('invoice-row-1');
    await expect(inv1.getByTestId('invoice-status')).toHaveText('Sent');
    await expect(inv1.getByTestId('invoice-total')).toHaveText('$100.00'); // 2 x 45 + 1 x 10 = 100
    await expect(inv1.getByTestId('invoice-due')).toHaveText('2026-04-30');
    const inv2 = page.getByTestId('invoice-row-2');
    await expect(inv2.getByTestId('invoice-status')).toHaveText('Draft');
    await expect(inv2.getByTestId('invoice-total')).toHaveText('$60.00'); // 3 x 20 = 60

    await page.getByTestId('client-row-2').click();
    await expect(page.getByTestId(/^invoice-row-\d+$/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-total')).toHaveText('$500.00'); // 1 x 500
  });

  test('totals an invoice from its fractional-quantity lines', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Support', qty: 1.25, unitPrice: 10.10 },
            { id: 2, description: 'Support call', qty: 1.25, unitPrice: 10.10 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 1.25 x 10.10 = 12.625 -> 12.63 per line; 12.63 + 12.63 = 25.26
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$25.26');
  });
});
