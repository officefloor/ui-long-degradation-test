import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// momentum change = momentum now - momentum on the as-of date, at `concept-momentum-change`. "Now" is
// always the anchor date (2026-03-01), even when the as-of date is after it. n/a when no as-of date
// is chosen, or when either momentum cannot be worked out. A change dated exactly on the as-of date
// counts on that date. momentum = alpha*beta + 3*(gamma - alpha), from the numbers in force on a date.
//
//                     now (2026-03-01)          as of 2026-02-01          change   as of 2026-04-15  change
//   Ada  b10->50 @02-15  5*50 + 0 = 250            5*10 + 0 = 50             200      250               0
//   Ben  no changes      40                        40                        0        40                0
//   Cy   g10->0  @02-15  100 + 3*(-10) = 70        100                       -30      70                0
//   Dee  b blank->10 @02-10  30 + 0 = 30           beta blank -> n/a         n/a      30                0
//   Eve  a4->6   @02-01  60 + 3*(-2) = 54          54 (counts on the day)    0        54                0
//   Fay  b10->20 @04-01  20 (after the anchor)     20                        0        40               -20
//   Hela b10->20 @02-15  200 + 0 = 200             100                       100      200               0
// Hela is on hold: she still shows all of her own figures, momentum change included.

test.describe('momentum change', () => {
  test('momentum now minus momentum on the as-of date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 5,  beta: 10,   gamma: 5 },
        { id: 2, name: 'Ben', alpha: 4,  beta: 10,   gamma: 4 },
        { id: 3, name: 'Cy',  alpha: 10, beta: 10,   gamma: 10 },
        { id: 4, name: 'Dee', alpha: 3,  beta: null, gamma: 3 },
        { id: 5, name: 'Eve', alpha: 4,  beta: 10,   gamma: 4 },
        { id: 6, name: 'Fay', alpha: 2,  beta: 10,   gamma: 2 },
        { id: 9, name: 'Hela', alpha: 10, beta: 10,  gamma: 10, hold: true },
      ],
      history: [
        { personId: 1, field: 'beta',  value: 50, from: '2026-02-15' },
        { personId: 3, field: 'gamma', value: 0,  from: '2026-02-15' },
        { personId: 4, field: 'beta',  value: 10, from: '2026-02-10' },
        { personId: 5, field: 'alpha', value: 6,  from: '2026-02-01' },
        { personId: 6, field: 'beta',  value: 20, from: '2026-04-01' },
        { personId: 9, field: 'beta',  value: 20, from: '2026-02-15' },
      ],
    });
    await page.goto('/');
    const change = (id: number) => page.getByTestId(`person-row-${id}`).getByTestId('concept-momentum-change');

    // no as-of date chosen: n/a for everyone
    await expect(change(1)).toHaveText('n/a');
    await expect(change(2)).toHaveText('n/a');

    await page.getByTestId('sheet-as-of').fill('2026-02-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(change(1)).toHaveText('200');
    await expect(change(2)).toHaveText('0');
    await expect(change(3)).toHaveText('-30');
    await expect(change(4)).toHaveText('n/a');
    await expect(change(5)).toHaveText('0');
    await expect(change(6)).toHaveText('0');
    await expect(change(9)).toHaveText('100');
    // momentum itself shows the as-of value
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('50');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-momentum')).toHaveText('n/a');

    // an as-of date after the anchor: "now" is still the anchor
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(change(1)).toHaveText('0');
    await expect(change(4)).toHaveText('0');
    await expect(change(6)).toHaveText('-20');
    await expect(change(9)).toHaveText('0');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-momentum')).toHaveText('40');

    await page.getByTestId('sheet-as-of-clear').click();
    await expect(change(1)).toHaveText('n/a');
    await expect(change(6)).toHaveText('n/a');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-momentum')).toHaveText('20');
  });
});
