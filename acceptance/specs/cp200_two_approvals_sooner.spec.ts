import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Two approvals are now needed for a draft whose grand total (or plan total) is more than one and a
// half times the approval limit, instead of twice, and for every invoice of a HIGH-risk client.
test.describe('two approvals sooner', () => {
  test('two approvals from one and a half times the limit, and for high-risk clients', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { approvalLimit: 1000 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1600 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1400 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Hosting', qty: 1, unitPrice: 80 }] },
      ],
      payments: [
        { id: 1, clientId: 2, amount: 100, date: '2026-02-25', allocations: [{ invoiceId: 3, amount: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 1,600.00 is more than one and a half times the 1,000.00 limit (but not twice it)
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 1 more approval');
    // 1,400.00 is not: one approval
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // Globex paid 25 days late (HIGH): even 80.00 takes two approvals
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
  });
});
