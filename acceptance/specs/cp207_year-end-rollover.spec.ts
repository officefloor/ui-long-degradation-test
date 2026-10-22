import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("year end rollover", () => {
  test("year end rollover", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-11-20");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    expect(await ui.generateFy(pg_uma, "2026")).toBe(12);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-11-05"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00", "date": "2026-12-05"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "30.00", "date": "2026-10-05"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.setToday(pg_uma, "2026-12-20");
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(true);
    expect(await ui.rollover(pg_vic, "x")).toBeNull();
    expect(await ui.rollover(pg_vic, "2025")).toBeNull();
    await ui.refresh(pg_uma);
    expect(await ui.rollover(pg_uma, "2026")).toBeNull();
    await ui.setToday(pg_uma, "2027-01-05");
    await ui.refresh(pg_vic);
    expect(await ui.rollover(pg_vic, "2026")).toBe(12);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-carried")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-carried")).toHaveText("12.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-locked")).toHaveText("no");
    await ui.setToday(pg_vic, "2027-01-10");
    const c_ada_2 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "5.00"}));
    expect(await ui.claimAction(pg_vic, c_ada_2, "open")).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-carried")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-carried")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-carried")).toHaveText("12.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-carried")).toHaveText("6.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-locked")).toHaveText("no");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-01 from=2026-01-01 to=2026-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-05 from=2026-05-01 to=2026-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-06 from=2026-06-01 to=2026-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-07 from=2026-07-01 to=2026-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-08 from=2026-08-01 to=2026-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-09 from=2026-09-01 to=2026-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-10 from=2026-10-01 to=2026-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-11 from=2026-11-01 to=2026-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-12 from=2026-12-01 to=2026-12-31`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-11-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-12-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=30.00 date=2026-10-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-11-05 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-12-05 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=30.00 due-total=3.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.00 due-total=3.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=30.00 date=2026-10-05 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=30.00 due-total=6.00 overdue-total=6.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=60.00 due-total=9.00 overdue-total=6.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=3.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=6.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=30.00 due-total=3.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=60.00 due-total=9.00 overdue-total=7.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=10.00 date=2026-11-05 number=FY2026-1 due=1.00`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=30.00 due-total=3.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=60.00 due-total=9.00 overdue-total=6.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=3.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=6.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=30.00 due-total=3.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=60.00 due-total=9.00 overdue-total=8.00`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-03 from=2027-03-01 to=2027-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-04 from=2027-04-01 to=2027-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-05 from=2027-05-01 to=2027-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-06 from=2027-06-01 to=2027-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-07 from=2027-07-01 to=2027-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-08 from=2027-08-01 to=2027-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-09 from=2027-09-01 to=2027-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-10 from=2027-10-01 to=2027-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-11 from=2027-11-01 to=2027-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-12 from=2027-12-01 to=2027-12-31`,
      `OPENING_SET sheet=${sheet} by=vic name=Ada period=2027-01 amount=2.00`,
      `OPENING_SET sheet=${sheet} by=vic name=Ben period=2027-01 amount=6.00`,
      `ROLLOVER sheet=${sheet} by=vic fy=FY2026 periods=12`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=3.00`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ben due-total=6.00`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=5.00 date=2027-01-10`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=5.00 date=2027-01-10 number=FY2027-1`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=35.00 due-total=4.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=65.00 due-total=10.00 overdue-total=8.00`
    ]);
  });
  test("year end rollover scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "proof-threshold-B", "4.00");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "25.00", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    await ui.setSetting(pg_uma, "escalate-after", "1");
    await ui.setSetting(pg_uma, "default-grade", "B");
    await ui.setSetting(pg_uma, "clerk-limit-B", "0.50");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-01", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "3", "contact": " Ada@x "}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "70.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "20.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ada", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    const pl_cam_1 = ui.must(await ui.addPlan(pg_uma, p_cam, {"amount": "10.35", "start": "2026-03-09", "end": "2026-04-30", "every": "10"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.delegate(pg_vic, {"user": "wes", "from": "2026-03-09", "to": "2026-03-28"})).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.generatePlans(pg_wes)).toBe(2);
    const c_cam_0 = await ui.claimAt(pg_wes, p_cam, 0);
    const c_cam_1 = await ui.claimAt(pg_wes, p_cam, 1);
    expect(await ui.bulkVoid(pg_wes, [c_cam_0, c_cam_1])).toEqual({ voided: 2, refused: 0 });
    const c_cam_2 = ui.must(await ui.quickAdd(pg_wes, {"name": "Cam", "amount": "7.77"}));
    await ui.refresh(pg_vic);
    expect(await ui.delegate(pg_vic, {"user": "uma", "from": "2026-02-25", "to": "2026-04-02"})).toBe(true);
    await ui.refresh(pg_uma);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "4.00", "date": "2026-03-20", "note": "n"}));
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await ui.refresh(pg_vic);
    expect(await ui.ratePreview(pg_vic, "C", "10.00")).toEqual({ count: 0, diff: "0.00" });
    const c_ada_1 = ui.must(await ui.claimFromTemplate(pg_vic, p_ada, "T1"));
    expect(await ui.bulkOpen(pg_vic, [c_ada_1, c_cam_2])).toEqual({ opened: 2, refused: 0 });
    await ui.refresh(pg_uma);
    expect(await ui.settlePart(pg_uma, p_cam, c_cam_2, "4.00")).toBeNull();
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("32.77");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.setApprover(pg_uma, p_cam, "vic")).toBe(true);
    expect(await ui.ratePreview(pg_uma, "B", "12.50")).toEqual({ count: 1, diff: "0.62" });
    await ui.refresh(pg_wes);
    expect(await ui.claimAction(pg_wes, c_ada_0, "open")).toBe(true);
    expect(await ui.holdClaim(pg_wes, c_ada_0)).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("29.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("3.50");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("26.66");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("tpl");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-20 due=2.50", "OPEN by vic on 2026-03-20 due=2.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("X-2");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=1.00", "OPEN by wes on 2026-03-20 due=1.00", "SETTLED by vic on 2026-03-20 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("6.67");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("vic");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("3.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-number")).toHaveText("P2-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-20 due=1.00", "OPEN by vic on 2026-03-20 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-03-19");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due-by")).toHaveText("2026-03-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-20 due=1.04", "VOID by wes on 2026-03-20 due=1.04"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-12");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-20 due=1.04", "VOID by wes on 2026-03-20 due=1.04"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("36.77");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("4.50");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("4.50");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("5.50");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("70.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("23.33");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("6.67");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-generated")).toHaveText("2");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-next-dates")).toHaveText("2026-03-29, 2026-04-08, 2026-04-18, 2026-04-28");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-paused")).toHaveText("no");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-change-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=25.00 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=B`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit-B value=0.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-01 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=3 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=70.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=20.00 from=2026-03-01 to=2026-04-30`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=10.35 start=2026-03-09 every=10 end=2026-04-30`,
      `DELEGATED sheet=${sheet} by=vic user=wes from=2026-03-09 to=2026-03-28`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=10.35 date=2026-03-09 for=vic`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=10.35 date=2026-03-19 for=vic`,
      `CLAIM_VOIDED sheet=${sheet} by=wes person=Cam amount=10.35 date=2026-03-19 for=vic`,
      `CLAIM_VOIDED sheet=${sheet} by=wes person=Cam amount=10.35 date=2026-03-09 for=vic`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=7.77 date=2026-03-20 for=vic`,
      `DELEGATED sheet=${sheet} by=vic user=uma from=2026-02-25 to=2026-04-02`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20 for=vic`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0 for=vic`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=25.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=25.00 date=2026-03-20 number=X-1`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=25.00 due-total=2.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=25.00 due-total=2.50 overdue-total=0.00`,
      `ALERT sheet=${sheet} by=vic name=Ada due-total=2.50`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-20 number=P2-1`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=7.77 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=32.77 due-total=3.50 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Cam amount=3.77 date=2026-03-20 number=P2-1 into=P2-2 for=vic`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=4.00 date=2026-03-20 number=P2-2 for=vic`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=7.77 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=32.77 due-total=4.50 overdue-total=0.00`,
      `ALERT sheet=${sheet} by=uma name=Cam due-total=2.00 for=vic`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00 for=vic`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01 for=vic`,
      `APPROVER_SET sheet=${sheet} by=uma name=Cam user=vic for=vic`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-20 number=X-2 for=vic`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=29.00 due-total=3.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=36.77 due-total=5.50 overdue-total=0.00`,
      `CLAIM_HELD sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-20 number=X-2 for=vic`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-03-20 number=X-2 due=1.00`
    ]);
  });
  test("year end rollover scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "3.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.35"}));
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    await ui.setSetting(pg_uma, "review-sla", "5");
    await ui.setSetting(pg_uma, "proof-kinds", "receipt,photo");
    await ui.setSetting(pg_uma, "default-grade", "A");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50", "from": "2026-03-01", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "3"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "20", "contact": "ADA@X"})).toBeNull();
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": "3", "termsFrom": "2026-03-01"})).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,99.95,,\nAda,7.77,2026-03-09,paste")).toBe(2);
    const c_ada_0 = await ui.claimAt(pg_uma, p_ada, 0);
    const c_ada_1 = await ui.claimAt(pg_uma, p_ada, 1);
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-04-02")).toBe(false);
    await ui.setSetting(pg_uma, "clerk-limit", "");
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    expect(await ui.remind(pg_uma, c_ada_1)).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,4.00,,paste")).toBe(1);
    const c_ada_2 = await ui.claimAt(pg_uma, p_ada, 2);
    expect(await ui.addComment(pg_uma, c_ada_0, "ok")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("111.72");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("111.72");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("14.49");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("14.49");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.redate(pg_wes, c_ada_1, "2026-03-15")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ada_1, "settle")).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.periodAction(pg_wes, "P1", "reopen")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ada_2, "void", "late")).toBe(true);
    expect(await ui.remind(pg_wes, c_ada_0)).toBe(true);
    expect(await ui.addProof(pg_wes, c_ada_0)).toBe(true);
    expect(await ui.defer(pg_wes, c_ada_0, "2026-03-22")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await ui.setToday(pg_wes, "2026-04-10");
    await ui.setSetting(pg_wes, "floor", "3.00");
    const c_ada_3 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "20.00", "date": "2026-02-10"}));
    await ui.setAsOf(pg_wes, "2026-03-20");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 1.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("FY2025-3");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "VOID by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("FY2025-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-12");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "SETTLED by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2025-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=12.49", "OPEN by uma on 2026-03-10 due=12.49"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("2026-03-22");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText(["uma on 2026-03-10: ok"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-late-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt,photo`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C terms=3`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10 number=FY2025-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=99.95 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=99.95 due-total=2.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09 number=FY2025-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=107.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=107.72 due-total=2.00 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=13.49`,
      `REMIND sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09 number=FY2025-2`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `LATE_ENTRY sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10 number=FY2025-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=111.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=111.72 due-total=2.00 overdue-total=0.00`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 text=ok`,
      `CLAIM_REDATED sheet=${sheet} by=wes person=Ada amount=7.77 date=2026-03-15 number=FY2025-2 old=2026-03-09 new=2026-03-15`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=7.77 date=2026-03-15 number=FY2025-2 due=1.00`,
      `PERIOD_REOPENED sheet=${sheet} by=wes period=P1`,
      `CLAIM_VOIDED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-10 number=FY2025-3 reason=late`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=107.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=107.72 due-total=2.00 overdue-total=0.00`,
      `REMIND sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 proofs=1`,
      `CLAIM_DEFERRED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 until=2026-03-22`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=7.77 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=7.77 due-total=1.00 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=1.00`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=13.49 auto=yes`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=107.72 due-total=2.00 overdue-total=12.49`,
      `TOTALS sheet=${sheet} by=wes claimed-total=107.72 due-total=2.00 overdue-total=12.49`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=floor value=3.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=20.00 date=2026-02-10`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    expect(await ui.archive(pg_wes)).toBe(true);
    expect(await ui.addClaim(pg_wes, p_ada, {"amount": "20.00"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("107.72");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("11.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 1.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("1.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due-by")).toHaveText("2026-02-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-10 due=1.50"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("FY2025-3");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "VOID by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("FY2025-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-12");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "SETTLED by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2025-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=12.49", "OPEN by uma on 2026-03-10 due=12.49"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("2026-03-22");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText(["uma on 2026-03-10: ok"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("107.72");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-late-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("month-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("13.49");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt,photo`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C terms=3`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10 number=FY2025-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=99.95 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=99.95 due-total=2.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09 number=FY2025-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=107.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=107.72 due-total=2.00 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=13.49`,
      `REMIND sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-09 number=FY2025-2`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `LATE_ENTRY sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10 number=FY2025-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=111.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=111.72 due-total=2.00 overdue-total=0.00`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 text=ok`,
      `CLAIM_REDATED sheet=${sheet} by=wes person=Ada amount=7.77 date=2026-03-15 number=FY2025-2 old=2026-03-09 new=2026-03-15`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=7.77 date=2026-03-15 number=FY2025-2 due=1.00`,
      `PERIOD_REOPENED sheet=${sheet} by=wes period=P1`,
      `CLAIM_VOIDED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-10 number=FY2025-3 reason=late`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=107.72 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=107.72 due-total=2.00 overdue-total=0.00`,
      `REMIND sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 proofs=1`,
      `CLAIM_DEFERRED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-10 number=FY2025-1 until=2026-03-22`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=7.77 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=7.77 due-total=1.00 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=1.00`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=13.49 auto=yes`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=107.72 due-total=2.00 overdue-total=12.49`,
      `TOTALS sheet=${sheet} by=wes claimed-total=107.72 due-total=2.00 overdue-total=12.49`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=floor value=3.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=20.00 date=2026-02-10`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
  test("year end rollover scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-C", "3");
    await ui.setSetting(pg_uma, "perm-open", "steward");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "proof-threshold-C", "4.00");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "99.95"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    await ui.setSetting(pg_uma, "review-sla", "5");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"})).toBeNull();
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "20"}));
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.rollover(pg_wes, "2026")).toBeNull();
    const c_ben_0 = ui.must(await ui.addClaimTwice(pg_wes, p_ben, {"amount": "25.00", "date": "2026-03-20"}));
    expect(await ui.claimCount(pg_wes, p_ben)).toBe(1);
    expect(await ui.pasteClaims(pg_wes, "Ben,10.25,,paste\nBen,25.00,2026-03-20,a, b\nZed,3.33,,a, b")).toBeNull();
    expect(await ui.addProof(pg_wes, c_ben_0)).toBe(true);
    const c_ben_1 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "10.35", "date": "2026-03-20", "note": "n", "ref": " r-1 "}));
    expect(await ui.editPerson(pg_wes, p_ben, {"terms": "3"})).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_0, "open")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.editInline(pg_wes, c_ben_1, "0.40")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ben_1, "open")).toBe(false);
    expect(await ui.editClaim(pg_uma, c_ben_1, {"amount": "20.00"})).toBe(true);
    await ui.expectAuditView(pg_uma, "", [
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-20`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ben amount=0.40 date=2026-03-20`,
      `TOTALS sheet=${sheet} by=wes claimed-total=25.00 due-total=2.50 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=25.00 due-total=2.50 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 number=X-1`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=C terms=3`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-03-20 ref=r-1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 proofs=1`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=20`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50 from=2026-03-01`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`
    ]);
    expect(await ui.addProof(pg_uma, c_ben_0)).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.waive(pg_wes, c_ben_0)).toBe(true);
    const c_ben_2 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "99.95", "date": "2026-03-09", "tags": "b,a,a"}));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.claimAction(pg_wes, c_ben_1, "open")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.bulkSettle(pg_vic, [c_ben_1, c_ben_0])).toEqual({ settled: 0, refused: 2 });
    expect(await ui.quickAdd(pg_vic, {"name": "Ben", "amount": "1.00"})).toBeNull();
    expect(await ui.dups(pg_vic)).toEqual([]);
    await ui.refresh(pg_wes);
    expect(await ui.flag(pg_wes, p_ben, "late", "2026-03-12")).toBe(true);
    const c_ben_3 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "3.33", "date": "2026-02-25", "note": "n", "tags": " c "}));
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("45.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("4.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("45.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("4.50");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("4.50");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("4.50");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("4.50");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ben_0, "settle")).toBe(true);
    await ui.setAsOf(pg_uma, "2026-03-09");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-09");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=steward`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 proofs=1`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-03-20 ref=r-1`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=C terms=3`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 number=X-1`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=25.00 due-total=2.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=25.00 due-total=2.50 overdue-total=0.00`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ben amount=0.40 date=2026-03-20`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-20`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-20 number=X-1 proofs=2`,
      `CLAIM_WAIVED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 number=X-1`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=99.95 date=2026-03-09 tags=a,b`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=20.00 date=2026-03-20 number=X-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=45.00 due-total=4.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=45.00 due-total=4.50 overdue-total=0.00`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Ben reason=late until=2026-03-12`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-02-25 tags=c`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=4.50 claims=2`,
      `CLAIM_SETTLED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-20 number=X-1 due=2.50`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("45.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("2.50");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 4.50"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("late");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due-by")).toHaveText("2026-03-02");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=1.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-tags")).toHaveText("c");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due-by")).toHaveText("2026-03-12");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=10.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-number")).toHaveText("X-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=2.00", "OPEN by wes on 2026-03-10 due=2.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=2.50", "OPEN by wes on 2026-03-10 due=2.50", "SETTLED by uma on 2026-03-10 due=2.50"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-waived")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-receipt")).toHaveText("2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("45.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("2.50");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("4.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=steward`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 proofs=1`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-03-20 ref=r-1`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=C terms=3`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 number=X-1`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=25.00 due-total=2.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=25.00 due-total=2.50 overdue-total=0.00`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ben amount=0.40 date=2026-03-20`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-20`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-20 number=X-1 proofs=2`,
      `CLAIM_WAIVED sheet=${sheet} by=wes person=Ben amount=25.00 date=2026-03-20 number=X-1`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=99.95 date=2026-03-09 tags=a,b`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=20.00 date=2026-03-20 number=X-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=45.00 due-total=4.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=45.00 due-total=4.50 overdue-total=0.00`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Ben reason=late until=2026-03-12`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-02-25 tags=c`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=4.50 claims=2`,
      `CLAIM_SETTLED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-20 number=X-1 due=2.50`
    ]);
  });
});
