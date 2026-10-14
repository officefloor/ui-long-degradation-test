import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// quality = average of note scores rounded down. No notes -> 'n/a'.
//   Dana 60/3=20, Ravi 5/1=5, Uma none -> n/a

test.describe('quality', () => {
  test('quality averages notes and is n/a without notes', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
  ],
  notes: [
    { personId: 1, score: 10 }, { personId: 1, score: 20 }, { personId: 1, score: 30 },
    { personId: 2, score: 5 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-quality')).toHaveText('20');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-quality')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-quality')).toHaveText('n/a');
  });
});
