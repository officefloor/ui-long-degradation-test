import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED early-payment-discount spec (carries the reduced early-payment amount forward; the window
// now comes from the client's payment terms rather than a fixed day count on the invoice). The
// invoice is viewed inside that window (issued 2026-02-01, 10-day window, today 2026-02-05).
test.describe('early-payment discount', () => {
  test('shows the reduced early-payment amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-05',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 30, earlyPaymentWindowDays: 10 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', earlyPaymentPct: 5, issueDate: '2026-02-01',
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
