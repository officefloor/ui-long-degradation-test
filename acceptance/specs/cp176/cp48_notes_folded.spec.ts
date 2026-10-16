import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each person has a single whole-number score, shown in `person-score` (empty when none). note-sum
// is now the score; quality is the score, and a missing score counts as zero, so no score gives
// quality 0. adjusted = combined + quality follows.
//   Dana score 42 -> note-sum 42, quality 42, adjusted 33+42=75
//   Ravi score 5  -> note-sum 5,  quality 5,  adjusted 8+5=13
//   Uma no score   -> note-sum 0,  quality 0,  adjusted 100+0=100

test.describe('notes folded to a single score', () => {
  test('note-sum, quality and adjusted use the single score', { tag: '@functionality' }, async ({ page }) => {
    // a change dated after the anchor does not count yet (Dana's beta 8 from 2026-04-01)
    // Uma's beta was 10 until it became 20 on 2026-02-01, so as of 2026-01-15 her momentum is 50
    await resetAndSeed({
  anchor: '2026-03-01',
  history: [
    { personId: 1, field: 'beta', value: 8, from: '2026-04-01' },
    { personId: 3, field: 'beta', value: 20, from: '2026-02-01' },
  ],
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true, score: 42 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true, score: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 10, gamma: 5,  active: true, score: null },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-score')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('person-score')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('person-score')).toHaveText('');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-note-sum')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-note-sum')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-note-sum')).toHaveText('0');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-quality')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-quality')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-quality')).toHaveText('0');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-adjusted')).toHaveText('75');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-adjusted')).toHaveText('13');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-adjusted')).toHaveText('100');

    // as of 2026-01-15 Uma's beta is still 10: momentum 5*10 = 50, adjusted 50 + 0 = 50
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-adjusted')).toHaveText('50');
  });
});
