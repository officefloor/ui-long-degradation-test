import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// sheet standing = position ordered by scaled desc (ties by name asc).
//   Cam 900 -> 1, Sol 300 -> 2, Ben 240 -> 3, Ada 60 -> 4, Dot 45 -> 5
// Hela is on hold: left out of the order (her scaled 2400 would put her first), so her standing is n/a.
// Sol is shared from sheet S9 as row 8 and ordered here like anyone: momentum 150, band C, scaled 300.
// A change dated after the anchor does not count yet: Dot's beta 40 from 2026-04-01.

test.describe('sheet standing', () => {
  test('standing orders by scaled desc', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // momentum 60, band D, scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // momentum 120, band C, scaled 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // momentum 300, band B, scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // momentum 45, band D, scaled 45
    { id: 9, name: 'Hela', alpha: 20, beta: 30, gamma: 20, active: true, hold: true }, // momentum 600, band A, scaled 2400
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 5, beta: 30, gamma: 5, active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 40, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-standing-v')).toHaveText('1');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-standing-v')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing-v')).toHaveText('3');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing-v')).toHaveText('4');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-standing-v')).toHaveText('5');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-standing-v')).toHaveText('n/a');

    // as of 2026-05-01 Dot's beta 40 counts: momentum 3*40 = 120, band C, scaled 240, level with Ben;
    // Ben's name comes first, so Ben 3, Dot 4, Ada 5
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-4').getByTestId('concept-standing-v')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing-v')).toHaveText('3');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing-v')).toHaveText('5');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-standing-v')).toHaveText('n/a');
  });

  // tie on scaled: Amy and Bea both mom120 -> band C x2 -> scaled 240; name asc gives Amy the better standing.
  //   Cal mom60 -> band D x1 -> scaled 60 (last)
  test('standing breaks a scaled tie by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Amy', alpha: 4, beta: 30, gamma: 4, active: true }, // scaled 240 -> standing 1
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true }, // scaled 240 -> standing 2
        { id: 3, name: 'Cal', alpha: 2, beta: 30, gamma: 2, active: true }, // scaled 60  -> standing 3
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing-v')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing-v')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-standing-v')).toHaveText('3');
  });
});
