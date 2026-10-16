import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A person whose momentum is 0 is left out of every count of people across the sheet. They still
// show on the list with their own figures, and still count in ranks, totals and middle values.
// Nobody has patrons, follows or a score, so adjusted = momentum and value (scaled) is momentum times
// the band multiplier (D 0..99 x1, C 100..249 x2, B 250..499 x3). Blend = momentum + torque, and with
// no delta, epsilon or zeta (each counting as 0) torque is 0.
//   Ann alpha 10, beta 30: momentum 300, band B, value 900, drag L3, region N
//   Ben alpha 10, beta 20: momentum 200, band C, value 400, drag L3, region S
//   Cal alpha 5,  beta 20: momentum 100, band C, value 200, drag L2, region N
//   Zed alpha 4,  beta 3, gamma 0: thrust 12, drift -4, momentum 12 - 12 = 0, band D, value 0, drag L1
//   Nil no alpha, beta or gamma (each counts as 0): momentum 0, band D, value 0, drag L1, region S
// Hela is on hold: left out of every count (counted, she would add 1 to the N region, the active
// count and the head count).
test.describe('counts leave out people with momentum 0', () => {
  test('every count of people skips momentum 0; ranks and averages keep them', { tag: '@functionality' }, async ({ page }) => {
    // The sheet multiplies band C by 3 (not 2): Ben 200 x 3 = 600, Cal 100 x 3 = 300.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (alpha 2, beta 3, gamma 0:
    // thrust 6, drift -2, momentum 6 - 6 = 0, value 0, region S), so she is left out of the counts too.
    // A change dated after the anchor does not count yet: Cal's beta 40 from 2026-04-01.
    // The average of everyone's value (not on hold, rounded down) still includes Zed, Nil and Sol:
    // (900 + 600 + 300 + 0 + 0 + 0) / 6 = 300, so norm is Ann 600, Ben 300, Cal 0, and -300 for Zed,
    // Nil and Sol; outliers (more than 100 from zero) are Ann, Ben, Zed, Nil and Sol, but only Ann and
    // Ben are counted.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', active: true },
        { id: 3, name: 'Cal',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', active: true },
        { id: 4, name: 'Zed',  alpha: 4,  beta: 3,  gamma: 0,  grade: 'LOW', active: true },
        { id: 5, name: 'Nil',  grade: 'LOW', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, grade: 'LOW', active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' },
        { personId: 4, region: 'N' }, { personId: 5, region: 'S' }, { personId: 9, region: 'N' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 3, gamma: 0, grade: 'LOW', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-momentum')).toHaveText('0');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('0');
    // counts: Ann, Ben, Cal only
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
    await expect(page.getByTestId('region-count-N')).toHaveText('2');   // Ann, Cal (not Zed)
    await expect(page.getByTestId('region-count-S')).toHaveText('1');   // Ben (not Nil or Sol)
    await expect(page.getByTestId('band-count-D')).toHaveText('0');     // only Zed, Nil and Sol are in D
    await expect(page.getByTestId('band-count-C')).toHaveText('2');     // Ben, Cal
    await expect(page.getByTestId('drag-count-L1')).toHaveText('0');    // only Zed, Nil and Sol are L1
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('2'); // Ann, Ben
    await expect(page.getByTestId('rollup-coverage')).toHaveText('3');  // value 100 or more
    // not counts: the average and the ranks still take them in
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('0');     // 300 - 300
    // momentum 0 for Zed, Nil and Sol: level, so they share rank 4
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('4');

    // as of 2026-04-15 Cal's beta 40 counts: momentum 200, value 600, so the average is
    // (900 + 600 + 600 + 0 + 0 + 0) / 6 = 350 and Cal's norm 600 - 350 = 250
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('250');
  });

  test('editing a number down to momentum 0 drops the person from the counts', { tag: '@functionality' }, async ({ page }) => {
    // Cal's beta 20 -> 0: thrust 0, drift 0, momentum 0, so Cal leaves the head count, the active
    // count and the N region count, and is no longer covered. Hela is on hold and never counted.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 100, value 200, region S).
    // A change dated after the anchor does not count yet: Ben's beta 0 from 2026-04-01 (which would
    // take him out of the counts too).
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', active: true },
        { id: 3, name: 'Cal',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, grade: 'LOW', active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' },
        { personId: 9, region: 'N' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 0, from: '2026-04-01' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');   // Ann, Ben, Cal, Sol
    await expect(page.getByTestId('region-count-N')).toHaveText('2');   // Ann, Cal

    await page.getByTestId('person-edit-3').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Cal');
    await page.getByTestId('person-form-beta').fill('0');
    await page.getByTestId('person-form-submit').click();
    await expect.poll(() => auditLines()).toContain('CHANGED id=3 field=beta from=20 to=0');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-momentum')).toHaveText('0');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');     // Ann, Ben, Sol
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
    await expect(page.getByTestId('region-count-N')).toHaveText('1');   // Ann
    await expect(page.getByTestId('rollup-coverage')).toHaveText('3');  // Ann 900, Ben 400, Sol 200
  });
});
