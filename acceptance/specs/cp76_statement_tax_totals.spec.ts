import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the statement and statement-by-job rules). The statement now also shows tax —
// per job and across the whole statement — alongside the amounts owed. Updated copies of the
// statement specs ship in the sibling override folder.
test.describe('statement tax totals', () => {
  test('shows tax per job and overall on the statement', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Support Retainer', clientId: 1 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', taxPct: 20, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', taxPct: 20, lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-project-1').getByTestId('statement-project-tax')).toHaveText('$20.00');
    await expect(page.getByTestId('statement-project-2').getByTestId('statement-project-tax')).toHaveText('$40.00');
    await expect(page.getByTestId('client-statement-tax-total')).toHaveText('$60.00');
  });
});
