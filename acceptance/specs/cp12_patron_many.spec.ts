import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// changes: patrons are now a join list `patrons: [{ personId, patronId }]` (the per-person patronId
// field is gone). patrons cell lists all patron names sorted ascending. backing = SUM of all
// patrons' thrust (still 'n/a' when a person has no patrons). net = momentum + backing (0 if n/a).
test.describe('many patrons', () => {

  test('patrons list all names sorted', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
    people: [
      { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // thrust 12, momentum 33
      { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // thrust 14, momentum 8
      { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // thrust 100, momentum 100
      { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2 },  // thrust 10, momentum 10
    ],
    patrons: [
      { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },               // Dana <- Ravi,Uma
      { personId: 4, patronId: 1 }, { personId: 4, patronId: 2 }, { personId: 4, patronId: 3 }, // Kai <- Dana,Ravi,Uma
      { personId: 3, patronId: 4 },                                             // Uma <- Kai
    ],
  });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-patrons')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-4').getByTestId('person-patrons')).toHaveText('Dana, Ravi, Uma');
    await expect(page.getByTestId('person-row-3').getByTestId('person-patrons')).toHaveText('Kai');
    await expect(page.getByTestId('person-row-2').getByTestId('person-patrons')).toHaveText('');
  });

  test('backing sums all patron thrust; net adds it to momentum', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
    people: [
      { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // thrust 12, momentum 33
      { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // thrust 14, momentum 8
      { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // thrust 100, momentum 100
      { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2 },  // thrust 10, momentum 10
    ],
    patrons: [
      { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },               // Dana <- Ravi,Uma
      { personId: 4, patronId: 1 }, { personId: 4, patronId: 2 }, { personId: 4, patronId: 3 }, // Kai <- Dana,Ravi,Uma
      { personId: 3, patronId: 4 },                                             // Uma <- Kai
    ],
  });
    await page.goto('/');

    // backing: Dana 14+100=114, Kai 12+14+100=126, Uma 10, Ravi none -> n/a
    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('114');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-backing')).toHaveText('126');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-backing')).toHaveText('10');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-backing')).toHaveText('n/a');

    // net = momentum + backing (0 if n/a): Dana 33+114=147, Kai 10+126=136, Uma 100+10=110, Ravi 8
    await expect(page.getByTestId('person-row-1').getByTestId('concept-net')).toHaveText('147');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-net')).toHaveText('136');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-net')).toHaveText('110');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-net')).toHaveText('8');
  });
});
