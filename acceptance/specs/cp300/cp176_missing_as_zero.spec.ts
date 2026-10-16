import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing raw number (alpha, beta, gamma, delta, epsilon, zeta or score) counts as zero in every
// figure, so no figure shows n/a because a raw number is missing. n/a for any other reason stays: no
// patrons (backing), no grade (weight and load), and a held person's rank. Hela is on hold: left out
// of ranks, counted at half in totals.
//
// This sheet weighs LOW 2, MID 3, HIGH 5.
//   Ann  alpha 5, beta missing -> 0, gamma 8: thrust 0, drift 3, momentum 0 + 3*3 = 9 (STEADY),
//        LOW load 18 ; delta 2, epsilon 3, zeta missing -> 0: force 6, sway -2, torque 0, blend 9 ;
//        no score -> quality 0 ; no patrons -> backing n/a
//   Bob  momentum 20, MID load 60
//   Cyd  alpha missing -> 0, beta 7, gamma 3: thrust 0, drift 3, momentum 9 ; no delta, epsilon or
//        zeta -> torque 0 ; no grade -> load n/a
//   Hela (on hold) momentum 100, LOW load 200 -> 100 in the total
//   Sol is shared from sheet S9 as row 8: counted here like anyone. Momentum 5, LOW load 10
// rank by momentum, level momentum sharing a rank and the next rank following on: Bob 20 -> 1,
// Ann 9 and Cyd 9 -> 2, Sol 5 -> 3
// total load 18 + 60 + 100 + 10 = 188 (Cyd's load is n/a and left out)
// A change dated after the anchor does not count yet: Ann's gamma 2 from 2026-04-01.
test.describe('missing numbers count as zero', () => {
  test('a missing raw number counts as zero; other n/a stays', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  gamma: 8,  delta: 2, epsilon: 3, grade: 'LOW', active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 1, epsilon: 2, zeta: 1, grade: 'MID', active: true },
        { id: 3, name: 'Cyd',  beta: 7,  gamma: 3,  active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 5, gamma: 1, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'gamma', value: 2, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('0');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('9');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-blend')).toHaveText('9');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-quality')).toHaveText('0');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-momentum')).toHaveText('9');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-torque')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    // rollup-total-load: Ann 18 + Bob 60 + Hela 100 (half of 200) + Sol 10 = 188; leave out the highest contribution, Hela's 100 -> 88
    await expect(page.getByTestId('rollup-total-load')).toHaveText('88');
  });
});
