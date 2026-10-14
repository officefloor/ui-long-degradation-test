import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Classification concept: tier from momentum (momentum = thrust + 3*drift, per cp04).
//   momentum < 0        -> SINK
//   0 <= momentum <= 99  -> STEADY
//   momentum >= 100      -> SURGE
test.describe('tier', () => {
  test('tier classifies momentum including the boundaries', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Sia',  alpha: 2, beta: 1,  gamma: 0 },  // thrust 2,  drift -2, momentum -4  -> SINK
        { id: 2, name: 'Zed',  alpha: 1, beta: 3,  gamma: 0 },  // thrust 3,  drift -1, momentum 0   -> STEADY
        { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // thrust 12, drift 7,  momentum 33  -> STEADY
        { id: 4, name: 'Pat',  alpha: 3, beta: 33, gamma: 3 },  // thrust 99, drift 0,  momentum 99  -> STEADY
        { id: 5, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // thrust 100, drift 0, momentum 100 -> SURGE
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tier')).toHaveText('SINK');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-tier')).toHaveText('SURGE');
  });
});
