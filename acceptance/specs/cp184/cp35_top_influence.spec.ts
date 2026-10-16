import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


test.describe('top influence', () => {
  // Hela is on hold: left out of the top name (her influence 300 would tie Sol's at the top).
  test('names the highest-influence person', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his influence 300 is the highest
    await resetAndSeed({
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
    { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, active: true, hold: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Sol');
  });

  // Two people TIED on influence are both named, joined by ", " in alphabetical order. No patrons
  // -> clout 0 (average of no patrons is still 0); all active
  // -> effective = net = momentum; influence = effective + clout.
  //   Zara thrust 5*20=100, drift 5-5=0, momentum 100+3*0=100 -> influence 100
  //   Alan thrust 5*20=100, drift 0,     momentum 100          -> influence 100  (tie with Zara)
  //   Bea  thrust 2*5=10,   drift 0,     momentum 10           -> influence 10
  //   Hela (on hold) influence 100: left out, though level with them
  //   top influence 100 ties Zara/Alan -> 'Alan, Zara' (name order, though Zara is seeded first)
  test('names everyone tied for the top influence', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his influence 100 ties with Alan and Zara
    await resetAndSeed({
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  people: [
    { id: 1, name: 'Zara', alpha: 5, beta: 20, gamma: 5, active: true },
    { id: 2, name: 'Alan', alpha: 5, beta: 20, gamma: 5, active: true },
    { id: 3, name: 'Bea',  alpha: 2, beta: 5,  gamma: 2, active: true },
    { id: 9, name: 'Hela', alpha: 5, beta: 20, gamma: 5, active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Alan, Sol, Zara');
  });
});
