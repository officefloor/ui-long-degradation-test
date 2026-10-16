import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A shared person's history is shared: a dated change made on any sheet they are on is the same
// change everywhere, listed in `person-history` on every sheet. But each sheet reads that history on
// its own date: its own anchor, or the as-of date applied on that sheet. An as-of date belongs to the
// sheet it was applied on: opening another sheet shows that sheet on its own date, and coming back
// shows the first sheet still as of its date, until it is cleared (or the page is reloaded).
// momentum = alpha * beta + 3 * (gamma - alpha); momentum change = momentum on the anchor minus
// momentum on the as-of date.
//   Dana starts at alpha 3, beta 4, gamma 10: momentum 12 + 21 = 33; alpha 9 from 2026-02-15.
//   S1's anchor is 2026-03-01 (the change counts there); S2's anchor is 2026-02-01 (not yet).
test.describe('shared history, each sheet on its own date', () => {
  test('one shared history, read on each sheet\'s own date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        ], history: [
          { personId: 1, field: 'alpha', value: 9, from: '2026-02-15' },
        ] },
        { id: 'S2', anchor: '2026-02-01', people: [
          { id: 1, name: 'Kai', alpha: 2, beta: 3, gamma: 5, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ sheetId: 'S2', personId: 5, fromSheetId: 'S1', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const open = async (id: string) => {
      await page.getByTestId('sheet-id-input').fill(id);
      await page.getByTestId('sheet-load').click();
    };

    // S1, on 2026-03-01: alpha 9 -> 36 + 3 * 1 = 39
    await open('S1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('39');
    await expect(page.getByTestId('person-row-1').getByTestId('person-history')).toHaveText('2026-02-15 alpha 9');
    // S2, on 2026-02-01: the same change is listed but has not started -> 33
    await open('S2');
    await expect(page.getByTestId('person-row-5').getByTestId('person-alpha')).toHaveText('3');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('33');
    await expect(page.getByTestId('person-row-5').getByTestId('person-history')).toHaveText('2026-02-15 alpha 9');

    // a change made on S2 is shared: gamma 20 from 2026-01-20, before both anchors
    await page.getByTestId('person-edit-5').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Dana');
    await page.getByTestId('person-form-gamma').fill('20');
    await page.getByTestId('person-form-effective-date').fill('2026-01-20');
    await page.getByTestId('person-form-submit').click();
    // S2: alpha 3, gamma 20 -> 12 + 3 * 17 = 63
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('63');

    // as of 2026-01-10 on S2: alpha 3, gamma 10 -> 33; change 63 - 33 = 30
    await page.getByTestId('sheet-as-of').fill('2026-01-10');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('33');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum-change')).toHaveText('30');

    // S1 is not moved by S2's as-of date: on 2026-03-01, alpha 9, gamma 20 -> 36 + 3 * 11 = 69
    await open('S1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('69');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum-change')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-1').getByTestId('person-history')).toHaveText('2026-02-15 alpha 9; 2026-01-20 gamma 20');

    // back on S2, its as-of date is still applied
    await open('S2');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('33');
    await page.getByTestId('sheet-as-of-clear').click();
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('63');
  });
});
