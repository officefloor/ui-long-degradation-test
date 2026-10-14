import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE REVERSAL (mutates cp26, cp27, cp28): age goes back to whole DAYS from onset to anchor
// (undoing the weeks change of cp28). decay = momentum - age follows. Updated cp26/cp27/cp28 ship
// under acceptance/specs/cp244/ with the day-based values restored.
test.describe('age reverted to days', () => {
  test('age is whole days again and decay follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2020-01-31',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, onset: '2020-01-01' }, // 30 days; decay 33-30=3
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  onset: '2020-01-24' }, //  7 days; decay 8-7=1
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  onset: '2020-02-10' }, // -10 days; decay 100-(-10)=110
        { id: 4, name: 'Zoe',  alpha: 2, beta: 10, gamma: 2,  onset: '2020-01-17' }, // 14 days; decay 20-14=6
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-age')).toHaveText('30');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-age')).toHaveText('7');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-age')).toHaveText('-10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-age')).toHaveText('14');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-decay')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-decay')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-decay')).toHaveText('110');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-decay')).toHaveText('6');
  });
});
