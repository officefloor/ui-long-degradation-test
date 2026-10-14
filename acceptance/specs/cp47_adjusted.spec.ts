import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// adjusted = combined + quality (quality treated as 0 when the person has no notes). With no patrons
// and no allies, combined = momentum.
//   combined: Dana 33, Ravi 8, Uma 100 ; quality: 20, 5, 0 -> adjusted 53, 13, 100

test.describe('adjusted', () => {
  test('adjusted is combined plus quality', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  notes: [
    { personId: 1, score: 10 }, { personId: 1, score: 20 }, { personId: 1, score: 30 },
    { personId: 2, score: 5 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-adjusted')).toHaveText('53');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-adjusted')).toHaveText('13');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-adjusted')).toHaveText('100');
  });
});
