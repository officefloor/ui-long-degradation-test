import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cp121: groups entity + single membership
test.describe('groups', () => {
  test('people belong to one named group', { tag: '@core' }, async ({ page }) => {
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
    await page.getByTestId('nav-groups').click();

    await expect(page.getByTestId('group-row-1').getByTestId('group-name')).toHaveText('North');
    await expect(page.getByTestId('group-row-2').getByTestId('group-name')).toHaveText('South');
    await expect(page.getByTestId('group-row-3').getByTestId('group-name')).toHaveText('East');
    });

  test('each person shows their group', { tag: '@core' }, async ({ page }) => {
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
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-group')).toHaveText('North');
    await expect(page.getByTestId('person-row-2').getByTestId('person-group')).toHaveText('North');
    await expect(page.getByTestId('person-row-3').getByTestId('person-group')).toHaveText('South');
    await expect(page.getByTestId('person-row-4').getByTestId('person-group')).toHaveText('South');
    await expect(page.getByTestId('person-row-5').getByTestId('person-group')).toHaveText('East');
    await expect(page.getByTestId('person-row-6').getByTestId('person-group')).toHaveText('East');
  });
});
