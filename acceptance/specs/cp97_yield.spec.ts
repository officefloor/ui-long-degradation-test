import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// yield = pivot + lift.
//   pivot = torque*verge (verge A=1,B=2,C=4): Ada 33*1=33, Ben -2*2=-4, Dot 100*4=400
//   lift = blend*drag-mult (L1 for 0..49 =1, L0 for <0 =0, L3 for >=150 =3):
//     blend Ada 48 -> L1 -> 48 ; Ben -3 -> L0 -> 0 ; Dot 200 -> L3 -> 600
//   yield: Ada 33+48=81, Ben -4+0=-4, Dot 400+600=1000

test.describe('yield', () => {
  test('yield is pivot plus lift', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-yield')).toHaveText('81');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-yield')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-yield')).toHaveText('1000');
  });
});
