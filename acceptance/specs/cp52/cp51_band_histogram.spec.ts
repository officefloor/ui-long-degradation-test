import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp52 (mutates cp51). Histogram under the recalibrated bands:
//   Ed -6 E, Di 30 D, Cy 100 C, Cz 120 C, Bo 200 C, An 400 B -> A0 B1 C3 D1 E1
const SEED = {
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true },
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true },
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true },
    { id: 4, name: 'Cz', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 5, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true },
    { id: 6, name: 'An', alpha: 20, beta: 20, gamma: 20, active: true },
  ],
};

test.describe('band histogram', () => {
  test('counts people per band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('band-count-A')).toHaveText('0');
    await expect(page.getByTestId('band-count-B')).toHaveText('1');
    await expect(page.getByTestId('band-count-C')).toHaveText('3');
    await expect(page.getByTestId('band-count-D')).toHaveText('1');
    await expect(page.getByTestId('band-count-E')).toHaveText('1');
  });
});
