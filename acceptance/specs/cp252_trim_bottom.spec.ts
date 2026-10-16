import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A sheet-wide total now leaves out BOTH its single highest contribution and its single lowest.
// grand-scaled adds everyone's scaled. Hela is held and this sheet counts held people out of totals.
// scaled contributions: Ada 60, Ben 240, Cam 900, Dot 45. Leave out the highest (900) and the
// lowest (45): 60 + 240 = 300.

test.describe('grand scaled drops the highest and lowest', () => {
  test('a total leaves out its top and bottom contributor', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { heldInTotals: 'out' },
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900 (dropped, highest)
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45  (dropped, lowest)
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held, out
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-grand-scaled')).toHaveText('300');
  });
});
