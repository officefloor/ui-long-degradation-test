import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person on hold does not count towards anyone else's figures either. A held patron is left out
// of backing, clout and flux, and a held person is left out of the synergy of anyone who follows
// them or whom they follow. Clout and flux average over the patrons not on hold. A person whose patrons are all on hold
// is treated as having no patrons (backing n/a, clout 0, flux 0). The held person's own figures
// still use their own patrons, the people they follow and the people who follow them (synergy
// counts both, each person once).
//
// Everyone active. thrust / momentum / force:
//   Ann 6 / 6 / 1 (torque 1, blend 7) ; Bob 20 / 20 / 12 ; Cyd 15 / 15 / 6 (torque 6, blend 21)
//   Hela (on hold) 100 / 100 / 50
// Hela's own: patron Bob -> backing 20, net 120, effective 120, clout 20, flux 12;
//   follows Bob, followed by Ann and Cyd -> synergy 20+6+15 = 41
//
// Ann: patrons Bob, Cyd, Hela -> Hela left out
//   backing 20+15 = 35 (not 135), net 6+35 = 41, effective 41
//   clout (20+15)/2 = 17.5 -> 17 (not (20+15+120)/3 = 51), influence 41+17 = 58
//   flux (12+6)/2 = 9 (not (12+6+50)/3 = 22), crest 7+9 = 16
//   follows Cyd, Hela -> synergy 15 (not 115), combined 58+15 = 73
// Cyd: only patron is Hela -> no patrons: backing n/a, net 15, clout 0, influence 15, flux 0, crest 21
//   follows only Hela (left out), followed by Ann -> synergy 6

test.describe('hold through links', () => {
  test('a held patron or followed person is left out of backing, clout, flux and synergy', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 3, epsilon: 4,  zeta: 3, active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 5,  gamma: 3,  delta: 2, epsilon: 3,  zeta: 2, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 5, epsilon: 10, zeta: 5, active: true, hold: true },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, { personId: 1, patronId: 9 },
        { personId: 3, patronId: 9 },
        { personId: 9, patronId: 2 },
      ],
      follows: [
        { from: 1, to: 3 }, { from: 1, to: 9 },
        { from: 3, to: 9 },
        { from: 9, to: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('35');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-net')).toHaveText('41');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-clout')).toHaveText('17');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-influence')).toHaveText('58');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-flux')).toHaveText('9');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-crest')).toHaveText('16');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-synergy')).toHaveText('15');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('73');
  });

  test('a person whose only patron is on hold has no patrons for these figures', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 3, epsilon: 4,  zeta: 3, active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 5,  gamma: 3,  delta: 2, epsilon: 3,  zeta: 2, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 5, epsilon: 10, zeta: 5, active: true, hold: true },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, { personId: 1, patronId: 9 },
        { personId: 3, patronId: 9 },
        { personId: 9, patronId: 2 },
      ],
      follows: [
        { from: 1, to: 3 }, { from: 1, to: 9 },
        { from: 3, to: 9 },
        { from: 9, to: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-backing')).toHaveText('n/a'); // not 100
    await expect(page.getByTestId('person-row-3').getByTestId('concept-net')).toHaveText('15');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-clout')).toHaveText('0');      // not 120
    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('15');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flux')).toHaveText('0');       // not 50
    await expect(page.getByTestId('person-row-3').getByTestId('concept-crest')).toHaveText('21');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-synergy')).toHaveText('6');    // Ann's 6, not 106
  });

  test('a held person keeps their own patron and follow figures', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 3, epsilon: 4,  zeta: 3, active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 5,  gamma: 3,  delta: 2, epsilon: 3,  zeta: 2, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 5, epsilon: 10, zeta: 5, active: true, hold: true },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, { personId: 1, patronId: 9 },
        { personId: 3, patronId: 9 },
        { personId: 9, patronId: 2 },
      ],
      follows: [
        { from: 1, to: 3 }, { from: 1, to: 9 },
        { from: 3, to: 9 },
        { from: 9, to: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-9').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-backing')).toHaveText('20');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-net')).toHaveText('120');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-clout')).toHaveText('20');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-flux')).toHaveText('12');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-synergy')).toHaveText('41');
  });
});
