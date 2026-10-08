import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): clients grouped into revenue bands.
test.describe('segment by revenue', () => {
  test('counts clients in each revenue band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Big', email: 'a@ex.example' },
        { id: 2, name: 'Small', email: 'b@ex.example' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 9000 }] },
        { id: 2, projectId: 2, status: 'PAID', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('revenue-bands-open').click();
    await expect(page.getByTestId('revenue-band-row-high').getByTestId('revenue-band-count')).toHaveText('1');
    await expect(page.getByTestId('revenue-band-row-low').getByTestId('revenue-band-count')).toHaveText('1');
  });
});
