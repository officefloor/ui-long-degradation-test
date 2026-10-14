import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// `person-rework-<id>`, and a REWORK person back to FINAL via `person-advance-<id>`. Both changes are
// audited. FINAL is therefore no longer terminal (cp57 asserted no rework control existed; the
test.describe('rework state', () => {
  test('FINAL can move to REWORK and back, with audit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [{ id: 1, name: 'Al', alpha: 5, beta: 20, gamma: 5, state: 'FINAL' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');

    await page.getByTestId('person-rework-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REWORK');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');

    const lines = auditLines();
    expect(lines).toContain('STATE_CHANGED id=1 from=FINAL to=REWORK');
    expect(lines).toContain('STATE_CHANGED id=1 from=REWORK to=FINAL');
  });
});
