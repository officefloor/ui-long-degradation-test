import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice with something due can be put in dispute with the Dispute button
// (invoices[].disputedOn, today), writing INVOICE_DISPUTED id=<id> amount=<amount due>; a draft, or
// an invoice with nothing due, can't. While in dispute its status is "Disputed", it earns no late
// interest (interest up to the dispute date stays), it is left out of the client's overdue amount
// but still in their balance, it takes no payment (one made while it is open is refused) and
// automatic payments and Apply credit pass over it. Resolve ends the dispute
// (invoices[].disputeResolvedOn, today; DISPUTE_RESOLVED id=<id>): interest starts again from that
// day on what is still owed, and its status is worked out as usual.
test.describe('disputes', () => {
  test('puts an overdue invoice in dispute', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,017.82');
    await page.getByTestId('invoice-dispute').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    // 1,000.00 and the interest so far
    await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount=1017.82');
    // still owed, but no longer overdue
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,017.82');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    // it takes no payment while in dispute
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    // a draft can't be disputed
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-dispute').click();
    await expect(page.getByTestId('invoice-dispute-error')).toBeVisible();
  });

  test('an invoice in dispute earns no interest and payments pass it by', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-20',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 5, description: 'Support', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // interest ran from the end of grace (2026-03-08) until the dispute on 2026-04-01: 24 days, then stopped
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$8.03');
    await page.getByTestId('client-row-1').click();
    // paid with no invoice open: the overdue invoice 4 first (100.00 and its interest), the rest on
    // invoice 5; the disputed invoice 3 is LASTWORD
    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Disputed');
    // resolving it makes it overdue again, with interest from today
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-resolve').click();
    await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=3');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$8.03');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,008.03');
  });
});
