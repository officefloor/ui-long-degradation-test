import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's statement groups the invoices under each job and shows a subtotal per job. The overall
// total owed is unchanged.
test.describe('statement grouped by job', () => {
  test('groups invoices by job with subtotals', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Support Retainer', clientId: 1 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
        { id: 3, projectId: 2, status: 'SENT', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-job-1').getByTestId('statement-job-subtotal')).toHaveText('$150.00');
    await expect(page.getByTestId('statement-job-2').getByTestId('statement-job-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$350.00');
  });
});
