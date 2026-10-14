import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// allies: a symmetric many-to-many link. Seeded as `allies: [{ a, b }]` meaning a and b are allies
// of each other. person-allies lists ally names sorted; person-ally-count is how many.

test.describe('allies', () => {
  test('allies are symmetric and counted', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
  ],
  allies: [
    { a: 1, b: 2 }, // Dana <-> Ravi
    { a: 1, b: 3 }, // Dana <-> Uma
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-allies')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-2').getByTestId('person-allies')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-3').getByTestId('person-allies')).toHaveText('Dana');

    await expect(page.getByTestId('person-row-1').getByTestId('person-ally-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-ally-count')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('person-ally-count')).toHaveText('1');
  });
});
