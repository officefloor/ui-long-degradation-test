import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp08 (mutates cp05). Same seed as the original cp05, but under the
// recalibrated thresholds (STEADY 0..199, SURGE >= 200) the momentum-100 person is now STEADY.
test.describe('tier', () => {
  test('tier classifies momentum including the boundaries', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Sia',  alpha: 2, beta: 1,  gamma: 0 },  // momentum -4  -> SINK
        { id: 2, name: 'Zed',  alpha: 1, beta: 3,  gamma: 0 },  // momentum 0   -> STEADY
        { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // momentum 33  -> STEADY
        { id: 4, name: 'Pat',  alpha: 3, beta: 33, gamma: 3 },  // momentum 99  -> STEADY
        { id: 5, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // momentum 100 -> STEADY (was SURGE under cp05)
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tier')).toHaveText('SINK');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-tier')).toHaveText('STEADY');
  });
});
