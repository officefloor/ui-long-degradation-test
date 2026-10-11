import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the score now averages the days late
// (after the due date, 0 when on time) with weight 0.5, banded LOW under 5 days, MEDIUM under 15,
// so the client first scores 0.0 and then 5.0 (MEDIUM) instead of 27.2 and 34.0 (HIGH). Carries
// both tests.
// Each client row shows a payment risk score and band: the days late of each invoice paid in full
// (the paid date less the due date, 0 when paid by then), averaged oldest payment first with weight
// 0.5 (first value, then 0.5 x next + 0.5 x average), to one decimal half up; LOW under 5, MEDIUM
// under 15, HIGH from 15. Part-paid invoices, credit notes and invoices cleared without payment
// don't count; a client with no invoice paid in full shows "-" and LOW. Every invoice of a HIGH
// client needs approval before it can be sent, whatever its total.
test.describe('payment risk score', () => {
  test('scores how quickly a client pays', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-11-10', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2025-11-01', dueDate: '2026-01-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2026-01-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-01-19', dueDate: '2026-02-28',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 6, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 6, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2025-11-30', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 1, amount: 100, date: '2025-12-11', allocations: [{ invoiceId: 2, amount: 100 }] },
        { id: 3, clientId: 1, amount: 100, date: '2025-12-31', allocations: [{ invoiceId: 3, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // days late, oldest payment first: none of the three was late (0, 0, 0): a score of 0.0
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('0.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('LOW');
    // a client who has paid nothing yet has no score
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('-');
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('LOW');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // invoice 4 was due 2026-02-28 and is paid 10 days late: 0.5 x 10 + 0.5 x 0 = 5.0, MEDIUM from 5
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('5.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('MEDIUM');
    // only HIGH clients need approval whatever the size: this small invoice needs none
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test('only invoices paid in full count', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-01-05', dueDate: '2026-01-31', creditOf: 3,
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 100, creditOfLine: 3 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-01-11', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 1, amount: 60, date: '2026-03-01', allocations: [{ invoiceId: 2, amount: 60 }] },
      ],
    });
    await page.goto('/');

    // invoice 1 was paid before it was due (0 days late); 2 is only part paid and 3 was cleared by a credit note
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('0.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('LOW');
  });
});
