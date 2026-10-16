import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top brace is still Dot.
//   brace: Ada 15+24=39, Ben -1+20=19, Dot 100+200=300
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela brace 1 + 2*9 = 19, counts 19/2 = 9.5 -> 10 (to the nearest, a half rounding up) ;
//   total 39+19+300+10 = 368
// Sol is shared from sheet S9 as row 8 and counted here like anyone: brace 1 + 2*2 = 5.
// A change dated after the anchor does not count yet: Ben's beta 6 from 2026-04-01.

test.describe('brace coefficient raised to 2', () => {
  test('brace = influence + 2*force; total follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 9, zeta: 1, active: true, hold: true },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 2, field: 'beta', value: 6, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-brace')).toHaveText('39');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-brace')).toHaveText('19');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-brace')).toHaveText('300');

    // rollup-total-brace: Ada 39 + Ben 19 + Dot 300 + Hela 10 (half of 19) + Sol 5 = 373; leave out the highest contribution, Dot's 300 -> 73
    await expect(page.getByTestId('rollup-total-brace')).toHaveText('73');

    // as of 2026-05-01 Ben's beta 6 counts: momentum 4*6 + 3*(1-4) = 15, influence 15,
    // brace 15 + 2*10 = 35
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-2').getByTestId('concept-brace')).toHaveText('35');
  });
});
