import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp08 (mutates: [5]): a new draft is now due on the last day of the following month
// (2026-04-30 for one issued 2026-03-10) instead of 30 days later. Carries both tests.
// Clicking an invoice opens it in the invoice panel on the same screen: its status, its lines
// (description, quantity as entered, unit price, amount), subtotal and grand total. New invoice
// creates an empty draft for the selected client, issued today and due on the last day of the next
// month, with the next id after the highest invoice id, lists it and opens it.
test.describe('invoice panel', () => {
  test('opens an invoice with its lines and totals', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 45 },
            { id: 2, description: 'Hosting', qty: 1.5, unitPrice: 12.35 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    const l1 = page.getByTestId('line-row-1');
    await expect(l1.getByTestId('line-description')).toHaveText('Design');
    await expect(l1.getByTestId('line-qty')).toHaveText('2');
    await expect(l1.getByTestId('line-unit-price')).toHaveText('$45.00');
    await expect(l1.getByTestId('line-amount')).toHaveText('$90.00'); // 2 x 45.00
    const l2 = page.getByTestId('line-row-2');
    await expect(l2.getByTestId('line-qty')).toHaveText('1.5');
    await expect(l2.getByTestId('line-unit-price')).toHaveText('$12.35');
    await expect(l2.getByTestId('line-amount')).toHaveText('$18.53'); // 1.5 x 12.35 = 18.525 -> 18.53
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$108.53'); // 90.00 + 18.53
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$108.53');
  });

  test('creates a draft for the selected client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 10 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Audit', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    // The highest invoice id is 4 (another client's), so the new one is 5.
    const row = page.getByTestId('invoice-row-5');
    await expect(row.getByTestId('invoice-status')).toHaveText('Draft');
    await expect(row.getByTestId('invoice-issue')).toHaveText('2026-03-10');
    await expect(row.getByTestId('invoice-due')).toHaveText('2026-04-30'); // last day of the month after March
    await expect(row.getByTestId('invoice-total')).toHaveText('$0.00');
    await expect(page.getByTestId(/^invoice-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$0.00');
  });
});
