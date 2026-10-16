import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// ballast = ripple - combined. ripple (rivals mutual): Ada 730, Ben 370, Cam 1460, Dot 310.
// combined: Ada 60, Ben 120, Cam 300, Dot 45. ballast: Ada 670, Ben 250, Cam 1160, Dot 265.
// rollup-ballast-total adds everyone's ballast (a sheet-wide total): Hela is held and counts out here;
// leave out the highest (1160) and the lowest (250): 670 + 265 = 935.

test.describe('ballast, ripple minus combined', () => {
  test('shows ballast and its trimmed total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { heldInTotals: 'out' },
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // ballast 670
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // ballast 250 (lowest, dropped)
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // ballast 1160 (highest, dropped)
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // ballast 265
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held, out
      ],
      rivals: [{ from: 1, to: 2 }, { from: 1, to: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ballast')).toHaveText('370');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ballast')).toHaveText('250');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ballast')).toHaveText('1160');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ballast')).toHaveText('265');

    await expect(page.getByTestId('rollup-ballast-total')).toHaveText('635');
  });
});
