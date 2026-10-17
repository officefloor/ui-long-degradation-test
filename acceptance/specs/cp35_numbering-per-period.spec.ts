import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("numbering per period", () => {
  test("numbering per period", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-15");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-11", "to": "2026-03-20"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00", "date": "2026-03-05"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "2.00"}));
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "3.00", "date": "2026-03-25"}));
    const c_ada_3 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "4.00", "date": "2026-03-06"}));
    const c_ada_4 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "5.00", "date": "2026-03-12"}));
    const c_ada_5 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "6.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-16");
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-15");
    expect(await ui.claimAction(pg_uma, c_ada_2, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_3, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_4, "open")).toBe(true);
    await ui.setSetting(pg_uma, "period-numbering-from", "");
    expect(await ui.claimAction(pg_uma, c_ada_5, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-number")).toHaveText("3");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-number")).toHaveText("P2-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("P1-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("P1");
    ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-11 to=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=2.00 date=2026-03-15`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=3.00 date=2026-03-25`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-06`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-12`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=6.00 date=2026-03-15`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-05 number=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-16`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=2.00 date=2026-03-15 number=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-15`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=3.00 date=2026-03-25 number=X-1`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-06 number=P1-1`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-12 number=P2-1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=6.00 date=2026-03-15 number=3`
    ]);
  });
});
