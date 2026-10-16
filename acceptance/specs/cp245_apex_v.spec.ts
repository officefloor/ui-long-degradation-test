import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// apex (sheet) = name of the person with the highest scaled (ties by name asc).

test.describe('apex by scaled', () => {
  test('names the highest-scaled person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45
    // Hela is on hold: left out of the top name (with her it would be Hela)
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone, above Cam's 900
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 10, beta: 40, gamma: 10, active: true }, // mom400 -> band B x3 -> 1200
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');
    await expect(page.getByTestId('rollup-apex-v')).toHaveText('Sol'); // Sol 1200 beats Cam 900
  });

  // tie on the top scaled: Abe, Amy and Bea all mom120 -> band C x2 -> scaled 240; name asc picks Abe.
  //   Cal mom60 -> band D x1 -> scaled 60 (lower)
  // Abe is shared from sheet S9 as row 8: counted here like anyone.
  test('apex breaks a tie by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Amy', alpha: 4, beta: 30, gamma: 4, active: true }, // scaled 240
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true }, // scaled 240
        { id: 3, name: 'Cal', alpha: 2, beta: 30, gamma: 2, active: true }, // scaled 60
        // Hela is on hold: left out of the top name (with her it would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, active: true, hold: true }, // scaled 900
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Abe', alpha: 4, beta: 30, gamma: 4, active: true }, // scaled 240
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-apex-v')).toHaveText('Abe'); // 240 tie -> Abe before Amy and Bea
  });
});
