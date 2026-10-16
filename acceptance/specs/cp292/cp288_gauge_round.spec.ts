import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446
// draft = keel + scaled (capped at 2000 later): 550, 910, 2000, 490  [scaled: 60, 240, 900, 45]
// mast = keel * 2 (then * 3): 1470, 2010, 3630, 1335
// hawser = keel + 2: 490, 670, 1210, 445
// gangway = keel * 4 (then * 5): 1960, 2680, 4840, 1780

test.describe('every gauge rounds down to a five', () => {
  test('computes gauge round', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('550');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('910');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('2000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('490');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-mast')).toHaveText('1470');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-mast')).toHaveText('2010');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-mast')).toHaveText('3630');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-mast')).toHaveText('1335');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-hawser')).toHaveText('490');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-hawser')).toHaveText('670');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-hawser')).toHaveText('1210');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-hawser')).toHaveText('445');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-gangway')).toHaveText('2455');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gangway')).toHaveText('3355');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-gangway')).toHaveText('6055');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-gangway')).toHaveText('2230');
  });
});
