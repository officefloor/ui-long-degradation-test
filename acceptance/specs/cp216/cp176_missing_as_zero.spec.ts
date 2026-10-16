import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing raw number (alpha, beta, gamma, delta, epsilon, zeta or score) counts as zero in every
// figure, so no figure shows n/a because a raw number is missing. n/a for any other reason stays: no
// patrons (backing), no grade (weight and load), and a held person's rank. Hela is on hold: left out
// of ranks, counted at half in totals.
//
//   Ann  alpha 5, beta missing -> 0, gamma 8: thrust 0, drift 3, momentum 0 + 3*3 = 9 (STEADY),
//        LOW load 9*2 = 18 ; delta 2, epsilon 3, zeta missing -> 0: force 6, sway -2, torque 0, blend 9 ;
//        no score -> quality 0 ; no patrons -> backing n/a
//   Bob  momentum 20, MID load 20*4 = 80
//   Cyd  alpha missing -> 0, beta 7, gamma 3: thrust 0, drift 3, momentum 9 ; no delta, epsilon or
//        zeta -> torque 0 ; no grade -> load n/a
//   Hela (on hold) momentum 100, LOW load 200 -> 100 in the total
//   Sol  (shared) alpha 1, beta 1, gamma 1: momentum 1, LOW load 2
// rank by momentum, level momentum sharing a rank: Bob 20 -> 1, Ann 9 and Cyd 9 -> 2, Sol 1 -> 3
// total load 18 + 80 + 100 + 2 = 200 (Cyd's load is n/a and left out)
test.describe('missing numbers count as zero', () => {
  test('a missing raw number counts as zero; other n/a stays', { tag: '@functionality' }, async ({ page }) => {
    // the sheet's own weights (LOW 2, MID 4) set the loads
    // Sol is shared from sheet S9: counted here like anyone (momentum 1, last in rank, LOW load 2)
    // a change dated after the anchor does not count yet (Bob's beta 50 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 50, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  gamma: 8,  delta: 2, epsilon: 3, grade: 'LOW', active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 1, epsilon: 2, zeta: 1, grade: 'MID', active: true },
        { id: 3, name: 'Cyd',  beta: 7,  gamma: 3,  active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, hold: true },
      ],
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
    await expect(page.getByTestId('rollup-total-load')).toHaveText('200');
  });
});
