import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The AUDIT-FILE channel: editing a person's alpha recomputes the concepts in the UI AND writes one
// audit record. Audit line format: CHANGED id=<id> field=<field> from=<old> to=<new>.
test.describe('alpha change audit', () => {
  test('changing alpha updates concepts and writes an audit record', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }, // thrust 12, momentum 33
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('12');

    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-alpha').fill('8');
    await page.getByTestId('person-form-submit').click();

    // alpha 8, beta 4 -> thrust 32; drift 10-8=2; momentum 32 + 3*2 = 38
    await expect(page.getByTestId('person-row-1').getByTestId('person-alpha')).toHaveText('8');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('32');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('38');

    expect(auditLines()).toContain('CHANGED id=1 field=alpha from=3 to=8');
  });
});
