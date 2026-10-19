"""The story scripts of the stream, one per checkpoint, as functions of the checkpoint k they
are rendered at (a ripple copy re-renders a prior's script at the mutative's k, so a script may
branch on k where a later rule changes what the test must do to arrange its data).

A script is a list of steps (see harness.stream_build.render for the vocabulary). Every value a
step asserts is computed by the reference model (harness/oracle/hell.py); the script says only
what the test does and which figures it reads. A checkpoint's spec also carries the scenarios
harness.oracle.hell_gen generates for it; these stories state the feature, the generated ones
cross it with everything already in force.
"""
from __future__ import annotations

T = "2026-03-10"          # the sheet's today in most scripts


RATES = (("A", "10.00"), ("B", "12.50"))


def _base(k: int, today: str = T, people=(("Ada", "A"), ("Ben", "B")), rates=RATES) -> list:
    s = [("as", "uma")]
    if k >= 2:
        s.append(("today", today))
    if k >= 7:
        for g, r in rates:
            s.append(("rate", g, r))
    for n, g in people:
        s.append(("person", n, g))
    return s


def _open(k: int, *refs) -> list:
    return [("open", n, i) for n, i in refs] if k >= 8 else []


FIG = {"people": ["claimed", "due-total"], "claims": ["due", "status"], "rollups": True}


def cp01(k):
    return [("as", "uma"), ("check", {"header": True}), ("as", "vic"), ("check", {"header": True})]


def cp02(k):
    return [("as", "uma"), ("today", "2026-03-10"), ("check", {"header": True, "today": True}),
            ("today", "2024-02-29"), ("check", {"header": True, "today": True})]


def cp03(k):
    return _base(k, people=(), rates=()) + [
        ("person", "Ada", "A"), ("person", "Ben", "B"), ("person", "", "A"), ("person", "Cam", "C"),
        ("person", " ada ", "B"),
        ("edit", "Ben", {"grade": "C"}),
        ("check", {"people": ["name", "grade"], "audit": True})]


def cp04(k):
    return _base(k, people=(), rates=()) + [
        ("person", "Ada", "A"), ("person", "ADA", "B"), ("person", " Ada ", "C"),
        ("person", "Ben", "B"), ("edit", "Ben", {"name": "ada"}),
        ("edit", "Ben", {"name": " Cam "}),
        ("person", "cam", "A"),
        ("check", {"people": ["name", "grade"], "audit": True})]


def cp05(k):
    return _base(k, rates=()) + [
        ("claim", "Ada", "10.00", "2026-03-01", "first"), ("claim", "Ada", "2.50"),
        ("claim", "Ben", "0.00", None, "zero"), ("claim", "Ben", "-1.00"), ("claim", "Ada", "1.234"),
        ("claim_edit", "Ada", 0, {"amount": "11.00"}),
        *_open(k, ("Ada", 0), ("Ben", 0)),
        ("check", {"claims": ["amount", "date", "note"], "people": ["claimed"], "rollups": True,
                   "audit": True})]


def cp06(k):
    return _base(k, people=(("Ada", "A"),), rates=()) + [
        ("edit", "Ada", {"grade": "B"}),
        ("claim", "Ada", "5.00", "2026-03-02", "n"), ("claim", "Ada", "1.005"),
        ("claim_edit", "Ada", 0, {"amount": "6.00", "note": "m"}),
        ("person", "Ada", "C"),
        ("check", {"people": ["name", "grade"], "claims": ["amount", "note"], "audit": True})]


def cp07(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25", "2026-03-02"),
        ("claim", "Ben", "4.00"), ("claim", "Cam", "4.00"),
        *_open(k, ("Ada", 0), ("Ada", 1), ("Cam", 0)),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True}),
        ("edit", "Ada", {"grade": "B"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True,
                   "audit": True})]


def cp08(k):
    return _base(k, people=(("Ada", "A"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("claim_edit", "Ada", 0, {"amount": "15.00"}),
        ("as", "vic"), ("settle", "Ada", 1),
        ("void", "Ada", 2), ("void", "Ada", 1), ("settle", "Ada", 2), ("open", "Ada", 0),
        ("check", {"claims": ["amount", "status", "due"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp09(k):
    return _base(k) + [
        ("claim", "Ada", "1.00"), ("claim", "Ada", "2.00"), ("claim", "Ben", "3.00"),
        ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("void", "Ada", 0), ("open", "Ben", 0),
        ("open_both", ("Ada", 1, "uma"), ("Ben", 1, "vic")),
        ("check", {"claims": ["number", "status"]})]


def cp10(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "20.00"), ("claim", "Ada", "3.00"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("as", "vic"), ("settle", "Ada", 0),
        ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "status"], "people": ["due-total"], "rollups": True,
                   "audit": True})]


def cp11(k):
    return _base(k, people=(), rates=()) + [
        ("rate", "A", "10.00"), ("rate", "A", "20.00", "2026-03-05"), ("rate", "B", "5.00", "2026-03-01"),
        ("person", "Ada", "A"), ("person", "Ben", "B"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00", "2026-02-20"),
        ("claim", "Ben", "10.00", "2026-03-02"),
        ("rate", "A", "30.00", "2026-03-05"),
        *_open(k, ("Ada", 0), ("Ada", 1), ("Ada", 2), ("Ben", 0), ("Ben", 1)),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True,
                   "audit": True})]


def cp12(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.35"), ("claim", "Ada", "10.45"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True})]


def cp13(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"),
        ("open", "Ada", 0), ("settle", "Ada", 0),
        ("as", "vic"), ("open", "Ada", 1), ("settle", "Ada", 1), ("settle", "Ada", 0),
        ("as", "uma"), ("settle", "Ada", 1),
        ("check", {"claims": ["status", "opened-by"], "audit": True})]


def cp14(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("edit_open", "Ada"), ("as", "vic"), ("edit_open", "Ada"), ("edit_save", {"grade": "B"}),
        ("as", "uma"), ("edit_save", {"grade": "C"}),
        ("edit", "Ada", {"grade": "C"}),
        ("claim2", "Ada", "5.00", "2026-03-01", "once"),
        ("check", {"people": ["grade"], "claims": ["amount", "note"], "audit": True})]


def cp15(k):
    return _base(k) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("statement", "Ada"),
        ("rate", "A", "20.00"),
        ("claim", "Ada", "30.00"), ("open", "Ada", 2),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "statement-count", "stated-total",
                                                            "statement-date"], "rollups": True}),
        ("today", "2026-03-11"), ("statement", "Ada"), ("void", "Ada", 0), ("statement", "Ben"),
        ("rate", "B", "20.00"),
        ("check", {"claims": ["due", "stated", "status"], "people": ["due-total", "statement-count",
                   "stated-total", "statement-date"], "rollups": True, "audit": True})]


def cp16(k):
    return _base(k) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"),
        ("open", "Ada", 0), ("open", "Ben", 0),
        ("rate", "A", "20.00"), ("rate", "B", "12.50"),
        ("edit", "Ben", {"grade": "A"}),
        ("today", "2026-03-11"),
        ("statement", "Ada"), ("rate", "A", "30.00"),
        ("as", "vic"), ("settle", "Ben", 0), ("void", "Ada", 0),
        ("statement", "Ada"), ("person", "Cam", "C"),
        ("check", {"claims": ["due", "status", "stated"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp17(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("period", "P3", "2026-03-05", "2026-03-15"), ("period", "P4", "2026-03-25", "2026-03-21"),
        ("period", "P1", "2026-04-01", "2026-04-02"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"),
        ("claim", "Ada", "30.00", "2026-03-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["period", "due"], "periods": True, "audit": True})]


def cp18(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"),
        ("claim", "Ada", "5.00", "2026-03-06"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("close", "P1"),
        ("claim", "Ada", "7.00", "2026-03-07"), ("open", "Ada", 2), ("void", "Ada", 0),
        ("claim_edit", "Ada", 2, {"amount": "6.00"}),
        ("as", "vic"), ("settle", "Ada", 0),
        ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "status"], "periods": True, "rollups": True, "audit": True})]


def cp19(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("quick", "Ada", "5.00"), ("quick", "Dot", "7.00"), ("quick", "", "1.00"),
        ("quick", "Ada", "-1.00"), ("quick", " dot ", "2.00"),
        ("check", {"people": ["name", "grade", "claimed"], "claims": ["amount", "date", "note", "status"],
                   "audit": True})]


def cp20(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"),
        ("open", "Ada", 0),
        ("claim_edit", "Ada", 0, {"amount": "15.00"}), ("claim_edit", "Ada", 1, {"amount": "25.00"}),
        ("void", "Ada", 0), ("open", "Ada", 1),
        ("check", {"claims": ["amount", "number", "status"], "people": ["due-total"], "audit": True})]


def cp21(k):
    return _base(k) + [
        ("claim", "Ada", "10.00", "2026-03-05"),
        ("retire", "Ada", "2026-03-08"), ("hidden", "Ada"),
        ("show_retired", True),
        ("claim", "Ada", "20.00", "2026-03-09"), ("claim", "Ada", "30.00", "2026-03-08"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("show_retired", False), ("hidden", "Ada"),
        ("check", {"people": ["retired", "retired-from", "due-total"], "rollups": True}),
        ("show_retired", True),
        ("check", {"people": ["retired", "retired-from", "due-total"], "claims": ["status", "due"],
                   "audit": True})]


def cp22(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 2),
        ("hold", "Ada"),
        ("check", {"people": ["hold", "claimed", "due-total"], "claims": ["due", "status"],
                   "rollups": True}),
        ("hold", "Ada"),
        ("check", {"people": ["hold", "claimed", "due-total"], "rollups": True, "audit": True})]


def cp23(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("rate", "A", "20.00", "2026-03-05"),
        ("role", "vic", "steward"), ("role", "wes", "boss"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25", "2026-03-06"),
        ("claim", "Ada", "15.05", "2026-03-01"), ("claim", "Ada", "30.00"),
        ("as", "vic"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "uma"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 1),
        ("as", "wes"), ("settle", "Ada", 3),
        ("check", {"claims": ["status", "due"], "people": ["due-total"], "audit": True})]


def cp24(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-31"),
        ("claim", "Ada", "5.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "12.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["due"], "people": ["due-total"], "periods": True, "rollups": True}),
        ("statement", "Ada"), ("claim", "Ada", "4.00"), ("open", "Ada", 3),
        ("setting", "floor", "3.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "periods": True, "rollups": True}),
        ("close", "P1"), ("setting", "floor", "5.00"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "periods": True, "rollups": True,
                   "audit": True})]


def cp25(k):
    return _base(k, today="2026-03-30", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "10"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-25"),
        ("claim", "Ben", "30.00", "2026-03-19"), ("claim", "Ben", "40.00", "2026-03-20"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-count", "overdue-total"],
                   "rollups": True}),
        ("today", "2026-03-31"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"],
                   "rollups": True, "audit": True})]


def cp26(k):
    return _base(k, today="2026-05-01", people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "10"),
        ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-02-01"),
        ("claim", "Ada", "10.25", "2026-04-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("statement", "Ada"), ("setting", "late-pct", "10.00"),
        ("check", {"claims": ["due", "overdue", "stated"], "people": ["due-total", "overdue-total"],
                   "rollups": True}),
        ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ada", 1),
        ("setting", "late-pct", "20.00"), ("today", "2026-06-01"),
        ("check", {"claims": ["due", "status", "stated"], "people": ["due-total", "overdue-total"],
                   "rollups": True, "audit": True})]


def cp27(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")),
                 rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"),
        ("claim", "Cam", "10.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("patron", "Ada", "Ben"), ("patron", "Ada", "Cam"), ("patron", "Ben", "Ada"),
        ("patron", "Ada", "Ada"), ("patron", "Ada", "Ben"),
        ("check", {"people": ["patrons", "backing", "due-total"]}),
        ("hold", "Ben"),
        ("check", {"people": ["patrons", "backing", "due-total"], "audit": True})]


def cp28(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"),
        ("claim", "Ada", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("edit", "Ada", {"grade": "B", "grade_from": "2026-03-05"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True}),
        ("edit", "Ada", {"grade": "C"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True, "audit": True})]


def cp29(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-31"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("statement", "Ada"), ("void", "Ada", 1), ("claim", "Ada", "50.00"), ("open", "Ada", 2),
        ("close", "P1"), ("rate", "A", "20.00"),
        ("reopen", "P1"),
        ("check", {"periods": True, "claims": ["due", "stated"]}),
        ("role", "vic", "steward"), ("as", "vic"), ("reopen", "P1"), ("reopen", "P1"),
        ("check", {"periods": True, "claims": ["due", "stated"], "people": ["due-total"], "audit": True})]


def cp30(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "50.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"),
        ("claim", "Ada", "-20.00", None, "fix", "1"), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"),
        ("claim", "Ada", "-5.00", None, "", "9"), ("claim", "Ada", "-5.00"),
        ("claim", "Ada", "-5.00", None, "", "2"),
        ("claim", "Ada", "-3.00", "2026-03-01", "", "1"), ("open", "Ada", 2),
        ("check", {"claims": ["due", "corrects", "number", "status"], "people": ["due-total"],
                   "rollups": True, "audit": True})]


def cp31(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "A"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ben", "20.00", "2026-03-15"),
        ("claim", "Cam", "30.00", "2026-03-05"), ("claim", "Cam", "40.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("as", "vic"), ("settle", "Cam", 0), ("void", "Cam", 1),
        ("retire", "Cam", "2026-03-10"), ("hold", "Ben"),
        ("check", {"summary": True, "people": ["due-total"], "periods": True, "rollups": True})]


def cp32(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25"),
        ("claim", "Ada", "10.35", "2026-03-09"), ("claim", "Ada", "10.45", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"]}),
        ("setting", "policy-date", "2026-03-05"),
        ("claim", "Ada", "-10.25", None, "fix", "1"), ("open", "Ada", 4),
        ("check", {"claims": ["due", "stated", "corrects"], "people": ["due-total"]}),
        ("setting", "policy-date", "2026-03-15"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"]}),
        ("as", "vic"), ("settle", "Ada", 2), ("setting", "policy-date", ""),
        ("check", {"claims": ["due", "status", "stated"], "people": ["due-total"], "audit": True})]


def cp33(k):
    return _base(k, people=(("Ada", "A"), ("Lee, Jo", "B"), ('Ann "Q"', "C"))) + [
        ("claim", "Ada", "10.00"), ("claim", "Lee, Jo", "10.00"),
        ("open", "Ada", 0), ("open", "Lee, Jo", 0),
        ("retire", 'Ann "Q"', "2026-03-01"),
        ("export",)]


def cp34(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("period", "P1", "2026-03-01", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00", "2026-03-03"),
        ("claim", "Ben", "40.00"), ("open", "Ben", 1),
        ("close", "P1"),
        ("bulk_open", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Ben", 1)]),
        ("check", {"claims": ["number", "status"], "audit": True})]


def cp35(k):
    return _base(k, today="2026-03-15", people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "1.00", "2026-03-05"), ("claim", "Ada", "2.00"), ("claim", "Ada", "3.00", "2026-03-25"),
        ("claim", "Ada", "4.00", "2026-03-06"), ("claim", "Ada", "5.00", "2026-03-12"), ("claim", "Ada", "6.00"),
        ("open", "Ada", 0),
        ("setting", "period-numbering-from", "2026-03-16"), ("open", "Ada", 1),
        ("setting", "period-numbering-from", "2026-03-15"),
        ("open", "Ada", 2), ("open", "Ada", 3), ("open", "Ada", 4),
        ("setting", "period-numbering-from", ""), ("open", "Ada", 5),
        ("check", {"claims": ["number", "period"], "audit": True})]


def cp36(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("role", "wes", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "10.00"),
        ("as", "vic"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "uma"), ("statement", "Ada"), ("rate", "A", "20.00"),
        ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("check", {"claims": ["status", "due", "stated"], "people": ["due-total"], "rollups": True}),
        ("as", "vic"), ("approve", "Ada", 0),
        ("as", "wes"), ("approve", "Ada", 0), ("reject", "Ada", 1, "no"),
        ("as", "uma"), ("approve", "Ada", 1),
        ("check", {"claims": ["status", "due", "stated"], "people": ["due-total"], "rollups": True,
                   "audit": True})]


def cp37(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"),
        ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"), ("reassign", "Ada", 0, "Ben"),
        ("as", "vic"), ("reassign", "Ada", 0, "Ben"), ("reassign", "Ada", 1, "Ben"),
        ("reassign", "Ada", 2, "Ben"),
        ("check", {"claims": ["number", "due", "status", "stated"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp38(k):
    return _base(k, today="2026-03-20", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "10"), ("setting", "terms-B", "20"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"),
        ("setting", "terms", "5"), ("claim_edit", "Ada", 0, {"date": "2026-03-03"}),
        ("claim", "Ada", "10.00", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ada", 1),
        ("check", {"claims": ["date", "due-by", "overdue"], "people": ["overdue-count"], "audit": True})]


def cp39(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "20.00"), ("open", "Ada", 0),
        ("today", "2026-03-11"), ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ada", 0),
        ("today", "2026-03-12"), ("rate", "A", "30.00"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 1), ("void", "Ada", 1),
        ("check", {"claims": ["due", "status", "log"]})]


def cp40(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-06"),
        ("claim", "Ada", "40.00"), ("claim", "Ada", "80.00", "2026-03-08"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 3), ("statement", "Ada"),
        ("claim", "Ada", "16.00", "2026-03-07"), ("open", "Ada", 4),
        ("hold", "Ada", "2026-03-05", "2026-03-08"),
        ("check", {"people": ["hold", "claimed", "due-total"], "claims": ["due", "status", "stated"],
                   "rollups": True}),
        ("hold", "Ada", "2026-03-10", None),
        ("check", {"people": ["hold", "claimed", "due-total"], "rollups": True, "audit": True})]



# ---- Act II (cp41-80): time, freezing, permissions, write paths, read surfaces ----------------

ALL = {"people": ["claimed", "due-total", "overdue-total"], "claims": ["due", "status", "stated"],
       "rollups": True, "counters": True}


def cp41(k):
    return _base(k) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00", "2026-03-02"),
        ("claim", "Ben", "5.00", "2026-03-03"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("as", "vic"), ("settle", "Ada", 1), ("void", "Ben", 0),
        ("retire", "Ben", "2026-03-09"),
        ("check", {"counters": True, "rollups": True, "summary": True, "people": ["due-total", "overdue-total"]}),
        ("today", "2026-03-30"),
        ("check", {"counters": True, "rollups": True, "summary": True, "audit": True})]


def cp42(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("rate", "A", "20.00", "2026-03-05", "2026-03-07"), ("rate", "A", "30.00", "2026-03-09", "2026-03-08"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"),
        ("claim", "Ada", "10.00", "2026-03-08"), ("claim", "Ada", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True}),
        ("statement", "Ada"), ("rate", "A", "30.00", "2026-03-09"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "stated-total"], "rollups": True,
                   "rates": True, "audit": True})]


def cp43(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "50.00", "2026-03-01"), ("claim", "Ada", "60.00"), ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("patron", "Ben", "Ada"),
        ("setting", "cap", "8.00"),
        ("check", {"people": ["due-total", "excess", "backing"], "rollups": True, "summary": True}),
        ("statement", "Ada"), ("rate", "A", "5.00"),
        ("check", {"people": ["due-total", "excess", "backing"], "claims": ["due", "stated"], "rollups": True}),
        ("hold", "Ada", "2026-03-01", "2026-03-05"),
        ("check", {"people": ["due-total", "excess", "backing"], "rollups": True}),
        ("setting", "cap", ""),
        ("check", {"people": ["due-total", "excess", "backing"], "rollups": True, "audit": True})]


def cp44(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("today", "2026-03-20"),
        ("check", {"people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 0),
        ("setting", "terms", "30"), ("today", "2026-03-21"),
        ("check", {"people": ["overdue-count", "overdue-total"], "rollups": True, "audit": True})]


def cp45(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("period", "P1", "2026-03-01", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00", "2026-03-03"),
        ("claim", "Ben", "5.00"), ("claim", "Ben", "40.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("close", "P1"),
        ("bulk_settle", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Ben", 1), ("Ben", 2)]),
        ("as", "wes"),
        ("bulk_settle", [("Ben", 2), ("Ben", 1), ("Ben", 0), ("Ada", 1), ("Ada", 0)]),
        ("check", {"claims": ["status", "due", "number"], "people": ["due-total"], "rollups": True}),
        ("as", "vic"), ("bulk_settle", [("Ada", 1), ("Ben", 1)]),
        ("check", {"claims": ["status", "due"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp46(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"),
        ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-02-05"), ("claim", "Ada", "40.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("statement", "Ada"),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1),
        ("as", "uma"), ("rate", "A", "20.00"), ("setting", "floor", "3.00"),
        ("resettle", "Ada", 0),
        ("as", "vic"), ("resettle", "Ada", 0), ("resettle", "Ada", 2),
        ("check", {"claims": ["due", "status", "stated", "log"], "people": ["due-total"], "rollups": True}),
        ("close", "P1"), ("resettle", "Ada", 1),
        ("setting", "late-pct", "10.00"), ("today", "2026-04-20"), ("resettle", "Ada", 0),
        ("check", {"claims": ["due", "status", "overdue"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp47(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"),
        ("claim", "Ben", "30.00", "2026-03-06"), ("claim", "Ben", "40.00", "2026-03-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"person_periods": True, "periods": True, "people": ["due-total"]}),
        ("close", "P1"), ("person", "Cam", "C"), ("rate", "A", "20.00"), ("rate", "B", "10.00"),
        ("check", {"person_periods": True, "periods": True, "people": ["due-total"], "rollups": True}),
        ("as", "vic"), ("reopen", "P1"),
        ("check", {"person_periods": True, "periods": True, "summary": True, "audit": True})]


def cp48(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("setting", "floor", "5.00", "2026-03-05"), ("setting", "terms", "3", "2026-03-05"),
        ("setting", "late-pct", "10.00", "2026-03-01"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"),
        ("claim", "Ben", "10.00", "2026-02-01"), ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"claims": ["due", "due-by", "overdue"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("setting", "floor", "2.00", "2026-03-01"), ("setting", "clerk-limit", "1.50", "2026-03-20"),
        ("setting", "cap", "4.00", "2026-03-01"),
        ("check", {"claims": ["due"], "people": ["due-total", "excess"], "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("settle", "Ada", 1),
        ("today", "2026-03-20"), ("settle", "Ben", 0),
        ("check", {"claims": ["due", "status", "overdue"], "people": ["due-total", "excess", "overdue-total"],
                   "rollups": True, "audit": True})]


def cp49(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("period", "P1", "2026-02-01", "2026-02-10"), ("close", "P1"),
        ("retire", "Ben", "2026-03-05"), ("show_retired", True),
        ("paste", ["Ada,10.00,2026-03-01,first", " ADA ,2.50,,", "ben,3.00,2026-03-05,a, b"]),
        ("paste", ["Ada,1.00,,", "Zed,2.00,,"]),
        ("paste", ["Ada,-1.00,,"]), ("paste", ["Ada,1.005,,"]), ("paste", ["Ben,1.00,,late"]),
        ("paste", ["Ada,1.00,2026-02-05,closed"]), ("paste", [""]),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"claims": ["amount", "date", "note", "status", "due"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp50(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "2"), ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "30.00"),
        ("claim", "Ada", "5.00", "2026-02-05"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 3), ("close", "P1"),
        ("defer", "Ada", 0, "2026-03-15"), ("defer", "Ada", 2, "2026-03-15"), ("defer", "Ada", 1, "2026-03-10"),
        ("defer", "Ada", 3, "2026-03-15"),
        ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["due", "status", "deferred", "deferred-until", "overdue"],
                   "people": ["claimed", "due-total", "overdue-total"], "rollups": True}),
        ("statement", "Ada"), ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "rollups": True}),
        ("today", "2026-03-15"), ("settle", "Ada", 0),
        ("check", {"claims": ["due", "status", "stated", "deferred", "overdue"],
                   "people": ["claimed", "due-total", "overdue-total"], "rollups": True, "audit": True})]


def cp51(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("setting", "proof-threshold", "1.50", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "20.00", "2026-03-01"),
        ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("proof", "Ada", 1), ("settle", "Ada", 1), ("proof", "Ada", 1), ("proof", "Ada", 0),
        ("as", "wes"), ("settle", "Ada", 3), ("proof", "Ada", 3), ("settle", "Ada", 3),
        ("as", "vic"), ("approve", "Ada", 3),
        ("check", {"claims": ["status", "due", "proofs"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp52(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ada", "40.00", "2026-03-07"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("check", {"periods": True, "person_periods": True, "summary": True}),
        ("today", "2026-03-15"),
        ("as", "vic"), ("settle", "Ada", 0), ("void", "Ada", 1), ("open", "Ada", 2),
        ("claim", "Ada", "80.00", "2026-03-08"), ("open", "Ada", 3),
        ("check", {"periods": True, "person_periods": True, "summary": True, "claims": ["status", "due"],
                   "people": ["due-total"]}),
        ("rate", "A", "20.00"), ("hold", "Ada", "2026-03-07", "2026-03-08"),
        ("check", {"periods": True, "person_periods": True, "people": ["due-total"]}),
        ("close", "P1"), ("rate", "A", "30.00"),
        ("check", {"periods": True, "person_periods": True, "summary": True, "audit": True})]


def cp53(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("setting", "perm-open", "steward"),
        ("open", "Ada", 0), ("as", "vic"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("as", "uma"), ("setting", "perm-open", ""), ("open", "Ada", 2),
        ("setting", "perm-settle", "clerk"), ("as", "vic"), ("settle", "Ada", 2), ("as", "wes"), ("settle", "Ada", 2),
        ("setting", "perm-void", "steward"), ("void", "Ada", 0), ("as", "vic"), ("void", "Ada", 0),
        ("setting", "perm-close", "steward"), ("as", "uma"), ("close", "P1"), ("as", "vic"), ("close", "P1"),
        ("setting", "perm-reopen", "clerk,steward"), ("as", "uma"), ("reopen", "P1"),
        ("setting", "perm-reassign", "clerk"), ("person", "Ben", "B"), ("reassign", "Ada", 1, "Ben"),
        ("as", "vic"), ("reassign", "Ben", 0, "Ada"),
        ("check", {"claims": ["status", "due"], "people": ["due-total"], "periods": True, "audit": True})]


def cp54(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "wes", "viewer"), ("role", "vic", "boss"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("as", "wes"),
        ("person", "Ben", "B"), ("claim", "Ada", "20.00"), ("today", "2026-03-11"), ("statement", "Ada"),
        ("hold", "Ada", "2026-03-01", None), ("setting", "floor", "2.00"), ("rate", "A", "20.00"),
        ("settle", "Ada", 0), ("void", "Ada", 0), ("quick", "Dot", "1.00"),
        ("paste", ["Ada,1.00,,"]), ("edit", "Ada", {"grade": "B"}), ("show_retired", True),
        ("retire", "Ada", "2026-03-01"),
        ("check", {"people": ["grade", "due-total", "hold", "retired"], "claims": ["status", "due"],
                   "rollups": True, "rates": True, "counters": True}),
        ("as", "uma"), ("role", "wes", "clerk"), ("as", "wes"), ("settle", "Ada", 0),
        ("check", {"claims": ["status", "due"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp55(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "1"), ("setting", "grace-days", "2"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"), ("claim", "Ada", "30.00", "2026-03-06"),
        ("open", "Ada", 0),
        ("today", "2026-03-12"), ("check", {"periods": True, "rollups": True}),
        ("today", "2026-03-13"), ("open", "Ada", 2), ("open", "Ada", 1),
        ("check", {"periods": True, "claims": ["status", "overdue"], "rollups": True}),
        ("setting", "grace-days", ""), ("today", "2026-03-30"),
        ("check", {"periods": True, "rollups": True}),
        ("setting", "grace-days", "0"), ("today", "2026-03-31"),
        ("check", {"periods": True, "rollups": True, "audit": True})]


def cp56(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"),
        ("claim", "Ada", "20.00", "2026-02-01"), ("claim", "Ada", "10.25", "2026-01-01"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"),
        ("setting", "late-pct", "20.00", "2026-03-01"),
        ("check", {"claims": ["due", "overdue", "stated"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("today", "2026-04-10"),
        ("check", {"claims": ["due", "overdue"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("setting", "late-pct", "0.00", "2026-04-01"), ("today", "2026-05-10"),
        ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["due", "status"], "people": ["due-total", "overdue-total"], "rollups": True, "audit": True})]


def cp57(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "terms", "5"),
        ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.45"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "4.00", "2026-02-05"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 3), ("close", "P1"),
        ("statement", "Ada"),
        ("split", "Ada", 0, "5.25"), ("split", "Ada", 2, "1.00"), ("split", "Ada", 1, "20.00"),
        ("split", "Ada", 1, "0.00"), ("split", "Ada", 3, "1.00"),
        ("check", {"claims": ["amount", "due", "number", "status", "stated", "split-from", "opened-by", "due-by"],
                   "people": ["claimed", "due-total"], "rollups": True}),
        ("as", "wes"), ("settle", "Ada", 1), ("split", "Ada", 1, "5.00"),
        ("check", {"claims": ["amount", "due", "number", "status", "split-from"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp58(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0),
        ("watch", "Ada", True), ("watch", "Ada", True), ("as", "vic"), ("watch", "Ada", True), ("watch", "Ben", True),
        ("settle", "Ada", 0), ("as", "wes"), ("settle", "Ada", 1), ("settle", "Ben", 0),
        ("as", "uma"), ("watch", "Ada", False), ("watch", "Ada", False),
        ("check", {"people": ["watched"], "claims": ["status"]}),
        ("as", "vic"), ("approve", "Ada", 1), ("resettle", "Ada", 0),
        ("check", {"people": ["watched"], "claims": ["status", "due"], "audit": True})]


def cp59(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-05", "2026-03-08"),
        ("generate_periods", "2026-02-15", "2026-04-10"), ("generate_periods", "2026-04-10", "2026-02-15"),
        ("generate_periods", "2026-01-20", "2026-02-05"),
        ("claim", "Ada", "10.00", "2026-02-28"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ada", "30.00", "2026-04-30"),
        ("claim", "Ada", "40.00", "2026-01-31"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("check", {"claims": ["period", "due"], "periods": True, "summary": True}),
        ("close", "2026-02"), ("claim", "Ada", "1.00", "2026-02-10"), ("settle", "Ada", 0),
        ("check", {"claims": ["period", "status"], "periods": True, "audit": True})]


def cp60(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Cam", "10.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "counters": True, "summary": True}),
        ("rate", "C", "30.00"),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "counters": True}),
        ("person", "Dot", "A"), ("claim", "Dot", "15.00"), ("open", "Dot", 0),
        ("today", "2026-03-20"),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "counters": True}),
        ("hold", "Cam", "2026-03-01", None), ("setting", "cap", "1.50"),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "counters": True, "summary": True,
                   "audit": True})]


def cp61(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("period", "P1", "2026-03-01", "2026-03-05"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("close", "P1"),
        ("delegate", "wes", "2026-03-10", "2026-03-12"),
        ("as", "vic"), ("delegate", "wes", "2026-03-12", "2026-03-10"), ("delegate", "wes", "2026-03-10", "2026-03-12"),
        ("as", "wes"), ("reopen", "P1"), ("settle", "Ada", 0), ("delegate", "uma", "2026-03-10", "2026-03-12"),
        ("check", {"claims": ["status", "due"], "periods": True, "people": ["due-total"], "rollups": True}),
        ("today", "2026-03-13"), ("settle", "Ada", 1), ("close", "P1"), ("as", "vic"), ("reopen", "P1"),
        ("check", {"claims": ["status", "due"], "periods": True, "audit": True})]


def cp62(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0),
        ("archive",), ("check", {"sheet": True}),
        ("as", "vic"), ("archive",), ("archive",),
        ("claim", "Ada", "30.00"), ("open", "Ada", 1), ("settle", "Ada", 0), ("today", "2026-03-11"),
        ("statement", "Ada"), ("hold", "Ada", "2026-03-01", None), ("setting", "floor", "2.00"),
        ("rate", "A", "20.00"), ("quick", "Dot", "1.00"), ("paste", ["Ada,1.00,,"]),
        ("bulk_open", [("Ada", 1)]), ("bulk_settle", [("Ada", 0)]), ("person", "Ben", "B"),
        ("edit", "Ada", {"grade": "C"}), ("retire", "Ada", "2026-03-01"),
        ("check", {"sheet": True, "people": ["grade", "due-total", "hold"], "claims": ["status", "due"],
                   "rollups": True, "rates": True, "counters": True, "audit": True})]


def cp63(k):
    return _base(k, today="2026-03-20", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "10"), ("setting", "terms-B", "20"),
        ("edit", "Ben", {"terms": "3"}), ("edit", "Ada", {"terms": "x"}),
        ("person", "Cam", "C", None, "7"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Cam", "10.00", "2026-03-01"),
        ("edit", "Ben", {"terms": ""}), ("claim", "Ben", "10.00", "2026-03-02"),
        ("edit", "Ada", {"terms": "2", "grade": "B"}), ("claim", "Ada", "10.00", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0), ("open", "Ben", 1), ("open", "Ada", 1),
        ("check", {"people": ["terms", "overdue-count"], "claims": ["due-by", "overdue"], "audit": True})]


def cp64(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "floor", "3.00"),
        ("claim", "Ada", "20.00", "2026-02-01"), ("claim", "Ada", "40.00", "2026-02-01"), ("claim", "Ada", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["due", "overdue"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("statement", "Ada"), ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "stated-total"], "rollups": True}),
        ("today", "2026-04-10"), ("setting", "floor", "4.60", "2026-01-01"),
        ("as", "vic"), ("settle", "Ada", 1),
        ("check", {"claims": ["due", "status", "stated"], "people": ["due-total", "overdue-total"], "rollups": True,
                   "audit": True})]


def cp65(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("period", "P1", "2026-03-01", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00", "2026-03-03"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("close", "P1"), ("as", "uma"), ("void", "Ada", 0),
        ("today", "2026-03-15"), ("as", "vic"), ("void", "Ada", 0), ("void", "Ada", 2),
        ("check", {"claims": ["status", "due", "number"], "people": ["claimed", "due-total"], "rollups": True,
                   "periods": True}),
        ("today", "2026-03-18"), ("void", "Ada", 1),
        ("check", {"claims": ["status", "due", "number"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp66(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "period-numbering-from", "2026-03-01"), ("setting", "terms", "5"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("period", "P3", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ada", "30.00", "2026-03-07"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"), ("close", "P3"),
        ("redate", "Ada", 0, "2026-03-15"),
        ("as", "vic"), ("redate", "Ada", 0, "2026-03-15"), ("redate", "Ada", 2, "2026-03-15"),
        ("redate", "Ada", 1, "2026-02-05"), ("redate", "Ada", 1, "2026-03-08"),
        ("open", "Ada", 2),
        ("check", {"claims": ["date", "number", "period", "due-by", "stated", "due"], "periods": True,
                   "person_periods": True}),
        ("retire", "Ada", "2026-03-12"), ("show_retired", True), ("redate", "Ada", 1, "2026-03-13"), ("redate", "Ada", 1, "2026-03-12"),
        ("check", {"claims": ["date", "number", "period", "due-by", "stated"], "periods": True, "audit": True})]


def cp67(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "A"))) + [
        ("claim", "Ada", "10.00", "2026-02-09"), ("claim", "Ben", "10.00", "2026-02-08"), ("claim", "Cam", "10.00"),
        ("claim", "Ada", "5.00", "2026-01-01"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0), ("open", "Ada", 1),
        ("check", {"people": ["active"], "summary": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("hold", "Cam", "2026-03-01", None),
        ("check", {"people": ["active"], "summary": True}),
        ("today", "2026-03-11"), ("retire", "Ben", "2026-03-11"),
        ("check", {"people": ["active"], "summary": True, "audit": True})]


def cp68(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00", "2025-12-01"),
        ("claim", "Ben", "40.00", "2025-12-11"),
        ("open", "Ben", 0), ("open", "Ben", 1), ("open", "Ben", 2), ("open", "Ben", 3),
        ("as", "vic"), ("settle", "Ben", 0), ("settle", "Ben", 2), ("settle", "Ben", 3),
        ("patron", "Ada", "Ben"),
        ("check", {"people": ["backing", "due-total"], "claims": ["status", "due"]}),
        ("rate", "B", "10.00"), ("void", "Ben", 3),
        ("check", {"people": ["backing", "due-total"]}),
        ("today", "2026-06-10"),
        ("check", {"people": ["backing", "due-total"], "audit": True})]


def cp69(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 1),
        ("as", "wes"), ("claim_edit_open", "Ada", 2),
        ("as", "uma"), ("claim_edit_open", "Ada", 2), ("claim_edit_cancel", "Ada", 2),
        ("claim_edit_open", "Ada", 0), ("claim_edit_open", "Ada", 1),
        ("as", "vic"), ("claim_edit_open", "Ada", 0), ("claim_edit", "Ada", 0, {"amount": "11.00"}),
        ("claim_edit", "Ada", 1, {"amount": "21.00"}),
        ("as", "uma"), ("claim_edit_save", "Ada", 0, {"amount": "12.00"}),
        ("as", "vic"), ("claim_edit", "Ada", 0, {"amount": "13.00"}),
        ("as", "uma"), ("claim_edit_open", "Ada", 0), ("claim_edit_cancel", "Ada", 0),
        ("as", "vic"), ("claim_edit_open", "Ada", 0), ("claim_edit_cancel", "Ada", 0),
        ("as", "uma"), ("claim_edit_open", "Ada", 0), ("as", "vic"), ("claim_edit_open", "Ada", 0),
        ("as", "uma"), ("today", "2026-03-11"), ("as", "vic"), ("claim_edit_save", "Ada", 0, {"amount": "14.00"}),
        ("check", {"claims": ["amount", "status"], "people": ["claimed"], "audit": True})]


def cp70(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("open", "Ada", 0),
        ("setting", "perm-close", "steward"), ("soft_close", "P1"),
        ("as", "vic"), ("soft_close", "P1"), ("soft_close", "P1"), ("as", "uma"), ("setting", "perm-close", ""),
        ("claim", "Ada", "20.00", "2026-03-06"), ("open", "Ada", 1), ("claim", "Ada", "30.00", "2026-03-15"),
        ("rate", "A", "20.00"), ("reopen", "P1"),
        ("check", {"periods": True, "person_periods": True, "claims": ["due", "late-entry", "period"],
                   "people": ["due-total"], "summary": True}),
        ("close", "P1"), ("claim", "Ada", "40.00", "2026-03-07"), ("rate", "A", "30.00"),
        ("check", {"periods": True, "person_periods": True, "claims": ["due"]}),
        ("as", "vic"), ("reopen", "P1"), ("soft_close", "P1"), ("reopen", "P1"),
        ("check", {"periods": True, "person_periods": True, "claims": ["late-entry"], "audit": True})]


def cp71(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("setting", "floor", "0.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("unstate", "Ada"), ("as", "vic"), ("unstate", "Ada"), ("as", "uma"),
        ("statement", "Ada"), ("rate", "A", "20.00"), ("open", "Ada", 2), ("statement", "Ada"), ("rate", "A", "30.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "statement-count", "stated-total",
                                                            "statement-date"], "rollups": True}),
        ("as", "vic"), ("unstate", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "statement-count", "stated-total",
                                                            "statement-date"], "rollups": True}),
        ("unstate", "Ada"), ("unstate", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "statement-count", "stated-total",
                                                            "statement-date"], "rollups": True, "audit": True})]


def cp72(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-02"), ("claim", "Ada", "30.00", "2026-03-03"),
        ("claim", "Ben", "10.00", "2026-03-01"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0),
        ("as", "vic"), ("settle", "Ada", 2), ("as", "uma"), ("statement", "Ada"), ("rate", "A", "20.00"),
        ("claim", "Ada", "40.00", "2026-03-04"), ("open", "Ada", 3),
        ("retire", "Ada", "2026-03-15"), ("show_retired", True),
        ("check", {"people": ["retired", "claimed", "due-total"], "claims": ["due", "status", "stated"],
                   "rollups": True, "summary": True}),
        ("today", "2026-03-15"),
        ("check", {"people": ["retired", "claimed", "due-total"], "rollups": True, "summary": True}),
        ("retire", "Ben", "2026-03-01"),
        ("check", {"people": ["retired", "claimed", "due-total"], "rollups": True, "audit": True})]


def cp73(k):
    chk = {"people": ["due-total", "statement-count", "stated-total", "statement-date", "hold", "retired"],
           "claims": ["due", "status", "stated"], "rollups": True, "periods": True}
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")),
                 rates=(("A", "10.00"), ("B", "12.50"))) + [
        ("role", "wes", "viewer"), ("role", "vic", "steward"),
        ("setting", "floor", "2.00"), ("setting", "late-pct", "10.00"), ("setting", "terms", "5"),
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("today", "2026-03-05"), ("rate", "A", "20.00"), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("statement", "Ada", "2026-03-01"),
        ("check", chk),
        ("statement", "Ada", "2026-03-20"),
        ("today", "2026-03-10"), ("hold", "Ada", "2026-03-01", None), ("retire", "Ben", "2026-03-10"),
        ("show_retired", True), ("statement", "Ben", "2026-03-09"), ("statement", "Ben", "2026-03-10"),
        ("close", "P1"), ("today", "2026-03-20"), ("rate", "A", "30.00"), ("claim", "Ada", "7.77"),
        ("open", "Ada", 2), ("statement", "Ada", "2026-03-05"),
        ("check", dict(chk, rates=True, summary=True)),
        ("as", "wes"), ("statement", "Ada", "2026-03-05"),
        ("as", "vic"), ("unstate", "Ada"),
        ("check", chk),
        ("statement", "Ada", "2026-03-20"), ("statement", "Ada"),
        ("check", chk),
        ("archive",), ("statement", "Ada", "2026-03-05"),
        ("check", {"people": ["statement-count", "stated-total", "statement-date"], "claims": ["stated"],
                   "audit": True})]


def cp74(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "5"), ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("today", "2026-03-05"), ("rate", "A", "20.00"), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("statement", "Ada", "2026-03-01"), ("person", "Ben", "B"),
        ("today", "2026-03-10"), ("hold", "Ada", "2026-03-01", None), ("retire", "Ben", "2026-03-10"),
        ("close", "P1"), ("today", "2026-03-20"), ("rate", "A", "30.00"),
        ("check", {"people": ["due-total", "hold", "retired", "statement-count", "overdue-total"],
                   "claims": ["due", "status", "stated", "overdue"], "rollups": True, "periods": True,
                   "rates": True, "summary": True, "counters": True, "sheet": True}),
        ("asof", "2026-03-01"),
        ("check", {"people": ["due-total", "hold", "retired", "statement-count", "overdue-total"],
                   "claims": ["due", "status", "stated", "overdue"], "rollups": True, "periods": True,
                   "rates": True, "summary": True, "counters": True, "sheet": True}),
        ("statement", "Ada", "2026-03-01"), ("open", "Ada", 1), ("rate", "A", "40.00"), ("today", "2026-03-21"),
        ("asof", "2026-03-07"),
        ("check", {"people": ["due-total", "hold", "retired", "statement-count", "overdue-total"],
                   "claims": ["due", "status", "stated", "overdue"], "rollups": True, "periods": True,
                   "rates": True, "summary": True, "counters": True, "sheet": True}),
        ("asof", "2026-03-10"),
        ("check", {"people": ["due-total", "hold", "retired"], "claims": ["due", "status"], "rollups": True,
                   "periods": True, "sheet": True}),
        ("as", "vic"), ("statement", "Ada", "2026-03-05"),
        ("check", {"people": ["due-total", "statement-count", "statement-date"], "claims": ["due", "status", "stated"],
                   "sheet": True}),
        ("as", "uma"), ("asof_clear",),
        ("check", {"people": ["due-total", "hold", "statement-count", "statement-date"], "claims": ["due", "status", "stated"],
                   "rollups": True, "sheet": True, "audit": True})]


def cp75(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")),
                 rates=(("A", "10.00"), ("B", "20.00"), ("C", "30.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"),
        ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Cam", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Cam", 0),
        ("statement", "Ben"),
        ("bulk_grade", ["Cam", "Ada"], "B", "2026-03-05"),
        ("check", {"people": ["grade", "due-total"], "claims": ["due", "stated"], "rollups": True}),
        ("bulk_grade", ["Ben"], "A"),
        ("check", {"people": ["grade", "due-total"], "claims": ["due", "stated"], "rollups": True, "audit": True})]


def cp76(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "grace-days", "0"),
        ("setting", "cap", "3.00"),
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ben", "40.00", "2026-03-01"),
        ("open", "Ada", 0), ("open", "Ben", 0),
        ("today", "2026-03-11"),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "periods": True}),
        ("today", "2026-04-10"), ("person", "Cam", "C"), ("today", "2026-04-11"),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "periods": True, "audit": True})]


def cp77(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "note-threshold", "1.50", "2026-03-05"), ("setting", "floor", "2.00", "2026-03-08"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "20.00", None, "n"), ("claim", "Ada", "10.00"),
        ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "5.00", "2026-03-09"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3), ("open", "Ada", 4),
        ("bulk_open", [("Ada", 0), ("Ada", 4)]),
        ("claim_edit", "Ada", 0, {"note": "x"}), ("open", "Ada", 0),
        ("check", {"claims": ["status", "due", "note", "number"], "people": ["due-total"], "audit": True})]


def cp78(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-02-08"), ("claim", "Ada", "30.00", "2026-02-07"),
        ("claim", "Ada", "40.00", "2026-01-09"), ("claim", "Ada", "50.00", "2026-01-08"), ("claim", "Ada", "60.00", "2026-03-20"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3), ("open", "Ada", 4), ("open", "Ada", 5),
        ("check", {"people": ["aged-0-30", "aged-31-60", "aged-61", "due-total"]}),
        ("as", "vic"), ("settle", "Ada", 4), ("today", "2026-03-11"),
        ("check", {"people": ["aged-0-30", "aged-31-60", "aged-61", "due-total"]}),
        ("hold", "Ada", "2026-02-01", "2026-02-28"), ("defer", "Ada", 0, "2026-03-20"),
        ("check", {"people": ["aged-0-30", "aged-31-60", "aged-61", "due-total"], "audit": True})]


def cp79(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "terms", "5"), ("period", "P1", "2026-02-01", "2026-02-10"), ("close", "P1"),
        ("setting", "entry-date", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-03-09"), ("quick", "Ben", "5.00"),
        ("paste", ["Ada,1.00,,", "Ben,2.00,2026-03-01,"]),
        ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"),
        ("claim", "Ada", "-1.00", None, "fix", "1"),
        ("retire", "Ben", "2026-03-04"), ("show_retired", True), ("claim", "Ben", "3.00"),
        ("setting", "entry-date", "2026-02-05"), ("claim", "Ada", "4.00"),
        ("setting", "entry-date", ""), ("claim", "Ada", "6.00"),
        ("check", {"claims": ["date", "due-by", "status", "corrects"], "people": ["claimed"], "audit": True})]


def cp80(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "terms", "10"), ("setting", "terms-B", "3"), ("setting", "period-numbering-from", "2026-03-01"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ben", "20.00", "2026-03-05"), ("claim", "Ada", "30.00", "2026-02-25"),
        ("claim", "Ada", "40.00", "2026-03-15"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["period", "number", "due-by"], "periods": True, "person_periods": True, "summary": True}),
        ("close", "P1"),
        ("claim", "Ada", "50.00", "2026-03-08"), ("claim", "Ada", "60.00", "2026-02-26"), ("claim", "Ben", "70.00", "2026-03-06"),
        ("open", "Ada", 3), ("as", "vic"), ("settle", "Ada", 1), ("settle", "Ben", 0),
        ("check", {"claims": ["period", "number", "due-by", "status"], "periods": True, "person_periods": True,
                   "summary": True, "audit": True})]


SCRIPTS = {n: globals()[f"cp{n:02d}"] for n in range(1, 81)}
