import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// clout = total of the effective of all a person's patrons. No patrons -> 0.
// All people active, so effective = net = momentum + backing(sum of patrons' thrust).
//   Uma thrust100 mom100 net100 eff100  (no patrons)
//   Ivo thrust60  mom60  net60  eff60   (no patrons)
//   Dana thrust12 mom33  patron Uma -> backing 100 -> net 133 -> eff133
//   Kai  thrust10 mom10  patrons Dana,Ivo -> backing 12+60=72 -> net 82 -> eff82
// clout: Uma 0, Ivo 0, Dana = eff(Uma)=100, Kai = eff(Dana)+eff(Ivo)=133+60=193
const SEED = {
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },                             // Dana <- Uma
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },// Kai  <- Dana, Ivo
  ],
};

test.describe('clout', () => {
  test('clout sums the patrons effective', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-clout')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-clout')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-clout')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-clout')).toHaveText('193');
  });
});
