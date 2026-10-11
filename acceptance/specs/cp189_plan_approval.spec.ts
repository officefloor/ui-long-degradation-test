import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A draft with an instalment plan is judged for approval on the plan total (with its interest and
// plan fee) instead of the grand total, and an approval of it is for that plan total
// (INVOICE_APPROVED total=<plan total>); changing the plan changes the amount to approve.
test.describe('plans judged on their total', () => {
  test('an instalment plan is judged on what it will collect', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      settings: { approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 980 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 980 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed'); // 980.00 is within the limit
    await page.getByTestId('plan-form-count').fill('6');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-submit').click();
    // 980 x 0.01 / (1 - 1.01^-6) = 169.10, rounded up to 170.00 a month: the plan collects more than 1,000.00
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,014.46');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=1014.46');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // an interest-free plan collects just the 980.00
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('plan-form-count').fill('2');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });
});
