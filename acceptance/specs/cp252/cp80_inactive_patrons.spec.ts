import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A patron who is not active counts towards nobody's patron figures: backing, clout and flux leave
// them out, and clout and flux average over the active patrons only. A person whose patrons are all
// inactive is treated as having no patrons (backing n/a, clout 0, flux 0). Inactive patrons are
// still listed among the person's patrons. Hela is on hold: left out of patron figures and of
// sheet-wide figures (totals count her at half).
//
// thrust = momentum here (gamma = alpha). force / torque / blend from delta, epsilon, zeta:
//   Ann  thrust 6,   force 1,  torque 1,  blend 7,   active
//   Bob  thrust 20,  force 12, torque 12, blend 32,  active, no patrons: net 20, effective 20
//   Cyd  thrust 30,  force 6,  torque 6,  blend 36,  NOT active, no patrons: net 30, effective 30/2 = 15
//   Dee  thrust 20,  force 2,  torque 2,  blend 22,  active
//   Eve  thrust 2,   force 1,  torque 1,  blend 3,   active
//   Hela thrust 100, force 50, torque 50, blend 150, active, on hold, no patrons: effective 100
//
// Ann  patrons Bob, Hela (held): backing 20, net 26, effective 26, clout 20, influence 46,
//      flux 12, crest 7+12 = 19
// Dee  patrons Cyd (inactive) and Hela (held): no patrons -> backing n/a, net 20, effective 20,
//      clout 0, influence 20, flux 0, crest 22   (counting Cyd: backing 30, clout 15, influence 65)
// Eve  patrons Bob, Cyd (inactive): backing 20 (not 50), net 22, effective 22,
//      clout 20 (not (20+15)/2 = 17), influence 42 (not 69), flux 12 (not (12+6)/2 = 9), crest 15
// top influence: Ann 46 > Eve 42 > Bob 20 = Dee 20 > Cyd 15+0 = 15 (Hela 100 is on hold)
// total effective: 26+20+15+20+22 + 100/2 = 103 + 50 = 153
// Sol is shared from sheet S9 as row 8 and counted here like anyone: thrust 10, active, no patrons,
// effective 10, influence 10.
// A change dated after the anchor does not count yet: Dee's beta 8 from 2026-04-01.

test.describe('inactive patrons', () => {
  test('an inactive patron is left out of backing, clout and flux', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 3, epsilon: 4,  zeta: 3, active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 10, gamma: 3,  delta: 2, epsilon: 3,  zeta: 2, active: false },
        { id: 4, name: 'Dee',  alpha: 5,  beta: 4,  gamma: 5,  delta: 1, epsilon: 2,  zeta: 1, active: true },
        { id: 5, name: 'Eve',  alpha: 1,  beta: 2,  gamma: 1,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 5, epsilon: 10, zeta: 5, active: true, hold: true },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 9 },
        { personId: 4, patronId: 3 }, { personId: 4, patronId: 9 },
        { personId: 5, patronId: 2 }, { personId: 5, patronId: 3 },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 1, zeta: 1, active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 8, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-5').getByTestId('person-patrons')).toHaveText('Bob, Cyd');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-backing')).toHaveText('20');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-net')).toHaveText('22');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-clout')).toHaveText('20');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-influence')).toHaveText('42');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-flux')).toHaveText('12');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-crest')).toHaveText('15');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('20');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-influence')).toHaveText('46');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-crest')).toHaveText('19');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Ann');
    // rollup-total-effective: Ann 26 + Bob 20 + Cyd 15 + Dee 20 + Eve 22 + Hela 50 (half of 100) + Sol 10 = 163; leave out the highest contribution, Hela's 50 -> 113
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('103');
  });

  test('a person whose patrons are all inactive or on hold has no patrons for these figures', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 2,  beta: 3,  gamma: 2,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 5,  gamma: 4,  delta: 3, epsilon: 4,  zeta: 3, active: true },
        { id: 3, name: 'Cyd',  alpha: 3,  beta: 10, gamma: 3,  delta: 2, epsilon: 3,  zeta: 2, active: false },
        { id: 4, name: 'Dee',  alpha: 5,  beta: 4,  gamma: 5,  delta: 1, epsilon: 2,  zeta: 1, active: true },
        { id: 5, name: 'Eve',  alpha: 1,  beta: 2,  gamma: 1,  delta: 1, epsilon: 1,  zeta: 1, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, delta: 5, epsilon: 10, zeta: 5, active: true, hold: true },
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 9 },
        { personId: 4, patronId: 3 }, { personId: 4, patronId: 9 },
        { personId: 5, patronId: 2 }, { personId: 5, patronId: 3 },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 1, zeta: 1, active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 8, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('person-patrons')).toHaveText('Cyd, Hela');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-backing')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-net')).toHaveText('20');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-clout')).toHaveText('0');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('20');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-flux')).toHaveText('0');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-crest')).toHaveText('22');
    // Sol counts in the total: 26 + 20 + 15 + 20 + 22 + 50 + 10 = 163, Hela's 50 left out -> 113
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('103');

    // as of 2026-05-01 Dee's beta 8 counts: thrust 5*8 = 40, still no patrons, net 40
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-4').getByTestId('concept-net')).toHaveText('40');
  });
});
