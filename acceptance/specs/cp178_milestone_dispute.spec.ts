import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A reached milestone can be disputed with its row's Dispute action (milestones[].disputedOn,
// today), writing INVOICE_DISPUTED id=<invoice id> amount=<what the milestone owes>. A disputed
// milestone shows Disputed, earns no interest from that day, is not overdue (nor in the client's
// overdue amount) and takes no payment: payments go to the other reached milestones. The panel
// shows the amount in dispute, and the invoice is Disputed when nothing else is owed. Resolve
// clears it, and the interest held back is owed as for any dispute.
test.describe('disputing a milestone', () => {
  test('disputes a reached milestone', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-06-30',
          milestones: [
            { id: 1, description: 'Design', pct: 40, reachedOn: '2026-03-01' },
            { id: 2, description: 'Build', pct: 40, reachedOn: '2026-04-20' },
            { id: 3, description: 'Handover', pct: 20 },
          ],
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 5000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('milestone-row-1').getByTestId('milestone-dispute').click();
    // the overdue design milestone (2,000.00 and its 26.17 of interest) is in dispute
    await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount=2026.17');
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Disputed');
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$2,026.17');
    // the build milestone is still due but not yet overdue
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    // a payment goes to the build milestone, passing the disputed one
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('$2,000.00');
    await page.getByTestId('payment-form-amount').fill('2000.00');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$2,026.17');
  });

  test('a disputed milestone earns no interest until it is resolved', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-06-30',
          milestones: [
            { id: 4, description: 'Design', pct: 40, reachedOn: '2026-03-01', disputedOn: '2026-04-01' },
            { id: 5, description: 'Build', pct: 60 },
          ],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 5000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // in dispute since 2026-04-01: interest ran from 2026-03-22 for 10 days only
    await expect(page.getByTestId('invoice-interest')).toHaveText('$6.68');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
    await page.getByTestId('invoice-resolve').click();
    // resolved: the interest held back is owed, 39 days in all, and it is overdue again
    await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$26.17');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });
});
