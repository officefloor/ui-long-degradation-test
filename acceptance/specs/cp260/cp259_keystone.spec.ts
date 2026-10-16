import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keystone = ballast + adjusted. ballast: Ada 670, Ben 250, Cam 1160, Dot 265.
// adjusted: Ada 60, Ben 120, Cam 300, Dot 45. keystone: Ada 730, Ben 370, Cam 1460, Dot 310.
// keystone-apex names the person who counts with the highest keystone (ties by name) -> Cam (1460).

test.describe('keystone, ballast plus adjusted', () => {
  test('shows keystone and names its apex', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 670 + 60  = 730
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 250 + 120 = 370
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 1160 + 300 = 1460
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 265 + 45  = 310
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
      rivals: [{ from: 1, to: 2 }, { from: 1, to: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-keystone')).toHaveText('430');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keystone')).toHaveText('370');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keystone')).toHaveText('1460');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keystone')).toHaveText('310');

    await expect(page.getByTestId('rollup-keystone-apex')).toHaveText('Cam');
  });
});
