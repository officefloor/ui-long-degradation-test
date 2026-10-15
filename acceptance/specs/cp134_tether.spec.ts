import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// tether
test.describe('tether', () => {
  test('tether is scaled minus cohesion', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, groupId: 1 },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, groupId: 1 },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, groupId: 2 },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, groupId: 2 },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, groupId: 3 },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, groupId: 3 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tether')).toHaveText('90');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tether')).toHaveText('130');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tether')).toHaveText('10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tether')).toHaveText('-10');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-tether')).toHaveText('735');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-tether')).toHaveText('-135');
  });
});
