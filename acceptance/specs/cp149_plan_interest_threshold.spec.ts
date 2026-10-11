import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The late interest threshold applies to invoices with an instalment plan too: until the late
// interest of all the plan's instalments adds up to the threshold, none of it is shown or owed (the
// instalments show $0.00 of late interest, and paying an instalment's own amount clears it); from
// then on all of it is owed as usual.
test.describe('interest threshold on plans', () => {
  test("an instalment plan's late interest waits for the threshold", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, interestThreshold: 5 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 10000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 341, date: '2026-02-27', allocations: [{ invoiceId: 1, amount: 341 }] },
        { id: 2, clientId: 2, amount: 3401, date: '2026-02-27',
          allocations: [{ invoiceId: 2, amount: 3401 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // instalment 2 (341.00, due 2026-03-31) has earned 2.62 since 2026-04-07: under 5.00, not charged
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Overdue');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$341.00');
    // paying the 341.00 clears the instalment
    await page.getByTestId('payment-form-amount').fill('341.00');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    // ten times the plan: 3,401.00 overdue earns 26.17, over the threshold, so it is all owed
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('$26.17');
    await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('$3,427.17');
  });
});
