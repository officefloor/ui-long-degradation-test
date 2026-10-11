import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Taking a disputed line off a sent invoice (a credit adjustment note) takes it out of the dispute;
// taking off the last disputed line resolves the dispute with credit (invoices[].disputeResolvedOn,
// disputeCredit; DISPUTE_RESOLVED id=<id>), so the interest held back while it was disputed is
// waived, as for any dispute resolved with a credit note.
test.describe('crediting disputed lines', () => {
  test('taking off the last disputed line resolves the dispute and waives the interest held back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          disputedOn: '2026-05-20',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200, disputed: true },
            { id: 3, description: 'Taxi', qty: 1, unitPrice: 50, disputed: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$275.00'); // 220.00 + 55.00
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    // the taxi is still in dispute
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$55.00');
    await page.getByTestId('line-row-3').getByTestId('line-remove').click();
    await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$0.00');
    // 1,375.00 earns interest from 2026-05-07 to the dispute on 2026-05-20, then only the build's
    // 1,100.00: nothing is charged for the disputed lines while they were in dispute
    await expect(page.getByTestId('invoice-interest')).toHaveText('$13.70');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,113.70');
    await page.getByTestId('payment-form-amount').fill('1113.70');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
  });

  test('a dispute resolved with credit owes no interest for its time in dispute', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          disputedOn: '2026-05-01', disputeResolvedOn: '2026-05-21', disputeCredit: true,
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          disputedOn: '2026-05-01', disputeResolvedOn: '2026-05-21',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    // resolved with a credit note: no interest for 2026-05-01 to 2026-05-21
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$7.36');
    // resolved without one: the interest held back is owed
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$12.54');
  });
});
