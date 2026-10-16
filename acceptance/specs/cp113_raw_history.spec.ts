import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Dated changes. The editor has a date box `person-form-effective-date` (it starts blank; blank means
// the sheet's anchor date). A change to alpha, beta or gamma is kept with its date instead of
// overwriting the number; only the numbers actually changed are recorded. A person's `people` value is
// their starting value, before any change. Seeded history is `history: [{ personId, field, value, from }]`.
// `person-history` lists every change newest first as `<date> <field> <value>` joined by "; "; changes
// on the same date go alpha, beta, gamma; no changes shows empty text.
// The numbers shown and every figure use, per number, the latest change dated ON OR BEFORE the anchor
// (a change dated exactly on the anchor counts), else the starting value. Later-dated changes are
// listed but do not count yet.

test.describe('raw history', () => {
  test('dated edits are kept, listed newest first, and the latest on or before the anchor counts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }, // thrust 12, momentum 12 + 3*7 = 33
        { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 },  // no changes
      ],
    });
    await page.goto('/');
    const dana = page.getByTestId('person-row-1');
    await expect(dana.getByTestId('concept-momentum')).toHaveText('33');

    // alpha 9 from 2026-02-01: alpha 9 -> thrust 9*4=36, drift 10-9=1, momentum 36 + 3*1 = 39
    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-alpha').fill('9');
    await page.getByTestId('person-form-effective-date').fill('2026-02-01');
    await page.getByTestId('person-form-submit').click();
    await expect(dana.getByTestId('person-alpha')).toHaveText('9');
    await expect(dana.getByTestId('concept-momentum')).toHaveText('39');

    // alpha 5 from 2026-01-10 is entered later but dated earlier: 2026-02-01 is still the latest change
    // on or before the anchor, so alpha stays 9 and momentum stays 39 (taking the last one typed would
    // give 5*4 + 3*5 = 35)
    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-alpha').fill('5');
    await page.getByTestId('person-form-effective-date').fill('2026-01-10');
    await page.getByTestId('person-form-submit').click();
    await expect(dana.getByTestId('person-history')).toHaveText('2026-02-01 alpha 9; 2026-01-10 alpha 5');
    await expect(dana.getByTestId('person-alpha')).toHaveText('9');
    await expect(dana.getByTestId('concept-momentum')).toHaveText('39');

    // beta 6 with the date left blank takes effect on the anchor 2026-03-01, which counts:
    // thrust 9*6=54, drift 1, momentum 54 + 3 = 57
    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-beta').fill('6');
    await page.getByTestId('person-form-submit').click();
    await expect(dana.getByTestId('person-beta')).toHaveText('6');
    await expect(dana.getByTestId('concept-thrust')).toHaveText('54');
    await expect(dana.getByTestId('concept-momentum')).toHaveText('57');

    // gamma 20 from 2026-04-01 is after the anchor: listed, but gamma stays 10 and momentum stays 57
    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-gamma').fill('20');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(dana.getByTestId('person-history'))
      .toHaveText('2026-04-01 gamma 20; 2026-03-01 beta 6; 2026-02-01 alpha 9; 2026-01-10 alpha 5');
    await expect(dana.getByTestId('person-gamma')).toHaveText('10');
    await expect(dana.getByTestId('concept-momentum')).toHaveText('57');
    await expect(dana.getByTestId('concept-tier')).toHaveText('STEADY'); // 57 is 0..199
    await expect(page.getByTestId('person-row-2').getByTestId('person-history')).toHaveText('');

    // the history is kept
    await page.reload();
    await expect(page.getByTestId('person-row-1').getByTestId('person-history'))
      .toHaveText('2026-04-01 gamma 20; 2026-03-01 beta 6; 2026-02-01 alpha 9; 2026-01-10 alpha 5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('57');
  });

  test('seeded history: same-date order, and a change on the anchor counts', { tag: '@functionality' }, async ({ page }) => {
    // Uma starts at alpha 5, beta 20, gamma 5. On the anchor 2026-03-01 the latest of each number is
    // alpha 6 (2026-03-01; the 2026-03-02 change is later), beta 10 (2026-01-15), gamma 8 (2026-03-01).
    // thrust 6*10=60, drift 8-6=2, momentum 60 + 3*2 = 66
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 3, name: 'Uma', alpha: 5, beta: 20, gamma: 5 },
        { id: 4, name: 'Kai', alpha: 2, beta: 5,  gamma: 2 }, // no history: thrust 10, momentum 10
      ],
      history: [
        { personId: 3, field: 'beta',  value: 10, from: '2026-01-15' },
        { personId: 3, field: 'gamma', value: 8,  from: '2026-03-01' },
        { personId: 3, field: 'alpha', value: 6,  from: '2026-03-01' },
        { personId: 3, field: 'alpha', value: 7,  from: '2026-03-02' },
      ],
    });
    await page.goto('/');
    const uma = page.getByTestId('person-row-3');

    await expect(uma.getByTestId('person-history'))
      .toHaveText('2026-03-02 alpha 7; 2026-03-01 alpha 6; 2026-03-01 gamma 8; 2026-01-15 beta 10');
    await expect(uma.getByTestId('person-alpha')).toHaveText('6');
    await expect(uma.getByTestId('person-beta')).toHaveText('10');
    await expect(uma.getByTestId('person-gamma')).toHaveText('8');
    await expect(uma.getByTestId('concept-thrust')).toHaveText('60');
    await expect(uma.getByTestId('concept-momentum')).toHaveText('66');

    await expect(page.getByTestId('person-row-4').getByTestId('person-history')).toHaveText('');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-momentum')).toHaveText('10');
  });
});
