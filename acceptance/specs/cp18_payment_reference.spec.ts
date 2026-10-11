import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each invoice has an ISO 11649 payment reference built from the seven digits of its number,
// leading zeros kept (INV-0000075 -> 0000075): check digits = 98 - (digits + 'RF00', letters as
// A=10 .. Z=35, mod 97), two digits; the reference is RF + check digits + digits, shown in groups of
// four. A payment may quote a reference, ignoring spaces and capitals: one that fails the check
// (first four characters moved to the end, letters converted, mod 97 must be 1) is mistyped, and a
// valid one for a different invoice is refused too. The payment shows the reference it quoted.
// References computed with acceptance/reference/algorithms.py rf_reference / rf_valid.
test.describe('payment reference', () => {
  test("shows each invoice's RF reference", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 4096, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 25 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF16 0000 075'); // from INV-0000075
    await page.getByTestId('invoice-row-123').click();
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF65 0001 230'); // from INV-0001230
    await page.getByTestId('invoice-row-4096').click();
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF67 0040 964'); // from INV-0040964
  });

  test("records a payment quoting the invoice's reference", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 80 }] },
      ],
      payments: [
        { id: 3, clientId: 1, amount: 20, date: '2026-03-03', reference: 'RF24 0000 125', allocations: [{ invoiceId: 12, amount: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-12').click();
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF24 0000 125'); // from INV-0000125
    await expect(page.getByTestId('payment-row-3').getByTestId('payment-reference')).toHaveText('RF24 0000 125');

    await page.getByTestId('payment-form-amount').fill('30');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('rf2400 00125');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-row-4').getByTestId('payment-reference')).toHaveText('RF24 0000 125');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$50.00'); // 20.00 + 30.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$30.00'); // 80.00 - 50.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });

  test("refuses a mistyped reference or another invoice's reference", { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-12').click();
    // 'RF24 0000 152' swaps the last two digits and fails the mod-97 check; 'RF16 0000 075' is valid
    // but is invoice 7's reference.
    for (const reference of ['RF24 0000 152', 'RF16 0000 075']) {
      await page.getByTestId('payment-form-amount').fill('30');
      await page.getByTestId('payment-form-date').fill('2026-03-09');
      await page.getByTestId('payment-form-reference').fill(reference);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
      await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(0);
    }
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00');
  });
});
