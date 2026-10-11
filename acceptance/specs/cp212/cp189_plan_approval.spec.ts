import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; approval is judged on the grand total again, so the plan
// test is replaced by one of that. Carries none of the earlier tests.
// There are no instalment plans: approval is judged on an invoice's grand total.
test.describe('plans judged on their total', () => {
  test('approval is judged on the grand total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      settings: { approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 980 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 1020 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });
});
