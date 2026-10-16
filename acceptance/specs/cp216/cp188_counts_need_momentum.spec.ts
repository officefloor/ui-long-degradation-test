import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A person whose momentum is 0 is left out of every count of people across the sheet. They still
// show on the list with their own figures, and still count in ranks, totals and middle values.
// Nobody has patrons, follows or a score, so adjusted = momentum and value (scaled) is momentum times
// the band multiplier. Blend = momentum + torque, and with no delta, epsilon or zeta (each counting
// as 0) torque is 0.
// In the first test the sheet's own band C starts at 150 (default 100), so the bands are D 0..149 x1,
// C 150..249 x2, B 250..499 x3, and Cal (momentum 100) is in band D:
//   Ann alpha 10, beta 30: momentum 300, band B, value 900, drag L3, region N
//   Ben alpha 10, beta 20: momentum 200, band C, value 400, drag L3, region S
//   Cal alpha 5,  beta 20: momentum 100, band D, value 100, drag L2, region N
//   Sol alpha 5,  beta 10: momentum 50,  band D, value 50,  drag L2, region N
//   Zed alpha 4,  beta 3, gamma 0: thrust 12, drift -4, momentum 12 - 12 = 0, band D, value 0, drag L1
//   Nil no alpha, beta or gamma (each counts as 0): momentum 0, band D, value 0, drag L1, region S
// Sol is shared from sheet S9: counted here like anyone (in both tests).
// A change dated after the anchor does not count yet (Cal's beta 0 from 2026-04-01 in the first test,
// Ben's beta 0 from 2026-04-01 in the second, each of which would take that person out of the counts).
// Hela is on hold: left out of every count (counted, she would add 1 to the N region, the active
// count and the head count).
// The middle value of everyone's value (not on hold) still includes Zed and Nil: 0, 0, 50, 100, 400,
// 900 -> 50 (the lower of the two middle values), so norm is Ann 850, Ben 350, Cal 50, Sol 0,
// Zed -50, Nil -50; outliers (more than 100 from zero) are Ann and Ben, and both are counted.
test.describe('counts leave out people with momentum 0', () => {
  test('every count of people skips momentum 0; ranks and middle values keep them', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandFrom: { D: 0, C: 150, B: 250, A: 500 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', region: 'N', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 0, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', region: 'N', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', region: 'S', active: true },
        { id: 3, name: 'Cal',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', region: 'N', active: true },
        { id: 4, name: 'Zed',  alpha: 4,  beta: 3,  gamma: 0,  grade: 'LOW', region: 'N', active: true },
        { id: 5, name: 'Nil',  grade: 'LOW', region: 'S', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, grade: 'LOW', region: 'N', active: true, hold: true },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-momentum')).toHaveText('0');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('0');
    // counts: Ann, Ben, Cal and Sol only
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('4');
    await expect(page.getByTestId('region-count-N')).toHaveText('3');   // Ann, Cal, Sol (not Zed)
    await expect(page.getByTestId('region-count-S')).toHaveText('1');   // Ben (not Nil)
    await expect(page.getByTestId('band-count-D')).toHaveText('2');     // Cal, Sol (not Zed or Nil)
    await expect(page.getByTestId('band-count-C')).toHaveText('1');     // Ben
    await expect(page.getByTestId('drag-count-L1')).toHaveText('0');    // only Zed and Nil are L1
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('2');
    await expect(page.getByTestId('rollup-coverage')).toHaveText('3');  // value 100 or more: Ann, Ben, Cal
    // not counts: the middle value and the ranks still take them in
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('50');
    // momentum 0 for Zed and Nil: level, so they share rank 5 (after Ann, Ben, Cal and Sol)
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('5');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('5');
  });

  test('editing a number down to momentum 0 drops the person from the counts', { tag: '@functionality' }, async ({ page }) => {
    // Cal's beta 20 -> 0: thrust 0, drift 0, momentum 0, so Cal leaves the head count, the active
    // count and the N region count, and is no longer covered. Hela is on hold and never counted.
    // Here the sheet's own band multiplier for D is 3 (default 1): Sol 50 x 3 = 150, so Sol is covered.
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', region: 'N', active: true },
        ] },
      ],
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 3, E: 0 } },
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 0, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', region: 'N', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', region: 'S', active: true },
        { id: 3, name: 'Cal',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', region: 'N', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, grade: 'LOW', region: 'N', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
    await expect(page.getByTestId('region-count-N')).toHaveText('3');   // Ann, Cal, Sol

    await page.getByTestId('person-edit-3').click();
    await page.getByTestId('person-form-beta').fill('0');
    await page.getByTestId('person-form-submit').click();
    expect(auditLines()).toContain('CHANGED id=3 field=beta from=20 to=0');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-momentum')).toHaveText('0');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
    await expect(page.getByTestId('region-count-N')).toHaveText('2');   // Ann, Sol
    await expect(page.getByTestId('rollup-coverage')).toHaveText('3');  // Ann 900, Ben 400, Sol 150
  });
});
