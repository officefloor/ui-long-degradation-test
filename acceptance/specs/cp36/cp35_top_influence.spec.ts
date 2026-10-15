import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


test.describe('top influence', () => {
  test('names the highest-influence person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Dana');
  });

  // Dedicated tie-break coverage: two people TIED on influence; the tie goes to the
  // alphabetically-first name. No patrons -> clout 0 (average of no patrons is still 0); all active
  // -> effective = net = momentum; influence = effective + clout.
  //   Zara thrust 5*20=100, drift 5-5=0, momentum 100+3*0=100 -> influence 100
  //   Alan thrust 5*20=100, drift 0,     momentum 100          -> influence 100  (tie with Zara)
  //   Bea  thrust 2*5=10,   drift 0,     momentum 10           -> influence 10
  //   top influence 100 ties Zara/Alan -> 'Alan' (name asc), despite Zara being seeded first
  test('top influence tie is broken by name ascending', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Zara', alpha: 5, beta: 20, gamma: 5, active: true },
    { id: 2, name: 'Alan', alpha: 5, beta: 20, gamma: 5, active: true },
    { id: 3, name: 'Bea',  alpha: 2, beta: 5,  gamma: 2, active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Alan');
  });
});
