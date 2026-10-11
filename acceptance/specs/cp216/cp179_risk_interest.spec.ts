import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp216 (mutates: [179]): a HIGH-risk client now has no grace period, so the two HIGH
// clients' invoices earn interest from their due date, 2026-03-01 (60 days), instead of from
// 2026-03-08; the client with no history keeps its grace week. Carries the test.
// A HIGH-risk client's late interest rate is 3 percentage points above the rate that would
// otherwise apply (on invoices and milestones), still capped by their region's legal maximum, and
// runs from the due date: a HIGH-risk client has no grace period. The band used for an invoice is
// the one its client's other invoices give, so an invoice's own late payment never raises its own
// rate.
test.describe('higher interest for high-risk clients', () => {
  test('high-risk clients pay three points more late interest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, regionMaxInterest: { NY: 13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY' },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-11-01', dueDate: '2025-11-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2025-11-01', dueDate: '2025-11-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 5, clientId: 3, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 101.31, date: '2026-01-15',
          allocations: [{ invoiceId: 1, amount: 101.31 }] },
        { id: 2, clientId: 2, amount: 101.31, date: '2026-01-15',
          allocations: [{ invoiceId: 2, amount: 101.31 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // 12% + 3 = 15% on 1,000.00 from its due date, 2026-03-01, with no grace for a HIGH client: 60 days
    await expect(page.getByTestId('invoice-interest')).toHaveText('$25.31');
    // in New York the legal maximum of 13% still caps it
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$21.90');
    // a client with no history pays the usual 12%
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('$1,017.82');
  });
});
