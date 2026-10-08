import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Aging is worked out from each invoice's due date — derived from the client's payment terms when
// no explicit due date is set.
test.describe('aging by due date', () => {
  test('ages against the terms-derived due date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 30 }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-25', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('aging-current')).toHaveText('$100.00');
    await expect(page.getByTestId('aging-30-60')).toHaveText('$200.00');
  });
});
