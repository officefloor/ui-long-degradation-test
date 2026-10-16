import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cohesion
test.describe('cohesion', () => {
  test('cohesion is strength over size', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      // Ann's beta was 10 until 2026-02-01; Fia's change is dated after the anchor and does not count yet
      history: [
        { personId: 1, field: 'beta', value: 20, from: '2026-02-01' },
        { personId: 6, field: 'beta', value: 70, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 10, gamma: 5, active: true, groupId: 1 },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, groupId: 1 },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, groupId: 2 },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, groupId: 2 },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, groupId: 3 },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, groupId: 3 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('110');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-cohesion')).toHaveText('50');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-cohesion')).toHaveText('165');

    // as of 2026-01-15, before Ann's beta change: her beta was 10, momentum 50
    //   North cohesion (50 + 120)/2 = 85
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('85');
  });
});
