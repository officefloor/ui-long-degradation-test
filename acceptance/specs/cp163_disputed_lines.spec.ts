import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// On a sent invoice a line's Dispute action (lineItems[].disputed) puts just those lines in dispute
// (invoices[].disputedOn, today), writing INVOICE_DISPUTED id=<id> amount=<disputed amount>. The
// panel shows the amount in dispute: the disputed lines' amounts after their share of the invoice
// discount, with their tax ($0.00 when nothing is disputed). From the dispute date that amount
// earns no interest and is not overdue (nor in the client's overdue amount), while the rest of the
// invoice is owed, overdue and paid as usual; once only the disputed amount is left the status is
// Disputed. Resolving the dispute makes the whole invoice owed again, earning interest from that
// day.
test.describe('disputing lines', () => {
  test('disputes only the lines the client queries', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01', discountPct: 5,
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-row-2').getByTestId('line-dispute').click();
    // the travel line after its 10.00 share of the discount, with its 10% tax: 190.00 + 19.00
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$209.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount=209.00');
    // the rest is still overdue
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,067.35');
    // paying everything that isn't in dispute leaves only the disputed lines
    await page.getByTestId('payment-form-amount').fill('1067.35');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$209.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
  });

  test('interest stops only on the disputed lines', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [
            { id: 3, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 4, description: 'Travel', qty: 1, unitPrice: 200, disputed: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // 1,200.00 earned interest from 2026-03-08 to the dispute on 2026-04-01 (24 days); since then only the
    // undisputed 1,000.00 has (29 days)
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$19.35');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-resolve').click();
    // resolved: the whole invoice is owed again; interest on the travel line starts again from today
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$19.35');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,219.35');
  });
});
