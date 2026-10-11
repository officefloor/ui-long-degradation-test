import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A reached milestone falls due the client's terms (clients[].termsDays) after the day it was
// reached, or 14 days when they have none, shown on its row. It is overdue once its grace period
// has passed with something unpaid, earning late interest on its unpaid amount from then by the
// usual rule; the invoice is Overdue while any milestone is, the client's overdue amount counts the
// overdue milestones with their interest, payments pay reached milestones by due date (then id),
// each milestone's amount and then its interest, and the invoice list shows the due date of the
// next milestone with something owing.
test.describe('milestone due dates', () => {
  test('each reached milestone falls due on its own', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 30 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-06-30',
          milestones: [
            { id: 1, description: 'Design', pct: 40, reachedOn: '2026-03-01' },
            { id: 2, description: 'Build', pct: 40, reachedOn: '2026-04-20' },
            { id: 3, description: 'Handover', pct: 20 },
          ],
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 5000 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-06-30',
          milestones: [
            { id: 4, description: 'Design', pct: 40, reachedOn: '2026-03-25' },
            { id: 5, description: 'Build', pct: 60 },
          ],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 5000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // reached 2026-03-01, due 14 days later; past its grace week since 2026-03-22: 39 days of interest
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-due')).toHaveText('2026-03-15');
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Overdue');
    // reached 2026-04-20: due 2026-05-04, not yet overdue
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-due')).toHaveText('2026-05-04');
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('Due');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$26.17');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-03-15');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$2,026.17');
    // paying the first milestone and its interest leaves the second, due 2026-05-04
    await page.getByTestId('payment-form-amount').fill('2026.17');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-05-04');
    // a client with 30-day terms: reached 2026-03-25, due 2026-04-24, still in its grace week
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-due')).toHaveText('2026-04-24');
    await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('Due');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
  });
});
