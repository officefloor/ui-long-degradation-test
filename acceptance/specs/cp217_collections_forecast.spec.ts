import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A forecast of money expected in over the next 30 days, from what is due in that window.
test.describe('collections forecast', () => {
  test('totals what is due within 30 days', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-15', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-04-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('forecast-30day-total')).toHaveText('$200.00');
  });
});
