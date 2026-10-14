import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// leftover days (truncated toward zero, so -10 days is -1 week). decay = momentum - age follows.
test.describe('age in weeks', () => {
  test('age is complete weeks and decay follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2020-01-31',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, onset: '2020-01-01' }, // 30d -> 4w;  decay 33-4=29
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  onset: '2020-01-24' }, //  7d -> 1w;  decay 8-1=7
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  onset: '2020-02-10' }, // -10d -> -1w; decay 100-(-1)=101
        { id: 4, name: 'Zoe',  alpha: 2, beta: 10, gamma: 2,  onset: '2020-01-17' }, // 14d -> 2w;  decay 20-2=18
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-age')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-age')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-age')).toHaveText('-1');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-age')).toHaveText('2');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-decay')).toHaveText('29');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-decay')).toHaveText('7');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-decay')).toHaveText('101');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-decay')).toHaveText('18');
  });
});
