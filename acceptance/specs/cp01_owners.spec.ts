import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// ── data-testid conventions used by every spec (the stable contract; DESIGN.md §3) ────────────
//   table              <entity>s-table            e.g. owners-table
//   unique row         <entity>-row-<id>          e.g. owner-row-1     (id = the seeded/created id)
//   cell within a row  <entity>-<field>           e.g. owner-name      (generic; scoped by the row)
//   empty state        <entity>s-empty            e.g. owners-empty
//   form field         <entity>-form-<field>      e.g. owner-form-email
//   form submit        <entity>-form-submit
//   field error        <entity>-form-<field>-error
//   nav link           nav-<section>              e.g. nav-owners
//   open detail        <entity>-open-<id>         e.g. project-open-1
// Seed fixture shape (grows over the run): { owners:[{id,name,email}], projects:[{id,name,ownerId}],
//   invoices:[{id,projectId,amount,status?}] }. Navigation is via nav-* clicks, never URL paths.

test.describe('owners', () => {
  test('lists seeded owners', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      owners: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();

    await expect(page.getByTestId('owners-table')).toBeVisible();
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(2);
    await expect(page.getByTestId('owner-row-1').getByTestId('owner-name')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('owner-row-1').getByTestId('owner-email')).toHaveText('ops@acme.example');
    await expect(page.getByTestId('owner-row-2').getByTestId('owner-name')).toHaveText('Globex');
  });

  test('creates an owner', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ owners: [] });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();
    await expect(page.getByTestId('owners-empty')).toBeVisible();

    await page.getByTestId('owner-form-name').fill('Initech');
    await page.getByTestId('owner-form-email').fill('billing@initech.example');
    await page.getByTestId('owner-form-submit').click();

    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^owner-row-/).first();
    await expect(row.getByTestId('owner-name')).toHaveText('Initech');
    await expect(row.getByTestId('owner-email')).toHaveText('billing@initech.example');
  });
});
