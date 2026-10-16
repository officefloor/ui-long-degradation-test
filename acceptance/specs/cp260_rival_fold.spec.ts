import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person now keeps only ONE rival: the one whose name comes first alphabetically.
// Ada's rivals were Ben and Cam; she now keeps Ben (Ben < Cam). So ripple = cascade + influence(Ben).
// Ada: cascade 310 + influence(Ben) 120 = 430. ballast = 430 - combined 60 = 370; keystone = 370 + 60 = 430.
// Ben keeps Ada (his only rival either way): ripple 310 + 60 = 370, unchanged. Cam keeps Ada: 1460.

test.describe('a person keeps one rival', () => {
  test('folds many rivals down to the first by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
      rivals: [{ from: 1, to: 2 }, { from: 1, to: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ripple')).toHaveText('430');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-ballast')).toHaveText('370');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-keystone')).toHaveText('430');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ripple')).toHaveText('1460');
  });
});
