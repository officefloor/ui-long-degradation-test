import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   momentum < 0          -> SINK
//   0 <= momentum <= 199   -> STEADY   (was 0..99)
//   momentum >= 200        -> SURGE    (was >= 100)
test.describe('tier recalibrated', () => {
  test('tier uses the new wider STEADY band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Sia', alpha: 2,  beta: 1,   gamma: 0 },  // momentum -4  -> SINK
        { id: 2, name: 'Uma', alpha: 5,  beta: 20,  gamma: 5 },  // momentum 100 -> STEADY (was SURGE)
        { id: 3, name: 'Lee', alpha: 1,  beta: 199, gamma: 1 },  // thrust 199, drift 0, momentum 199 -> STEADY
        { id: 4, name: 'Max', alpha: 10, beta: 20,  gamma: 10 }, // thrust 200, drift 0, momentum 200 -> SURGE
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tier')).toHaveText('SINK');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tier')).toHaveText('STEADY');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tier')).toHaveText('SURGE');
  });
});
