import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice can offer an early-payment discount: pay within the set number of days and a reduced
// amount applies. The invoice shows the reduced amount available for early settlement.
test.describe('early-payment discount', () => {
  test('shows the reduced early-payment amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', earlyPaymentPct: 5, earlyPaymentDays: 10,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-early-pay-amount')).toHaveText('$190.00'); // 200 less 5%
  });
});
