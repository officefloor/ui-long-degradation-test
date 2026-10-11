import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): a high-risk client's invoice now needs
// two approvals, so Globex's draft carries both; the terms rule is unchanged. Carries the test.
// When an invoice is sent, a MEDIUM-risk client's due date is at most 21 days after the issue date
// and a HIGH-risk client's at most 7 days, in place of whatever their terms would give when that is
// later; shorter terms are kept. LOW-risk clients keep their usual terms.
test.describe('shorter terms for risky clients', () => {
  test('gives risky clients less time to pay', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 30 },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
        { id: 4, name: 'Hooli', email: 'ap@hooli.example', termsDays: 10 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2025-11-01', dueDate: '2025-11-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 400 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          approvedTotal: 400, approvedOn: '2026-03-10', approvals: 2,
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 400 }] },
        { id: 5, clientId: 3, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 400 }] },
        { id: 6, clientId: 4, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          lineItems: [{ id: 6, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 7, clientId: 4, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 7, description: 'Build', qty: 1, unitPrice: 400 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-01-10', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 2, amount: 100, date: '2026-01-04', allocations: [{ invoiceId: 2, amount: 100 }] },
        { id: 3, clientId: 2, amount: 120, date: '2026-03-05', allocations: [], reference: 'INV-0000042' },
        { id: 4, clientId: 4, amount: 100, date: '2026-01-10', allocations: [{ invoiceId: 6, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // Acme has one invoice paid 10 days late (10.0, MEDIUM): at most 21 days instead of the end of next month
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('MEDIUM');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-03-31');
    // Globex has one paid 35 days late (35.0, HIGH): at most 7 days, not its 30-day terms
    // (the draft is approved and its 30% deposit is held)
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-03-17');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$280.00'); // 400.00 less the 120.00 deposit
    // a LOW client keeps the usual terms
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('2026-04-30');
    // terms shorter than the cap are kept: Hooli is MEDIUM with 10-day terms
    await page.getByTestId('client-row-4').click();
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-7').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-due')).toHaveText('2026-03-20');
  });
});
