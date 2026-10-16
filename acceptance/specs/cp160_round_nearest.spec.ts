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
// percentile among Ann 25, Cyd 20, Bob 10, Dee 7 (4 people): Cyd (4-2)*100/3 = 66.7 -> 67,
//   Bob (4-3)*100/3 = 33.3 -> 33
// total effective 13 + 37 + 20 + 7 + 8 + 3 (Sol) = 88
// Pod: Ann and Cyd -> strength 13+20 = 33, size 2, cohesion 33/2 = 16.5 -> 17
// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol is on hold, and the hold is part of the person, so Sol is on hold here too:
// effective 5, left out of percentiles, counted at 5/2 = 2.5 -> 3 in the total.
// The anchor is 2026-03-01. Dee's beta becomes 9 from 2026-04-01: a change dated after the anchor does not count yet.
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
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 5, gamma: 1, active: true, hold: true }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 9, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('13');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-clout')).toHaveText('14');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-influence')).toHaveText('51');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('67');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('33');
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('88');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('17');
  });
});
