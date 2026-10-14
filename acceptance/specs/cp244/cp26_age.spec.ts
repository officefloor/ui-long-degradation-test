import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

test.describe('age in days', () => {
  test('age is whole days from onset to anchor', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2020-01-31',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, onset: '2020-01-01' }, //  30
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  onset: '2020-01-24' }, //   7
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  onset: '2020-02-10' }, // -10
        { id: 4, name: 'Zoe',  alpha: 2, beta: 10, gamma: 2,  onset: '2020-01-17' }, //  14
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-age')).toHaveText('30');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-age')).toHaveText('7');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-age')).toHaveText('-10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-age')).toHaveText('14');
  });
});
