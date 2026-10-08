import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the early-payment-discount rule). The early-payment window comes from the
// client's payment terms rather than a fixed day count. An updated early-payment spec ships in the
// sibling override folder.
test.describe('early-payment window from terms', () => {
  test('uses the client terms for the early-payment offer', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
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

    await expect(page.getByTestId('invoice-early-pay-amount')).toHaveText('$190.00');
  });
});
