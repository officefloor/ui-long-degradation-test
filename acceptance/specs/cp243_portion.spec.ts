import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// portion = scaled as a whole percent, rounded down, of the scaled of everyone who counts (not on
// hold, momentum not 0) added together. A person on hold adds nothing to it and has no portion (n/a).
// The sheet multiplies band C by 3 (not 2), so Ben is 120 x 3 = 360.
// Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 100, C x3 -> 300).
// A change dated after the anchor does not count yet: Dot's beta 30 from 2026-04-01 (scaled 90).
// Whole = 60 + 360 + 900 + 45 + 300 = 1665.
//   Ada 6000 / 1665 -> 3, Ben 36000 / 1665 -> 21, Cam 90000 / 1665 -> 54, Dot 4500 / 1665 -> 2,
//   Sol 30000 / 1665 -> 18

test.describe('portion', () => {
  test('portion is scaled as a floored percent of the scaled of everyone who counts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 360
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45
    // Hela is on hold: she adds nothing to the whole (counted, it would be 1755)
    { id: 9, name: 'Hela', alpha: 3, beta: 30, gamma: 3, active: true, hold: true }, // scaled 90
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 4, beta: 25, gamma: 4, active: true }, // scaled 300
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-portion')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-portion')).toHaveText('21');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-portion')).toHaveText('54');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-portion')).toHaveText('2');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-portion')).toHaveText('18');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-portion')).toHaveText('n/a');
  });

  test('portion is n/a when the whole is zero', { tag: '@functionality' }, async ({ page }) => {
    // every momentum is below zero -> band E -> scaled 0 -> whole 0 -> portion n/a for all
    // Hela is on hold: her scaled 1 adds nothing, so the whole stays 0 (counted, it would be 1 and
    // Lo's and Mo's portions 0)
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum -12, scaled 0), so she
    // adds 0 to the whole and has no portion either
    await resetAndSeed({
      people: [
        { id: 1, name: 'Lo', alpha: 5, beta: 1, gamma: 0, active: true }, // thrust 5, drift -5, momentum -10 -> scaled 0
        { id: 2, name: 'Mo', alpha: 4, beta: 1, gamma: 0, active: true }, // thrust 4, drift -4, momentum -8  -> scaled 0
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, active: true, hold: true }, // momentum 1 -> scaled 1
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 6, beta: 1, gamma: 0, active: true }, // thrust 6, drift -6, momentum -12 -> scaled 0
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-portion')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-portion')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-portion')).toHaveText('n/a');
  });
});
