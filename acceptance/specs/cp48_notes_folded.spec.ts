import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// person (the notes[] join list is gone). note-sum is now the score; quality is the score; no score
// is still 'n/a' quality. adjusted = combined + quality follows.
//   Dana score 42 -> note-sum 42, quality 42, adjusted 33+42=75
//   Ravi score 5  -> note-sum 5,  quality 5,  adjusted 8+5=13
//   Uma no score   -> note-sum 0,  quality n/a, adjusted 100+0=100

test.describe('notes folded to a single score', () => {
  test('note-sum, quality and adjusted use the single score', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true, score: 42 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true, score: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true, score: null },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-note-sum')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-note-sum')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-note-sum')).toHaveText('0');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-quality')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-quality')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-quality')).toHaveText('n/a');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-adjusted')).toHaveText('75');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-adjusted')).toHaveText('13');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-adjusted')).toHaveText('100');
  });
});
