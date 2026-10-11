import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED tax-liability spec: carries the tax collected over a period forward, and the liability now
// takes account of any tax adjustments recorded in the period (60 collected - 10 adjusted = 50).
test.describe('tax liability', () => {
  test('totals tax collected in the period', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', taxPct: 20, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-summary-from').fill('2026-02-01');
    await page.getByTestId('tax-summary-to').fill('2026-02-28');
    await page.getByTestId('tax-summary-apply').click();
    await expect(page.getByTestId('tax-liability-total')).toHaveText('$60.00');
  });

  test('nets a recorded adjustment into the liability', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', taxPct: 20, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
      taxAdjustments: [{ id: 1, amount: -10, date: '2026-02-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-summary-from').fill('2026-02-01');
    await page.getByTestId('tax-summary-to').fill('2026-02-28');
    await page.getByTestId('tax-summary-apply').click();
    await expect(page.getByTestId('tax-liability-total')).toHaveText('$50.00');
  });
});
