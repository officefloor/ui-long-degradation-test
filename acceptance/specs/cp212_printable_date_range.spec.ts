import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The printable statement matches the chosen date range and shows the aged breakdown.
test.describe('printable statement range', () => {
  test('prints the in-range total with an aged breakdown', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-06', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await page.getByTestId('statement-range-from').fill('2026-02-01');
    await page.getByTestId('statement-range-to').fill('2026-02-28');
    await page.getByTestId('statement-range-apply').click();

    await expect(page.getByTestId('statement-print-view')).toBeVisible();
    await expect(page.getByTestId('statement-grand-total')).toHaveText('$300.00');
    await expect(page.getByTestId('statement-print-current')).toHaveText('$100.00');
    await expect(page.getByTestId('statement-print-30-60')).toHaveText('$200.00');
  });
});
