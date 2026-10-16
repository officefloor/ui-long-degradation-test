import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cascade = fathom + scaled, then rounded DOWN to a whole multiple of ten.
// fathom: Ada 251, Ben 71, Cam 589, Dot 266. scaled: Ada 60, Ben 240, Cam 900, Dot 45.
// fathom+scaled: Ada 311, Ben 311, Cam 1489, Dot 311 -> rounded down to a ten: 310, 310, 1480, 310.
// peak over the people who count = 1480 (Hela is held, left out of the peak).

test.describe('cascade, fathom plus scaled to a ten', () => {
  test('rounds fathom plus scaled down to a multiple of ten', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 251 + 60  = 311 -> 310
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 71  + 240 = 311 -> 310
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 589 + 900 = 1489 -> 1480
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 266 + 45  = 311 -> 310
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-cascade')).toHaveText('310');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-cascade')).toHaveText('310');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-cascade')).toHaveText('1480');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-cascade')).toHaveText('310');

    await expect(page.getByTestId('rollup-cascade-peak')).toHaveText('1480');
  });
});
