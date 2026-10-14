import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// combined = influence + synergy. With no patrons, clout is 0 so influence = effective = momentum
// (everyone active).
//   influence(=momentum): Dana 33, Ravi 8, Uma 100
//   synergy: Dana 114, Ravi 12, Uma 12
//   combined: Dana 147, Ravi 20, Uma 112

test.describe('combined', () => {
  test('combined is influence plus synergy', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  allies: [
    { a: 1, b: 2 },
    { a: 1, b: 3 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('20');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-combined')).toHaveText('112');
  });
});
