import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// As-of view. Fill `sheet-as-of` with a date and press `sheet-as-of-apply`: every number and figure is
// worked out from each person's alpha, beta and gamma as they stood on that date (per number, the
// latest change dated ON OR BEFORE it, else the starting value), including the raw cells, every
// per-person figure and every sheet-wide total, count, rank and leader. Everything else stays as it is
// now. `sheet-as-of-clear` returns to the current figures, which use the anchor date.
// Hela is on hold: she shows her own figures but is left out of sheet-wide figures (ranks, the leader
// and counts leave her out; totals count her at half, to the nearest). She shows n/a for rank.
// Links count only from their start date (`since`; none means always): the as-of date when one is
// chosen, else the anchor. Cy's patrons are Ben from 2026-02-15 and Hela (always, but on hold, so
// left out). A person none of whose patrons count has backing n/a and clout 0.
// No follows or scores, all active: effective = net, adjusted = net + clout, and band comes from it:
// E <0, D 0..99, C 100..249, B 250..499, A 500+. This sheet weighs LOW 2, MID 3, HIGH 5.
// Sol is shared from sheet S9 as row 8: counted here like anyone (a1 b10 g1, LOW, no history):
// momentum 10, rank 4, load 20, band D.
//
//   as of 2026-02-01 (Ben's alpha 6 dated exactly 2026-02-01 counts; the 2026-02-15 changes do not)
//     Ada  a5 b10 g5  momentum 50 + 0 = 50          STEADY  rank 3  load 50*3=150    band D
//     Ben  a6 b30 g4  momentum 180 + 3*(-2) = 174   STEADY  rank 1  load 174*2=348   band C
//     Cy   a10 b10 g10 momentum 100 + 0 = 100       STEADY  rank 2  load 100*5=500   band C
//     Hela a10 b30 g10 momentum 300                 SURGE   n/a     load 1500 -> half 750, band B (not counted)
//     Cy's link from Ben has not started: backing n/a, clout 0, net 100, adjusted 100 (C)
//     total load 150+348+500+750+20 = 1768 ; leader Ben ; band counts B 0, C 2, D 2
//   now (anchor 2026-03-01)
//     Ada  a5 b50 g5  momentum 250                  SURGE   rank 1  load 750         band B
//     Ben  a6 b30 g4  momentum 174                  STEADY  rank 2  load 348         band C
//     Cy   a10 b10 g0 momentum 100 + 3*(-10) = 70   STEADY  rank 3  load 350
//          backing = Ben's thrust 6*30 = 180, clout = Ben's effective 174, net 70+180 = 250,
//          adjusted 250+174 = 424                                                     band B
//     Hela a10 b5 g10 momentum 50                   STEADY  n/a     load 250 -> half 125, band D (not counted)
//     total load 750+348+350+125+20 = 1593 ; leader Ada ; band counts B 2, C 1, D 1

test.describe('as of', () => {
  test('figures as of a date between changes, then current after clearing', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ada',  alpha: 5,  beta: 10, gamma: 5,  grade: 'MID',  active: true },
        { id: 2, name: 'Ben',  alpha: 4,  beta: 10, gamma: 4,  grade: 'LOW',  active: true },
        { id: 3, name: 'Cy',   alpha: 10, beta: 10, gamma: 10, grade: 'HIGH', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', active: true, hold: true },
      ],
      history: [
        { personId: 1, field: 'beta',  value: 50, from: '2026-02-15' },
        { personId: 2, field: 'beta',  value: 30, from: '2026-01-10' },
        { personId: 2, field: 'alpha', value: 6,  from: '2026-02-01' },
        { personId: 3, field: 'gamma', value: 0,  from: '2026-02-15' },
        { personId: 9, field: 'beta',  value: 5,  from: '2026-02-15' },
      ],
      patrons: [
        { personId: 3, patronId: 2, since: '2026-02-15' },
        { personId: 3, patronId: 9 },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 10, gamma: 1, grade: 'LOW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');
    const row = (id: number) => page.getByTestId(`person-row-${id}`);

    await expect(row(1).getByTestId('concept-momentum')).toHaveText('250');

    await page.getByTestId('sheet-as-of').fill('2026-02-01');
    await page.getByTestId('sheet-as-of-apply').click();

    await expect(row(1).getByTestId('person-beta')).toHaveText('10');
    await expect(row(2).getByTestId('person-alpha')).toHaveText('6');
    await expect(row(1).getByTestId('concept-momentum')).toHaveText('50');
    await expect(row(2).getByTestId('concept-momentum')).toHaveText('174');
    await expect(row(3).getByTestId('concept-momentum')).toHaveText('100');
    await expect(row(9).getByTestId('concept-momentum')).toHaveText('300');
    await expect(row(1).getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(row(9).getByTestId('concept-tier')).toHaveText('SURGE');
    await expect(row(2).getByTestId('concept-rank')).toHaveText('1');
    await expect(row(3).getByTestId('concept-rank')).toHaveText('2');
    await expect(row(1).getByTestId('concept-rank')).toHaveText('3');
    await expect(row(9).getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-leader')).toHaveText('Ben');
    // rollup-total-load: Ada 150 + Ben 348 + Cy 500 + Hela 750 (half of 1500) + Sol 20 = 1768; leave out the highest contribution, Hela's 750 -> 1018
    await expect(page.getByTestId('rollup-total-load')).toHaveText('1018');
    await expect(row(3).getByTestId('concept-backing')).toHaveText('n/a');
    await expect(row(3).getByTestId('concept-clout')).toHaveText('0');
    await expect(row(3).getByTestId('concept-net')).toHaveText('100');
    await expect(page.getByTestId('band-count-B')).toHaveText('0');
    await expect(page.getByTestId('band-count-C')).toHaveText('2');
    await expect(page.getByTestId('band-count-D')).toHaveText('2');

    await page.getByTestId('sheet-as-of-clear').click();

    await expect(row(1).getByTestId('person-beta')).toHaveText('50');
    await expect(row(1).getByTestId('concept-momentum')).toHaveText('250');
    await expect(row(3).getByTestId('concept-momentum')).toHaveText('70');
    await expect(row(9).getByTestId('concept-momentum')).toHaveText('50');
    await expect(row(1).getByTestId('concept-tier')).toHaveText('SURGE');
    await expect(row(9).getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(row(1).getByTestId('concept-rank')).toHaveText('1');
    await expect(row(2).getByTestId('concept-rank')).toHaveText('2');
    await expect(row(3).getByTestId('concept-rank')).toHaveText('3');
    await expect(row(9).getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-leader')).toHaveText('Ada');
    // rollup-total-load: Ada 750 + Ben 348 + Cy 350 + Hela 125 (half of 250) + Sol 20 = 1593; leave out the highest contribution, Ada's 750 -> 843
    await expect(page.getByTestId('rollup-total-load')).toHaveText('843');
    await expect(row(3).getByTestId('concept-backing')).toHaveText('180');
    await expect(row(3).getByTestId('concept-clout')).toHaveText('174');
    await expect(row(3).getByTestId('concept-net')).toHaveText('250');
    await expect(page.getByTestId('band-count-B')).toHaveText('2');
    await expect(page.getByTestId('band-count-C')).toHaveText('1');
    await expect(page.getByTestId('band-count-D')).toHaveText('1');
  });
});
