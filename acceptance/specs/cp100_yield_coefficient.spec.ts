import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// follow.
//   yield: Ada 66+96=162, Ben -6+0=-6, Dot 500+1200=1700
//   grip: Ada 162-81=81, Ben -6-(-6)=0, Dot 1700-200=1500 ; total 162-6+1700=1856

test.describe('yield coefficient raised to 2', () => {
  test('yield = pivot + 2*lift; grip and total follow', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-yield')).toHaveText('162');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-yield')).toHaveText('-6');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-yield')).toHaveText('1700');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-grip')).toHaveText('81');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-grip')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-grip')).toHaveText('1500');

    await expect(page.getByTestId('rollup-total-yield')).toHaveText('1856');
  });
});
