import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// One search box looks across both clients and projects, showing matches grouped by kind.
test.describe('global search', () => {
  test('finds matching clients and projects', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Acme Website', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 2 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('global-search').fill('acme');

    await expect(page.getByTestId('search-clients').getByTestId(/^client-row-/)).toHaveCount(1);
    await expect(page.getByTestId('search-clients').getByTestId('client-row-1').getByTestId('client-name')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('search-jobs').getByTestId(/^job-row-/)).toHaveCount(1);
    await expect(page.getByTestId('search-jobs').getByTestId('job-row-1').getByTestId('job-name')).toHaveText('Acme Website');
  });
});
