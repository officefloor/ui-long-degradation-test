import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Percentile follows the dense ranks: the top rank 100, the lowest rank 0, evenly in between by rank
// (rounded to the nearest); the two tied people share a rank and a percentile. Hela is on hold:
// unranked, n/a (counted, her momentum 60 would add a rank).

test.describe('percentile', () => {
  test('percentile spreads 100..0 evenly by rank', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: ranked here like anyone (momentum 30 -> rank 3 -> (5-3)*100/4 = 50).
    // A change dated after the anchor does not count yet: Ed's beta 10 from 2026-04-01 (momentum 20,
    // level with Di, would leave only four ranks).
    await resetAndSeed({
  anchor: '2026-03-01',
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3 }, // momentum 30
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 5, field: 'beta', value: 10, from: '2026-04-01' }],
  people: [
    { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50  -> rank 2 -> (5-2)*100/4 = 75
    { id: 2, name: 'Bob', alpha: 10, beta: 5,  gamma: 10 }, // momentum 50  -> rank 2 -> 75
    { id: 3, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100 -> rank 1 -> 100
    { id: 4, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20  -> rank 4 -> 25
    { id: 5, name: 'Ed',  alpha: 2,  beta: 5,  gamma: 2 },  // momentum 10  -> rank 5 -> 0
    { id: 9, name: 'Hela', alpha: 3,  beta: 20, gamma: 3, hold: true }, // momentum 60, on hold: unranked
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('75');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-percentile')).toHaveText('75');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-percentile')).toHaveText('50');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-percentile')).toHaveText('25');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-percentile')).toHaveText('0');
  });

  test('a single person is 100', { tag: '@functionality' }, async ({ page }) => {
    // One rank only: (lowest - rank) / (lowest - 1) is 0/0, so the lone person is defined as 100.
    // Hela is on hold: unranked (counted, she would be rank 1 and Ann rank 2, percentile 0).
    // Ann is shared from sheet S9: she counts here like anyone, and is the only person who does.
    // A change dated after the anchor does not count yet: Hela's beta 30 from 2026-04-01 (momentum 300).
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5 }, // momentum 100 -> only person
        ] },
      ],
      shares: [{ personId: 1, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 9, field: 'beta', value: 30, from: '2026-04-01' }],
      people: [
        { id: 9, name: 'Hela', alpha: 10, beta: 20, gamma: 10, hold: true }, // momentum 200, on hold
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-momentum')).toHaveText('200');
  });
});
