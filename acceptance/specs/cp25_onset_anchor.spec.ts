import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Dates (deterministic): the sheet has an anchor date (seeded at top level `anchor`); each person has
// an onset date. Both are shown as YYYY-MM-DD at `sheet-anchor` and `person-onset`.
test.describe('onset and anchor', () => {
  test('shows the sheet anchor and each onset', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2020-01-31',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10, onset: '2020-01-01' },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5,  onset: '2020-01-24' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('sheet-anchor')).toHaveText('2020-01-31');
    await expect(page.getByTestId('person-row-1').getByTestId('person-onset')).toHaveText('2020-01-01');
    await expect(page.getByTestId('person-row-2').getByTestId('person-onset')).toHaveText('2020-01-24');
  });
});
