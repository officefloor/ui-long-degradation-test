import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Saving a person's editor writes one audit line for each detail that actually changed:
//   CHANGED id=<id> field=<field> from=<old> to=<new>
// for any number, the name, the grade and the onset. Each value is written as the row shows it, and
// a blank value is written as nothing (from=). A detail saved with the value it already had writes
// nothing, and alpha is recorded this way too (no separate alpha line). Age stays in whole days.
//
// Anchor 2026-03-01.
//   Dana before: alpha 3, beta 4, gamma 10, LOW, onset 2026-02-01
//   Dana after:  alpha 8, beta 5, gamma 10, HIGH, onset 2026-02-15
//     thrust 8*5 = 40, drift 10-8 = 2, momentum 40 + 3*2 = 46, weight 5, load 46*5 = 230
//     age 2026-02-15 -> 2026-03-01 = 14 days, decay 46-14 = 32
//   Ravi: alpha 2, beta 5, gamma 6, MID, no onset
//     thrust 10, drift 4, momentum 10 + 3*4 = 22, weight 3 (4 where the sheet weighs MID at 4)
// A change dated after the anchor does not count yet: Ravi's gamma 16 from 2026-04-01.
test.describe('audit everything', () => {
  test('every changed number, the grade and the onset each write one line', { tag: '@functionality' }, async ({ page }) => {
    // This sheet weighs LOW 1, MID 4, HIGH 5: Ravi's load 22*4 = 88.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 10, LOW, load 10).
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 1, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10, grade: 'LOW', onset: '2026-02-01' },
        { id: 2, name: 'Ravi', alpha: 2, beta: 5, gamma: 6,  grade: 'MID' },
        { id: 9, name: 'Hela', alpha: 5, beta: 5, gamma: 5,  grade: 'LOW', hold: true }, // on hold: load 25, half 12.5 -> 13
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'gamma', value: 16, from: '2026-04-01' }],
    });
    await page.goto('/');

    await page.getByTestId('person-edit-1').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Dana');
    await page.getByTestId('person-form-alpha').fill('8');
    await page.getByTestId('person-form-beta').fill('5');
    await page.getByTestId('person-form-gamma').fill('10');
    await page.getByTestId('person-form-grade').fill('HIGH');
    await page.getByTestId('person-form-onset').fill('2026-02-15');
    await page.getByTestId('person-form-submit').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('40');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('46');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('230');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-age')).toHaveText('14');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-decay')).toHaveText('32');
    // rollup-total-load: Dana 230 + Ravi 88 + Hela 13 (half of 25) + Sol 10 = 341; leave out the highest contribution, Dana's 230 -> 111
    await expect(page.getByTestId('rollup-total-load')).toHaveText('101');

    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=alpha from=3 to=8');
    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=beta from=4 to=5');
    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=grade from=LOW to=HIGH');
    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=onset from=2026-02-01 to=2026-02-15');
    // gamma was saved unchanged: no line for it; alpha has no separate alpha line
    expect(auditLines()).not.toContain('CHANGED id=1 field=gamma from=10 to=10');
    expect(auditLines()).not.toContain('ALPHA_CHANGED id=1 from=3 to=8');
  });

  test('a name change and a first onset are recorded, a blank value as nothing', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10, grade: 'LOW', onset: '2026-02-01' },
        { id: 2, name: 'Ravi', alpha: 2, beta: 5, gamma: 6,  grade: 'MID' },
      ],
      history: [{ personId: 2, field: 'gamma', value: 16, from: '2026-04-01' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-age')).toHaveText('n/a');

    await page.getByTestId('person-edit-2').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Ravi');
    await page.getByTestId('person-form-name').fill('Rafa');
    await page.getByTestId('person-form-onset').fill('2026-02-22');
    await page.getByTestId('person-form-submit').click();

    // onset 2026-02-22 -> 2026-03-01 = 7 days; decay 22 - 7 = 15
    await expect(page.getByTestId('person-row-2').getByTestId('person-name')).toHaveText('Rafa');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-age')).toHaveText('7');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-decay')).toHaveText('15');

    await expect.poll(() => auditLines()).toContain('CHANGED id=2 field=name from=Ravi to=Rafa');
    await expect.poll(() => auditLines()).toContain('CHANGED id=2 field=onset from= to=2026-02-22');
  });
});
