import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every figure that divides and used to round down now rounds to the nearest whole number, a half
// rounding up to the larger number (12.5 -> 13, and -2.5 -> -2): an inactive person's half of net,
// the averages over patrons, percentiles, a group's cohesion, and a held person's half in totals.
// Hela is on hold: left out of ranks and percentiles, counted at half in totals.
//
// thrust = momentum (gamma = alpha):
//   Ann 25, not active: effective 25/2 = 12.5 -> 13 (not 12)
//   Cyd 20, active: effective 20 ; Dee 7, active: effective 7
//   Bob 10, active, patrons Cyd and Dee: backing 20+7 = 27, net 37, effective 37,
//       clout (20+7)/2 = 13.5 -> 14 (not 13), influence 37+14 = 51
//   Hela 15, on hold: effective 15, counted at 15/2 = 7.5 -> 8 in totals
//   Sol 3, active: effective 3. Sol is shared from sheet S9 as row 8: counted here like anyone
// percentile among Ann 25, Cyd 20, Bob 10, Dee 7, Sol 3 (5 people): Cyd (5-2)*100/4 = 75,
//   Bob (5-3)*100/4 = 50
// total effective 13 + 37 + 20 + 7 + 8 + 3 = 88
// A change dated after the anchor does not count yet: Dee's beta 10 from 2026-04-01.
// Pod: Ann and Cyd -> strength 13+20 = 33, size 2, cohesion 33/2 = 16.5 -> 17
test.describe('round to nearest', () => {
  test('figures that divide round to the nearest whole number, halves up', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      groups: [{ id: 1, name: 'Pod' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 5, gamma: 5,  active: false, state: 'REVIEW' },
        { id: 2, name: 'Bob',  alpha: 2, beta: 5, gamma: 2,  active: true },
        { id: 3, name: 'Cyd',  alpha: 4, beta: 5, gamma: 4,  active: true,  state: 'REVIEW' },
        { id: 4, name: 'Dee',  alpha: 1, beta: 7, gamma: 1,  active: true },
        { id: 9, name: 'Hela', alpha: 3, beta: 5, gamma: 3,  active: true,  hold: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 3, groupId: 1 }],
      patrons: [{ personId: 2, patronId: 3 }, { personId: 2, patronId: 4 }],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 3, gamma: 1, active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 10, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('13');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-clout')).toHaveText('14');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-influence')).toHaveText('51');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('75');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('50');
    // rollup-total-effective: Ann 13 + Bob 37 + Cyd 20 + Dee 7 + Hela 8 (half of 15) + Sol 3 = 88; leave out the highest contribution, Bob's 37 -> 51
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('51');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('17');

    // as of 2026-05-01 Dee's beta 10 counts: Dee 10, Bob's backing 20+10 = 30, net and effective 40;
    // 13 + 40 + 20 + 10 + 8 + 3 = 94, Bob's 40 left out -> 54
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('54');
  });
});
