import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the risk score now averages days late, so
// Acme's history is an invoice paid 8 days late (MEDIUM); the early-discount rule is unchanged.
// Carries the test.
// Only clients in the LOW risk band get the early-payment discount: a MEDIUM or HIGH client's
// invoices show no settle amount and are owed in full, however early they are paid. The band used
// for an invoice is the one the client's other invoices give.
test.describe('early discount for low-risk clients', () => {
  test('only low-risk clients get the early-payment discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', earlyPayPct: 2, earlyPayDays: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 110, date: '2026-01-08', allocations: [{ invoiceId: 1, amount: 110 }] },
      ],
    });
    await page.goto('/');

    // Acme paid an invoice 8 days late (8.0, MEDIUM): no early discount
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('MEDIUM');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,100.00');
    // Globex has no history (LOW): 2% of the 1,000.00 before tax comes off if paid now
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$1,080.00');
    await page.getByTestId('payment-form-amount').fill('1080.00');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$20.00');
  });
});
