import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every figure worked out from the people a person follows also counts the people who follow them,
// each person once, so two people who follow each other count once. The list of the people a person
// follows, and its count, are unchanged. Hela is on hold: she counts in nobody's follow figures and
// is left out of sheet-wide figures.
//
// thrust = momentum (gamma = alpha), everyone active, no patrons, no score:
//   influence = effective = momentum ; combined = influence + synergy ; adjusted = combined
//   Ann 6, Bob 20, Cyd 15, Dee 100, Hela 50
// This sheet has its own bands: D 0..39, C 40..109, B 110..499, A 500+; multipliers C 3, B 4.
// follows: Ann -> Bob, Bob -> Ann, Cyd -> Ann, Dee -> Cyd, Hela -> Ann
//   Ann  follows Bob; followed by Bob, Cyd (and Hela, on hold) -> Bob, Cyd: synergy 20+15 = 35,
//        combined 6+35 = 41, band C, scaled 41*3 = 123
//   Bob  follows Ann; followed by Ann -> Ann once: synergy 6, combined 26
//   Cyd  follows Ann; followed by Dee -> Ann, Dee: synergy 6+100 = 106, combined 121,
//        band B, scaled 121*4 = 484
//   Dee  follows Cyd -> synergy 15, combined 115, band B
//   Hela follows Ann -> synergy 6, combined 56, band C (on hold: not in the band counts)
// band C: Ann -> 1

test.describe('followers too', () => {
  test('follow figures count followers as well, each person once', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 5,  gamma: 3,  active: true },
        { id: 4, name: 'Dee',  alpha: 10, beta: 10, gamma: 10, active: true },
        { id: 9, name: 'Hela', alpha: 5,  beta: 10, gamma: 5,  active: true, hold: true },
      ],
      follows: [
        { from: 1, to: 2 }, { from: 2, to: 1 }, { from: 3, to: 1 }, { from: 4, to: 3 }, { from: 9, to: 1 },
      ],
      // this sheet has its own band boundaries and multipliers
      settings: { bandFrom: { D: 0, C: 40, B: 110, A: 500 }, bandMultipliers: { A: 5, B: 4, C: 3, D: 1, E: 0 } },
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-allies')).toHaveText('Bob');
    await expect(page.getByTestId('person-row-1').getByTestId('person-ally-count')).toHaveText('1');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-synergy')).toHaveText('35');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('41');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-scaled')).toHaveText('123');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-synergy')).toHaveText('6');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('26');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-synergy')).toHaveText('106');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('B');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('484');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-synergy')).toHaveText('6');
    await expect(page.getByTestId('band-count-C')).toHaveText('1');
  });
});
