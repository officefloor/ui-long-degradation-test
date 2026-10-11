import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each client row shows a payment risk score and band: the days each invoice paid in full took to
// pay (the paid date less the issue date), averaged oldest payment first with weight 0.3 (first
// value, then 0.3 x next + 0.7 x average), to one decimal half up; LOW under 15, MEDIUM under 30,
// HIGH from 30. Part-paid invoices, credit notes and invoices cleared without payment don't count;
// a client with no invoice paid in full shows "-" and LOW. Every invoice of a HIGH client needs
// approval before it can be sent, whatever its total.
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

    // oldest payment first: invoice 1 took 20 days, invoice 2 40 and invoice 3 30:
    // 20, then 0.3 x 40 + 0.7 x 20 = 26, then 0.3 x 30 + 0.7 x 26 = 27.2 (in invoice order it would be
    // 40, 34, 32.8; the plain average 30.0)
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('27.2');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('MEDIUM');
    // a client who has paid nothing yet has no score
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('-');
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('LOW');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // invoice 4 issued 2026-01-19 is paid today, after 50 days: 0.3 x 50 + 0.7 x 27.2 = 34.04
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('34.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    // every invoice of a high-risk client needs approval, however small
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
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

    // invoice 1 was paid in 10 days; 2 is only part paid and 3 was cleared by a credit note
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('10.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('LOW');
  });
});
