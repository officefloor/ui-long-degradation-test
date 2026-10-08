import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows the share of billings that has been collected.
test.describe('kpi collection rate', () => {
  test('shows collected over billed as a percentage', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 400 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 300, date: '2026-02-10' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-collection-rate')).toHaveText('75%');
  });
});
