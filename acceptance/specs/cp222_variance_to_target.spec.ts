import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows how far billings are ahead of or behind the target.
test.describe('variance to target', () => {
  test('shows billings variance against the target', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      settings: { billingTarget: 10000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-10', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 8000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('target-variance')).toHaveText('-$2,000.00');
  });
});
