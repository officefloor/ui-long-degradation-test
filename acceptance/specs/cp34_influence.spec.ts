import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// influence = effective + clout.
//   Uma 100+0=100, Ivo 60+0=60, Dana 133+100=233, Kai 82+193=275
const SEED = {
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
  ],
};

test.describe('influence', () => {
  test('influence is effective plus clout', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-influence')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-influence')).toHaveText('60');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('233');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('275');
  });
});
