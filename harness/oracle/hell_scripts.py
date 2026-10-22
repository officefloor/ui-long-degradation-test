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
        ("claim", "Ada", "-20.00", None, "fix", ("number", "Ada", 0)), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"),
        ("claim", "Ada", "-5.00", None, "", "9"), ("claim", "Ada", "-5.00"),
        ("claim", "Ada", "-5.00", None, "", ("number", "Ada", 1)),
        ("claim", "Ada", "-3.00", "2026-03-01", "", ("number", "Ada", 0)), ("open", "Ada", 2),
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
        ("claim", "Ada", "-10.25", None, "fix", ("number", "Ada", 0)), ("open", "Ada", 4),
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
        ("watch", "Ada", True), ("as", "vic"), ("watch", "Ada", True), ("watch", "Ben", True),
        ("settle", "Ada", 0), ("as", "wes"), ("settle", "Ada", 1), ("settle", "Ben", 0),
        ("as", "uma"), ("watch", "Ada", False),
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
        ("claim", "Ada", "-1.00", None, "fix", ("number", "Ada", 0)),
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



# ---- Act II, second half (cp81-100) ------------------------------------------------------------

A1 = (("A", "10.00"),)


def cp81(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("role", "wes", "viewer"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 2),
        ("remind", "Ada", 0), ("remind", "Ada", 0), ("remind", "Ada", 1),
        ("as", "wes"), ("remind", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 2), ("delegate", "wes", "2026-03-11", "2026-03-12"),
        ("as", "uma"), ("today", "2026-03-11"), ("remind", "Ada", 0),
        ("as", "wes"), ("remind", "Ada", 2), ("remind", "Ada", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("remind", "Ada", 0),
        ("check", {"claims": ["reminded", "status"], "audit": True})]


def cp82(k):
    return _base(k) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00", "2026-03-02"),
        ("claim", "Ben", "8.00"), ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0), ("open", "Ben", 1),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ben", 0),
        ("check", {"people": ["settled-total", "open-total", "due-total"], "rollups": True}),
        ("as", "uma"), ("rate", "A", "20.00"), ("hold", "Ada", "2026-03-02", "2026-03-02"),
        ("defer", "Ben", 1, "2026-03-20"), ("setting", "cap", "5.00"),
        ("check", {"people": ["settled-total", "open-total", "due-total", "excess"], "claims": ["due", "status"],
                   "rollups": True, "audit": True})]


def cp83(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00"),
        ("holiday", "2026-03-15"), ("holiday", "2026-03-15"), ("holiday", "2026-03-16"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00", "2026-03-09"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count"], "rollups": True}),
        ("today", "2026-03-16"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("today", "2026-03-18"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"], "rollups": True,
                   "audit": True})]


def cp84(k):
    return _base(k, today="2026-03-06", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "1"), ("setting", "terms-B", "5"), ("holiday", "2026-03-11"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-03-07"), ("claim", "Ben", "30.00", "2026-03-04"),
        ("claim", "Ben", "40.00", "2026-03-10"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count"], "rollups": True}),
        ("today", "2026-03-12"), ("setting", "late-pct", "10.00"),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("today", "2026-04-20"),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-total"], "rollups": True, "audit": True})]


def cp85(k):
    return _base(k, today="2026-03-02", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "2"), ("setting", "late-pct", "10.00"), ("setting", "grace-A", "3"),
        ("claim", "Ada", "20.00"), ("claim", "Ben", "20.00"), ("claim", "Ada", "10.00", "2026-02-20"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ada", 1),
        ("today", "2026-03-05"),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("today", "2026-03-10"),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("setting", "grace-A", "", "2026-03-01"),
        ("check", {"claims": ["overdue", "due"], "people": ["overdue-total"], "rollups": True}),
        ("setting", "grace-A", "3", "2026-02-01"), ("today", "2026-04-08"),
        ("check", {"claims": ["overdue", "due"], "people": ["overdue-total"], "rollups": True, "audit": True})]


def cp86(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2026-02-01", "2026-02-10"), ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "5.00", "2026-02-05"),
        ("close", "P1"), ("open", "Ada", 1),
        ("inline", "Ada", 0, "12.50"), ("inline", "Ada", 0, "1.005"), ("inline", "Ada", 0, "-1.00"),
        ("inline", "Ada", 1, "21.00"), ("inline", "Ada", 2, "6.00"),
        ("as", "vic"), ("claim_edit_open", "Ada", 0), ("as", "uma"), ("inline", "Ada", 0, "13.00"),
        ("as", "vic"), ("claim_edit_cancel", "Ada", 0), ("as", "uma"), ("inline", "Ada", 0, "14.00"),
        ("as", "wes"), ("inline", "Ada", 0, "15.00"),
        ("as", "uma"), ("open", "Ada", 0),
        ("check", {"claims": ["amount", "due", "status"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp87(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("claim", "Ada", "10.00", None, "", None, {"ref": " INV-1 "}),
        ("claim", "Ada", "20.00", None, "", None, {"ref": "inv-1"}),
        ("claim", "Ben", "30.00", None, "", None, {"ref": "INV-2"}),
        ("claim", "Ben", "40.00", None, "", None, {"ref": ""}),
        ("claim_edit", "Ada", 0, {"ref": "INV-2"}), ("claim_edit", "Ada", 0, {"ref": "INV-3"}),
        ("paste", ["Ada,1.00,,note #INV-4", "Ben,2.00,2026-03-01, #inv-4"]),
        ("paste", ["Ada,1.00,,note, more #INV-4", "Ben,2.00,2026-03-01, #INV-5"]),
        ("paste", ["Ada,3.00,,x #inv-5"]),
        ("open", "Ada", 0), ("open", "Ben", 0),
        ("check", {"claims": ["ref", "amount", "note", "status"], "people": ["claimed"], "audit": True})]


def cp88(k):
    return _base(k, today="2026-01-05", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"),
        ("claim", "Ada", "200.00"), ("claim", "Ada", "10.25"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("statement", "Ada"),
        ("today", "2026-04-12"),
        ("check", {"claims": ["due", "overdue", "stated"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("setting", "late-pct", "5.00", "2026-03-01"), ("today", "2026-05-12"),
        ("check", {"claims": ["due", "overdue"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("today", "2026-06-15"),
        ("check", {"claims": ["due", "status"], "people": ["due-total", "overdue-total"], "rollups": True, "audit": True})]


def cp89(k):
    return _base(k) + [
        ("claim", "Ada", "10.00", None, "", None, {"tags": "a, B ,a"}),
        ("claim", "Ada", "20.00", None, "", None, {"tags": "b"}),
        ("claim", "Ben", "40.00", None, "", None, {"tags": " c "}),
        ("claim", "Ben", "8.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"claims": ["tags", "due"], "tags": True, "rollups": True}),
        ("claim_edit", "Ben", 1, {"tags": "a"}), ("claim_edit", "Ada", 0, {"tags": "d"}),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("rate", "A", "20.00"), ("hold", "Ben", "2026-03-10", None),
        ("void", "Ada", 0),
        ("check", {"claims": ["tags", "due", "status"], "tags": True, "rollups": True, "audit": True})]


def cp90(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "40.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("void", "Ada", 3),
        ("void_reason", " dup "), ("void_reason", "dup"), ("void_reason", ""), ("void_reason", "error"),
        ("void", "Ada", 0), ("void", "Ada", 0, "late"), ("void", "Ada", 0, "dup"),
        ("as", "vic"), ("settle", "Ada", 1), ("void", "Ada", 1, "error"), ("void", "Ada", 2, "error"),
        ("check", {"claims": ["status", "due", "number"], "people": ["due-total"], "summary": True, "rollups": True,
                   "audit": True})]


def cp91(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0),
        ("comment", "Ada", 0, "first"), ("comment", "Ada", 0, " "), ("comment", "Ada", 1, "draft note"),
        ("as", "vic"), ("today", "2026-03-11"), ("comment", "Ada", 0, "second"),
        ("as", "wes"), ("comment", "Ada", 0, "nope"),
        ("as", "vic"), ("settle", "Ada", 0), ("comment", "Ada", 0, "paid"),
        ("check", {"claims": ["comments", "status"], "audit": True})]


def cp92(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("as", "vic"), ("claim_edit", "Ada", 0, {"amount": "11.00"}), ("inline", "Ada", 1, "21.00"),
        ("as", "wes"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("as", "uma"), ("settle", "Ada", 0), ("settle", "Ada", 1),
        ("as", "vic"), ("approve", "Ada", 0), ("approve", "Ada", 1),
        ("as", "wes"), ("bulk_settle", [("Ada", 0), ("Ada", 1)]),
        ("check", {"claims": ["status", "due", "amount"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp93(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("claim", "Cam", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("statement", "Ada"),
        ("as", "vic"), ("settle", "Ada", 1), ("retire", "Cam", "2026-03-01"), ("show_retired", True),
        ("as", "uma"), ("bulk_reassign", [("Ada", 0), ("Ben", 0)], "Ben"),
        ("as", "vic"), ("bulk_reassign", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Cam", 0)], "Ben"),
        ("bulk_reassign", [("Ben", 1), ("Ben", 2)], "Cam"),
        ("check", {"claims": ["number", "status", "due", "stated"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp94(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "proof-threshold", "1.50"), ("setting", "proof-threshold-B", "5.00", "2026-03-05"),
        ("claim", "Ada", "20.00"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00", "2026-03-01"),
        ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1), ("open", "Ben", 2),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ben", 0), ("settle", "Ben", 1), ("settle", "Ben", 2),
        ("proof", "Ben", 0), ("settle", "Ben", 0),
        ("as", "uma"), ("setting", "proof-threshold-B", "", "2026-03-05"), ("as", "vic"), ("settle", "Ben", 1),
        ("check", {"claims": ["status", "due", "proofs"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp95(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "floor", "2.00"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "5.00"), ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0),
        ("rate_preview", "A", "20.00"), ("rate_preview", "B", "20.00"), ("rate_preview", "A", "x"),
        ("statement", "Ada"), ("rate_preview", "A", "30.00"),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("rate", "A", "5.00", "2026-03-05"),
        ("rate_preview", "A", "40.00"), ("edit", "Ben", {"grade": "A"}), ("rate_preview", "A", "40.00"),
        ("check", {"claims": ["due", "stated", "status"], "people": ["due-total"], "rates": True, "audit": True})]


def cp96(k):
    return _base(k, today="2026-03-06", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "2"), ("setting", "late-pct", "10.00"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-03-02"), ("claim", "Ada", "30.00", "2026-03-04"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"), ("today", "2026-03-09"),
        ("check", {"claims": ["due-by", "overdue", "status"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("holiday", "2026-03-09"), ("holiday", "2026-03-10"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"], "rollups": True}),
        ("holiday", "2026-03-04"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"], "rollups": True, "audit": True})]


def cp97(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("claim", "Ada", "10.00", "2026-01-31"), ("claim", "Ada", "20.00", "2026-02-01"), ("claim", "Ben", "30.00", "2026-02-28"),
        ("claim", "Ben", "40.00"), ("claim", "Ben", "50.00", "2026-04-02"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"months": True, "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("rate", "A", "20.00"), ("hold", "Ben", "2026-02-01", "2026-02-28"),
        ("void", "Ada", 1),
        ("check", {"months": True, "claims": ["due", "status"], "rollups": True, "audit": True})]


def cp98(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "3.00"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"rollups": True, "claims": ["batch"]}),
        ("as", "vic"), ("bulk_settle", [("Ben", 1), ("Ada", 1)]),
        ("check", {"rollups": True, "claims": ["batch", "status"]}),
        ("as", "wes"), ("settle", "Ada", 0),
        ("bulk_settle", [("Ben", 0), ("Ada", 1)]), ("bulk_settle", [("Ada", 0)]),
        ("check", {"rollups": True, "claims": ["batch", "status", "due"], "people": ["due-total"], "audit": True})]


def cp99(k):
    return _base(k, people=(), rates=()) + [
        ("role", "wes", "viewer"),
        ("person", "Ada", "A", None, None, {"contact": " Ada@X "}),
        ("person", "Ben", "B", None, None, {"contact": "ada@x"}),
        ("person", "Ben", "B", None, None, {"contact": ""}),
        ("person", "Cam", "C", None, None, {"contact": "cam@x"}),
        ("edit", "Ben", {"contact": "CAM@X"}), ("edit", "Ben", {"contact": " ben@x "}),
        ("edit_open", "Cam"), ("as", "vic"), ("edit_open", "Cam"), ("edit_save", {"contact": "vic@x"}),
        ("as", "uma"), ("edit_save", {"contact": "ada@x"}),
        ("edit", "Cam", {"contact": "", "grade": "A"}),
        ("as", "wes"), ("edit", "Ada", {"contact": "ben@x"}),
        ("as", "uma"), ("quick", "Dot", "1.00"),
        ("check", {"people": ["name", "grade", "contact"], "audit": True})]


def cp100(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "3.00"), ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("claim", "Ben", "5.00"),
        ("claim", "Ben", "2.00", "2026-02-05"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 2), ("close", "P1"),
        ("as", "vic"), ("bulk_settle", [("Ada", 0), ("Ben", 1)]),
        ("check", {"rollups": True, "claims": ["batch", "status"]}),
        ("bulk_settle", [("Ada", 0), ("Ben", 2)]),
        ("check", {"rollups": True, "claims": ["batch", "status"]}),
        ("as", "wes"), ("bulk_settle", [("Ben", 0), ("Ada", 1)]),
        ("as", "vic"), ("bulk_settle", [("Ada", 0), ("Ada", 1)]),
        ("check", {"rollups": True, "claims": ["batch", "status", "due"], "people": ["due-total"], "audit": True})]



# ---- Act III (cp101-150): identity, hierarchy, cross-sheet ------------------------------------

AB = (("A", "10.00"), ("B", "20.00"))


def cp101(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("rate", "A", "20.00"), ("statement", "Ada"),
        ("edit", "Ben", {"grade": "A"}), ("hold", "Ben", "2026-03-01", None),
        ("audit_view", ""), ("audit_view", " ada "), ("audit_view", "Ben"), ("audit_view", "Cam"),
        ("check", {"people": ["due-total"], "rollups": True, "audit": True})]


def cp102(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("alias", "Ada", " Addie "), ("alias", "Ada", "addie"), ("alias", "Ben", "ADA"), ("alias", "Ben", ""),
        ("alias", "Ben", "Benny"), ("person", "benny", "C"), ("edit", "Ben", {"name": "Addie"}),
        ("quick", "ADDIE", "5.00"), ("paste", ["benny,2.50,,"]), ("quick", "Cam", "1.00"),
        ("open", "Ada", 0), ("open", "Ben", 0),
        ("check", {"people": ["name", "aliases", "claimed", "due-total"], "claims": ["amount", "status"], "rollups": True,
                   "audit": True})]


def cp103(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("setting", "entry-date", "2026-03-05"), ("period", "P1", "2026-02-01", "2026-02-10"),
        ("template", "Fee", "12.50", "fee"), ("template", " ", "1.00", ""), ("template", "Bad", "1.005", ""),
        ("claim_template", "Ada", "Fee"), ("template", "Fee", "20.00", "fee2"), ("claim_template", "Ada", "Fee"),
        ("claim_template", "Ada", "None"),
        ("setting", "entry-date", "2026-02-05"), ("close", "P1"), ("claim_template", "Ada", "Fee"),
        ("setting", "entry-date", ""), ("claim_template", "Ada", "Fee"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["amount", "note", "date", "due", "status"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp104(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "period-numbering-from", "2026-03-06"),
        ("period", "P1", "2026-03-01", "2026-03-05"), ("period", "P2", "2026-03-06", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-02"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("statement", "Ada"),
        ("as", "vic"), ("reassign", "Ada", 0, "Ben"), ("reassign", "Ada", 1, "Ben"), ("reassign", "Ada", 2, "Ben"),
        ("open", "Ben", 3), ("bulk_reassign", [("Ben", 1), ("Ben", 0)], "Ada"),
        ("check", {"claims": ["number", "status", "due", "stated"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp105(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("pool", "P1"), ("pool", " P1 "), ("pool", ""), ("pool", "P2"),
        ("pool_member", "P1", "Ada", "50.00"), ("pool_member", "P1", "Ada", "10.00"), ("pool_member", "P1", "Ben", "0.00"),
        ("pool_member", "P1", "Ben", "100.01"), ("pool_member", "P1", "Ben", "33.335"), ("pool_member", "P1", "Ben", "50.00"),
        ("pool_member", "P2", "Ada", "60.00"), ("pool_member", "P2", "Cam", "40.00"),
        ("check", {"pools": True}),
        ("retire", "Cam", "2026-03-01"), ("show_retired", True),
        ("check", {"pools": True, "audit": True})]


def cp106(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("pool", "P1"), ("pool_member", "P1", "Ada", "33.33"), ("pool_member", "P1", "Ben", "33.33"), ("pool_member", "P1", "Cam", "33.34"),
        ("pool", "P2"), ("pool_member", "P2", "Ada", "50.00"), ("pool_member", "P2", "Ben", "50.00"),
        ("pool", "P3"), ("pool_member", "P3", "Cam", "70.00"),
        ("check", {"pools": True}),
        ("setting", "pot", "10.01"),
        ("check", {"pools": True}),
        ("setting", "pot", "0.07"), ("hold", "Ben", "2026-03-01", None),
        ("check", {"pools": True}),
        ("retire", "Ada", "2026-03-05"), ("show_retired", True),
        ("check", {"pools": True, "audit": True})]


def cp107(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1), ("as", "vic"), ("settle", "Ben", 1),
        ("as", "uma"), ("statement", "Ben"), ("rate", "B", "10.00"),
        ("alias", "Ben", "Benny"), ("patron", "Ben", "Cam"), ("patron", "Ada", "Ben"), ("patron", "Cam", "Ben"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "40.00"), ("pool_member", "P1", "Ben", "60.00"),
        ("merge", "Ben", "Ada"), ("as", "vic"), ("merge", "Ben", "Ben"), ("merge", "Ben", "Ada"),
        ("hidden", "Ben"),
        ("check", {"people": ["name", "aliases", "patrons", "backing", "claimed", "due-total", "statement-count"],
                   "claims": ["amount", "number", "status", "due", "stated"], "pools": True, "rollups": True}),
        ("quick", "benny", "1.00"), ("merge", "Cam", "Ada"),
        ("check", {"people": ["name", "aliases", "patrons", "claimed", "due-total"], "claims": ["amount", "status"],
                   "rollups": True, "audit": True})]


def cp108(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"), ("Dot", "A")), rates=(("A", "10.00"), ("B", "20.00"), ("C", "30.00"))) + [
        ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Cam", "10.00", "2026-03-01"), ("claim", "Dot", "10.01", "2026-03-01"),
        ("open", "Ben", 0), ("open", "Cam", 0), ("open", "Dot", 0),
        ("as", "vic"), ("settle", "Ben", 0), ("settle", "Cam", 0), ("settle", "Dot", 0),
        ("patron", "Ada", "Ben"), ("patron", "Ada", "Cam"), ("patron", "Ada", "Dot"),
        ("patron", "Ben", "Dot"), ("patron", "Ben", "Cam"),
        ("check", {"people": ["patrons", "backing"]}),
        ("as", "uma"), ("today", "2026-06-10"),
        ("check", {"people": ["patrons", "backing"], "audit": True})]


def cp109(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("rate", "A", "10.00"), ("rate", "B", "20.00", "2026-03-05"),
            ("rate", "C", "30.00", None, "2026-03-04"), ("person", "Pam", "A"),
            ("sheet", "pp"), ("today", T), ("rate", "C", "40.00"), ("person", "Pip", "C"),
            ("sheet", "p"), ("setting", "parent", "__SHEET__-pp"),
            ("sheet", ""), ("today", T), ("person", "Ada", "A"), ("person", "Ben", "B"), ("person", "Cam", "C"),
            ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-06"),
            ("claim", "Cam", "10.00", "2026-03-01"), ("claim", "Cam", "10.00"),
            ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1), ("open", "Cam", 0), ("open", "Cam", 1),
            ("setting", "parent", "__SHEET__"), ("setting", "parent", "__SHEET__-x"),
            ("check", {"sheet": True, "claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True}),
            ("setting", "parent", "__SHEET__-p"),
            ("check", {"sheet": True, "claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True}),
            ("rate", "B", "5.00"), ("statement", "Cam"),
            ("sheet", "pp"), ("setting", "parent", "__SHEET__"),
            ("sheet", ""),
            ("check", {"sheet": True, "claims": ["due", "stated"], "people": ["due-total"], "rollups": True, "rates": True,
                       "audit": True})]


def cp110(k):
    return [("as", "uma"), ("sheet", "c1"), ("today", T), ("rate", "A", "10.00"), ("person", "Cy", "A"),
            ("claim", "Cy", "10.00"), ("open", "Cy", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("setting", "terms", "5"),
            ("person", "Ada", "A"), ("person", "Ben", "A"), ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"),
            ("open", "Ada", 0), ("open", "Ben", 0),
            ("check", {"sheet": True, "rollups": True, "counters": True}),
            ("sheet", "c1"), ("setting", "parent", "__SHEET__"), ("sheet", "c2"), ("today", T), ("setting", "parent", "__SHEET__-c1"),
            ("rate", "A", "30.00"), ("person", "Dee", "A"), ("claim", "Dee", "5.00", "2026-03-01"), ("open", "Dee", 0),
            ("sheet", ""),
            ("check", {"sheet": True, "rollups": True, "counters": True}),
            ("hold", "Ada", "2026-03-01", None), ("today", "2026-03-20"),
            ("check", {"sheet": True, "rollups": True, "counters": True}),
            ("sheet", "c1"),
            ("check", {"sheet": True, "rollups": True, "audit": True})]


def cp111(k):
    s = [("as", "uma"), ("sheet", "t"), ("today", T), ("rate", "A", "20.00"), ("person", "Tom", "A"),
         ("person", "Ada", "A"), ("claim", "Tom", "1.00"), ("open", "Tom", 0),
         ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("rate", "B", "20.00"), ("role", "vic", "steward"),
         ("person", "Ben", "B", None, "3", {"contact": "ben@x"}), ("person", "Cam", "C"), ("person", "Ada", "A"),
         ("alias", "Ben", "Benny"), ("patron", "Cam", "Ben"),
         ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00", "2026-03-02"),
         ("open", "Ben", 1), ("open", "Ben", 0), ("statement", "Ben"), ("rate", "B", "10.00"),
         ("as", "vic"), ("settle", "Ben", 1),
         ("as", "uma"), ("transfer", "Ben", "t"), ("as", "vic"), ("transfer", "Ben", ""),
         ("retire", "Cam", "2026-03-01"), ("show_retired", True), ("transfer", "Cam", "t"),
         ("transfer", "Ben", "t"), ("hidden", "Ben"),
         ("check", {"people": ["name", "patrons", "claimed", "due-total"], "rollups": True}),
         ("sheet", "t"),
         ("check", {"people": ["name", "grade", "terms", "contact", "aliases", "statement-count", "claimed", "due-total"],
                    "claims": ["number", "amount", "date", "status", "due", "stated"], "rollups": True, "audit": True}),
         ("sheet", ""), ("transfer", "Ada", "t")]
    if k >= 128:
        s += [("hidden", "Ada"), ("sheet", "t"),
              ("check", {"people": ["name", "aliases", "claimed"], "claims": ["number", "status"], "audit": True})]
    else:
        s += [("check", {"people": ["name"], "audit": True})]
    return s


def cp112(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("person", "Ada", "A"), ("person", "Pam", "A"), ("alias", "Pam", "Pammy"),
            ("sheet", ""), ("today", T), ("person", "Ada", "B"), ("person", "Ben", "B"),
            ("setting", "parent", "__SHEET__-p"),
            ("person", "pam", "A"), ("person", "PAMMY", "A"), ("alias", "Ben", "ada"), ("quick", "Pam", "1.00"),
            ("paste", ["pammy,1.00,,"]), ("edit", "Ada", {"grade": "C"}), ("edit", "Ada", {"name": "Ada2"}),
            ("edit", "Ada2", {"grade": "C"}), ("alias", "Ada2", "Ada"),
            ("check", {"people": ["name", "grade", "clashing", "aliases"]}),
            ("sheet", "p"), ("person", "Ben", "A"), ("person", "Cam", "A"),
            ("check", {"people": ["name", "clashing"], "audit": True}),
            ("sheet", ""),
            ("check", {"people": ["name", "clashing"], "audit": True})]


def cp113(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "wes", "viewer"), ("alias", "Ada", "Addie"),
        ("import_people", ["Ben,B", " Cam ,C,3,cam@x"]), ("import_people", ["Dot,A", "ada,B"]),
        ("import_people", ["Dot,A", "addie,B"]), ("import_people", ["Dot,A", "Eve,B,x"]),
        ("import_people", ["Dot,A,,CAM@X"]), ("import_people", ["Dot,A", "dot,B"]), ("import_people", ["Dot,D"]),
        ("import_people", ["Dot,A,5,dot@x", "", "Eve,B"]),
        ("as", "wes"), ("import_people", ["Fay,A"]),
        ("as", "uma"), ("claim", "Dot", "10.00"), ("open", "Dot", 0),
        ("check", {"people": ["name", "grade", "terms", "contact", "due-total"], "rollups": True, "audit": True})]


def cp114(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00", "2026-02-05"), ("claim", "Ada", "40.00"),
        ("open", "Ada", 1), ("close", "P1"),
        ("delete", "Ada", 0), ("delete", "Ada", 1), ("delete", "Ada", 2), ("delete", "Ada", 3),
        ("claim_edit", "Ada", 0, {"amount": "11.00"}), ("open", "Ada", 0), ("void", "Ada", 0),
        ("check", {"claims": ["status", "amount", "log"], "people": ["claimed"], "counters": True, "summary": True, "rollups": True}),
        ("restore", "Ada", 0), ("restore", "Ada", 0), ("open", "Ada", 0),
        ("today", "2026-03-11"), ("restore", "Ada", 3),
        ("check", {"claims": ["status", "amount", "log"], "people": ["claimed", "due-total"], "counters": True, "summary": True,
                   "rollups": True, "audit": True})]


def cp115(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "100.00"),
        ("pool", "Top"), ("pool", "Mid"), ("pool", "Low"), ("pool", "Deep"),
        ("pool_member", "Top", "Ada", "70.00"), ("pool_member", "Top", "pool:Mid", "30.00"),
        ("pool_member", "Mid", "Ben", "50.00"), ("pool_member", "Mid", "pool:Low", "50.00"),
        ("pool_member", "Low", "Cam", "100.00"),
        ("pool_member", "Low", "pool:Top", "1.00"), ("pool_member", "Low", "pool:Deep", "1.00"),
        ("pool_member", "Deep", "pool:Mid", "1.00"), ("pool_member", "Top", "pool:Mid", "1.00"), ("pool_member", "Top", "pool:Top", "1.00"),
        ("check", {"pools": True}),
        ("hold", "Ben", "2026-03-01", None),
        ("check", {"pools": True}),
        ("pool_member", "Low", "Ada", "1.00"),
        ("check", {"pools": True, "audit": True})]


def cp116(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("alias", "Ben", "Benny"), ("claim", "Ada", "10.00", "2026-03-01"), ("open", "Ada", 0),
        ("import_people", ["ada,B,5,ada@x", "Cam,C", "benny,A"]),
        ("check", {"people": ["name", "grade", "terms", "contact"], "claims": ["due"], "rollups": True}),
        ("import_people", ["Ada,C", "Dot,A,x"]), ("import_people", ["Ada,C", "Dot,A,,ada@x"]),
        ("import_people", ["Ada,C,,", "Dot,A", "dot,B"]),
        ("import_people", ["Ada,C,,"]),
        ("check", {"people": ["name", "grade", "terms", "contact", "due-total"], "claims": ["due"], "rollups": True,
                   "audit": True})]


def cp117(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Cam", "30.00"),
        ("move", "Ada", "up"), ("move", "Cam", "down"), ("move", "Cam", "up"), ("move", "Ben", "down"),
        ("order",),
        ("bulk_open", [("Ada", 0), ("Ben", 0), ("Cam", 0)]), ("rate", "A", "20.00"),
        ("person", "Dot", "A"), ("order",),
        ("check", {"claims": ["number"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp118(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=()) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("import_rates", ["A,10.00", "A,20.00,2026-03-05", "B,5.00,2026-03-01,2026-03-09"]),
        ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rollups": True}),
        ("import_rates", ["A,30.00,2026-03-05", "D,1.00"]), ("import_rates", ["B,1.005"]), ("import_rates", ["B,1.00,2026-03-09,2026-03-08"]),
        ("import_rates", [""]), ("statement", "Ada"), ("import_rates", ["A,30.00,2026-03-05", "", "B,9.00,2026-03-10"]),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "rates": True, "rollups": True, "audit": True})]


def cp119(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "10.00"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "50.00"), ("pool_member", "P1", "Ben", "50.00"),
        ("pool", "P2"), ("pool_member", "P2", "Ada", "33.33"), ("pool_member", "P2", "Cam", "66.67"),
        ("pool", "P3"), ("pool_member", "P3", "Ada", "10.00"),
        ("check", {"people": ["cut-total"], "pools": True, "rollups": True}),
        ("hold", "Cam", "2026-03-01", None), ("setting", "pot", "1.01"),
        ("check", {"people": ["cut-total"], "pools": True, "rollups": True}),
        ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("rate", "A", "50.00"), ("setting", "cap", "4.00"),
        ("check", {"people": ["cut-total", "due-total", "excess"], "pools": True, "rollups": True, "audit": True})]


def cp120(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "10.00"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "50.00"), ("pool_member", "P1", "Ben", "30.00"), ("pool_member", "P1", "Cam", "20.00"),
        ("hold", "Ben", "2026-03-01", "2026-03-09"),
        ("check", {"pools": True, "people": ["cut-total", "hold"]}),
        ("hold", "Ben", "2026-03-10", "2026-03-12"),
        ("check", {"pools": True, "people": ["cut-total", "hold"]}),
        ("hold", "Ada", "2026-03-01", None),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("today", "2026-03-13"),
        ("check", {"pools": True, "people": ["cut-total"], "audit": True})]


def cp121(k):
    return [("as", "uma"), ("sheet", "t"), ("today", T), ("rate", "A", "20.00"),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("role", "vic", "steward"),
            ("person", "Ada", "A"), ("person", "Ben", "B"),
            ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("edit", "Ada", {"grade": "B"}),
            ("as", "vic"), ("transfer", "Ada", "t"),
            ("audit_view", "Ada"),
            ("sheet", "t"),
            ("check", {"people": ["name", "origin", "grade"], "claims": ["status", "due"]}),
            ("claim", "Ada", "5.00"), ("open", "Ada", 1),
            ("audit_view", "ada"), ("audit_view", ""),
            ("check", {"people": ["origin"], "audit": True})]


def cp122(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "9.00"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "50.00", "2026-03-01", "2026-03-10"),
        ("pool_member", "P1", "Ben", "50.00", "2026-03-11", None), ("pool_member", "P1", "Cam", "50.00", "2026-03-12", "2026-03-11"),
        ("pool_member", "P1", "Cam", "50.00", None, "2026-03-31"),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("today", "2026-03-11"),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("today", "2026-04-01"), ("hold", "Ben", "2026-04-01", None),
        ("check", {"pools": True, "people": ["cut-total"], "audit": True})]


def cp123(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "20.00", "2026-03-01"), ("claim", "Cam", "5.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0), ("statement", "Ben"),
        ("bulk_retire", ["Cam", "Ada"], "2026-03-05"),
        ("show_retired", True),
        ("check", {"people": ["retired", "retired-from", "due-total"], "rollups": True, "summary": True}),
        ("as", "wes"), ("bulk_retire", ["Ben"], "2026-03-01"),
        ("as", "uma"), ("bulk_retire", ["Ben", "Ada"], "2026-03-11"), ("today", "2026-03-11"),
        ("check", {"people": ["retired", "retired-from", "due-total"], "rollups": True, "audit": True})]


def cp124(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "10.00"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "50.00"), ("pool_member", "P1", "Ben", "30.00"), ("pool_member", "P1", "Cam", "20.00"),
        ("pool", "P2"), ("pool_member", "P2", "Cam", "100.00"),
        ("retire", "Cam", "2026-03-01"), ("show_retired", True),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("hold", "Ben", "2026-03-01", None),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("retire", "Ada", "2026-03-01"), ("retire", "Ben", "2026-03-01"),
        ("check", {"pools": True, "people": ["cut-total"], "audit": True})]


def cp125(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("open", "Ada", 0),
        ("unretire", "Ada"), ("retire", "Ada", "2026-03-05"), ("show_retired", True),
        ("today", "2026-03-12"),
        ("check", {"people": ["retired", "retired-from", "retirement", "due-total"], "rollups": True}),
        ("unretire", "Ada"), ("unretire", "Ada"),
        ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ada", "30.00", "2026-03-05"), ("claim", "Ada", "40.00", "2026-03-12"),
        ("claim", "Ada", "50.00"), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("check", {"people": ["retired", "retired-from", "retirement", "due-total"], "claims": ["status", "due"], "rollups": True,
                   "summary": True}),
        ("retire", "Ada", "2026-03-20"), ("today", "2026-03-21"), ("unretire", "Ada"),
        ("claim", "Ada", "1.00", "2026-03-21"), ("claim", "Ada", "2.00", "2026-03-20"),
        ("check", {"people": ["retired", "retirement", "due-total"], "claims": ["status"], "rollups": True, "audit": True})]


def cp126(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"), ("setting", "floor", "2.00"),
        ("person", "Cam", "C"), ("claim", "Cam", "10.00"), ("open", "Cam", 0),
        ("period", "P1", "2026-03-01", "2026-03-05"), ("alias", "Ben", "Benny"), ("patron", "Ada", "Ben"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "100.00"),
        ("claim", "Ada", "10.00", "2026-03-02"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00"),
        ("open", "Ben", 1), ("open", "Ada", 0), ("open", "Ben", 0), ("statement", "Ada"), ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ben", 1), ("close", "P1"), ("hold", "Ben", "2026-03-01", None),
        ("as", "uma"), ("clone", "c"), ("as", "vic"), ("clone", ""), ("clone", "c"), ("clone", "c"),
        ("check", {"rollups": True}),
        ("sheet", "c"),
        ("check", {"sheet": True, "header": True, "today": True, "people": ["name", "grade", "aliases", "patrons", "hold", "claimed",
                   "due-total", "statement-count", "stated-total"], "claims": ["number", "amount", "date", "status", "due", "stated"],
                   "periods": True, "pools": True, "rollups": True, "rates": True, "audit": True}),
        ("claim", "Ada", "1.00"), ("open", "Ada", 1), ("rate", "A", "30.00"),
        ("check", {"claims": ["number", "due"], "people": ["due-total"], "rollups": True}),
        ("sheet", ""), ("rate", "C", "10.00"),
        ("check", {"claims": ["number", "due"], "people": ["due-total"], "rollups": True, "audit": True}),
        ("sheet", "c"),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True})]


def cp127(k):
    return _base(k, people=(("Ada", "A"), ("uma", "B")), rates=AB) + [
        ("setting", "terms", "5"),
        ("claim", "uma", "10.00", "2026-03-01"), ("claim", "uma", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "uma", 0), ("open", "uma", 1), ("open", "Ada", 0),
        ("check", {"counters": True}),
        ("as", "vic"), ("check", {"counters": True}),
        ("as", "uma"), ("alias", "Ada", "VIC"), ("as", "vic"), ("check", {"counters": True}),
        ("as", "uma"), ("hold", "uma", "2026-03-01", None), ("setting", "cap", "1.50"),
        ("check", {"counters": True, "audit": True})]


def cp128(k):
    return [("as", "uma"), ("sheet", "t"), ("today", T), ("rate", "A", "20.00"), ("person", "Ada", "A"), ("alias", "Ada", "Addie"),
            ("claim", "Ada", "1.00"), ("open", "Ada", 0), ("statement", "Ada"),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("role", "vic", "steward"),
            ("person", "addie", "B"), ("person", "Ben", "B"), ("alias", "addie", "Ad"),
            ("claim", "addie", "10.00", "2026-03-01"), ("claim", "addie", "20.00"), ("open", "addie", 0), ("open", "addie", 1),
            ("statement", "addie"), ("rate", "B", "5.00"),
            ("as", "vic"), ("transfer", "addie", "t"), ("hidden", "addie"),
            ("check", {"people": ["name"], "rollups": True}),
            ("sheet", "t"),
            ("check", {"people": ["name", "aliases", "statement-count", "claimed", "due-total"],
                       "claims": ["number", "amount", "status", "due", "stated"], "rollups": True, "audit": True})]


def cp129(k):
    return _base(k, people=(("Ada", "A"), ("Lee, Jo", "B"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05", 'a "q"'), ("claim", "Ada", "20.00"), ("claim", "Lee, Jo", "30.00", "2026-03-20"),
        ("open", "Ada", 0), ("open", "Lee, Jo", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("retire", "Ada", "2026-03-06"), ("hold", "Lee, Jo", "2026-03-01", None),
        ("export_claims",), ("export",)]


def cp130(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P2", "2026-03-11", "2026-03-20"), ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P3", "2026-03-21", "2026-03-31"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "30.00", "2026-03-15"), ("claim", "Ada", "5.00", "2026-03-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"summary": True, "periods": True}),
        ("close", "P1"), ("rate", "A", "20.00"), ("void", "Ada", 2),
        ("check", {"summary": True, "periods": True, "audit": True})]


def cp131(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("period", "P1", "2026-02-20", "2026-02-25"), ("close", "P1"),
        ("plan", "Ada", "10.00", "2026-02-18", "7", "2026-03-20"), ("plan", "Ben", "5.00", "2026-03-01", "0", "2026-03-10"),
        ("plan", "Ben", "5.00", "2026-03-11", "3", "2026-03-10"), ("plan", "Ben", "1.005", "2026-03-01", "3", "2026-03-10"),
        ("plan", "Ben", "5.00", "2026-03-01", "4", "2026-03-10"),
        ("generate",), ("generate",),
        ("check", {"plans": True, "claims": ["amount", "date", "status"], "people": ["claimed"]}),
        ("retire", "Ben", "2026-03-08"), ("show_retired", True), ("today", "2026-03-31"), ("generate",),
        ("bulk_open", [("Ada", 0), ("Ada", 3)]),
        ("check", {"plans": True, "claims": ["amount", "date", "status", "due"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp132(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("rate", "A", "10.00"), ("person", "Pam", "A"),
            ("claim", "Pam", "1.00"), ("claim", "Pam", "2.00"), ("open", "Pam", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("person", "Ada", "A"),
            ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0),
            ("setting", "parent", "__SHEET__-p"), ("open", "Ada", 1),
            ("sheet", "p"), ("open", "Pam", 1),
            ("sheet", "c"), ("today", T), ("setting", "parent", "__SHEET__"), ("rate", "A", "10.00"), ("person", "Cy", "A"),
            ("claim", "Cy", "3.00"), ("open", "Cy", 0),
            ("setting", "period-numbering-from", "2026-03-01"), ("period", "P1", "2026-03-01", "2026-03-31"),
            ("claim", "Cy", "4.00"), ("open", "Cy", 1),
            ("check", {"claims": ["number", "status"], "audit": True}),
            ("sheet", ""), ("open", "Ada", 2),
            ("check", {"claims": ["number", "status"], "audit": True}),
            ("sheet", "p"),
            ("check", {"claims": ["number", "status"], "audit": True})]


def cp133(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("person", "Ben", "B", None, None, {"tags": " X, y ,x"}),
        ("claim", "Ada", "10.00", None, "", None, {"tags": "y"}), ("claim", "Ben", "20.00", None, "", None, {"tags": "y, z"}),
        ("claim", "Ben", "40.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"people": ["tags"], "claims": ["tags"], "tags": True}),
        ("edit", "Ada", {"tags": "z"}), ("edit", "Ben", {"tags": ""}), ("rate", "B", "10.00"),
        ("check", {"people": ["tags"], "claims": ["tags", "due"], "tags": True, "audit": True})]


def cp134(k):
    return _base(k, people=(("Cam", "C"), ("ada", "A"), ("Ben", "B"), ("Dot", "A")), rates=AB) + [
        ("claim", "Ben", "10.00"), ("claim", "ada", "30.00"), ("claim", "Dot", "30.00"),
        ("open", "Ben", 0), ("open", "ada", 0), ("open", "Dot", 0),
        ("order",), ("sort", "name"), ("order",), ("sort", "grade"), ("order",), ("sort", "due-total"), ("order",),
        ("hold", "Dot", "2026-03-01", None), ("order",), ("setting", "cap", "1.50"), ("order",), ("setting", "cap", ""),
        ("as", "vic"), ("order",), ("as", "uma"), ("order",),
        ("bulk_open", [("ada", 0)]), ("sort", "added"), ("order",), ("rate", "A", "20.00"), ("edit", "Cam", {"grade": "A"}),
        ("sort", "grade"), ("order",),
        ("check", {"people": ["due-total"], "rollups": True, "audit": True})]


def cp135(k):
    return _base(k, people=(("Ada", "A"), ("Lee, Jo", "B"))) + [
        ("setting", "pot", "10.00"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "33.33"), ("pool_member", "P1", "Lee, Jo", "66.67"),
        ("pool", "Q"), ("pool_member", "Q", "pool:P1", "100.00"),
        ("export_pools",),
        ("retire", "Ada", "2026-03-01"),
        ("export_pools",)]


def cp136(k):
    return [("as", "uma"), ("sheet", "t"), ("today", T), ("rate", "A", "20.00"), ("person", "Ada", "A"),
            ("claim", "Ada", "1.00"), ("open", "Ada", 0), ("statement", "Ada"),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("rate", "B", "20.00"), ("role", "vic", "steward"),
            ("person", "Ben", "B"), ("person", "Cam", "C"), ("person", "ada", "A"),
            ("claim", "Ben", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Cam", "30.00"), ("claim", "ada", "5.00"),
            ("open", "Ben", 0), ("open", "Ben", 1), ("open", "Cam", 0), ("open", "ada", 0),
            ("statement", "Ben"), ("statement", "ada"), ("rate", "B", "10.00"), ("rate", "A", "40.00"),
            ("as", "vic"), ("merge", "Ben", "Cam"),
            ("check", {"people": ["name", "statement-count", "stated-total", "due-total"], "claims": ["due", "stated"], "rollups": True}),
            ("transfer", "ada", "t"), ("hidden", "ada"),
            ("sheet", "t"),
            ("check", {"people": ["name", "statement-count", "stated-total", "due-total"], "claims": ["due", "stated"], "rollups": True,
                       "audit": True})]


def cp137(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "3.00", "2026-02-05"),
        ("open", "Ada", 1), ("close", "P1"),
        ("line", "Ada", 0, "widget", "3", "2.50"), ("line", "Ada", 0, "", "1", "1.00"), ("line", "Ada", 0, "bolt", "0", "1.00"),
        ("line", "Ada", 0, "bolt", "2", "0.005"), ("line", "Ada", 0, "bolt", "2", "0.01"),
        ("line", "Ada", 1, "x", "1", "1.00"), ("line", "Ada", 2, "x", "1", "1.00"),
        ("claim_edit", "Ada", 0, {"amount": "9.00"}), ("claim_edit", "Ada", 0, {"note": "lined"}), ("inline", "Ada", 0, "8.00"),
        ("as", "vic"), ("claim_edit_open", "Ada", 0), ("as", "uma"), ("line", "Ada", 0, "nut", "1", "1.00"),
        ("as", "vic"), ("claim_edit_cancel", "Ada", 0), ("as", "uma"), ("open", "Ada", 0),
        ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["amount", "lines", "note", "status", "due"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp138(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"),
        ("inline_grade", "Ada", "B"), ("inline_grade", "Ben", "D"),
        ("as", "wes"), ("inline_grade", "Ben", "A"),
        ("as", "uma"), ("edit_open", "Ben"), ("as", "vic"), ("inline_grade", "Ben", "A"), ("as", "uma"), ("edit_save", {"grade": "C"}),
        ("check", {"people": ["grade", "due-total"], "claims": ["due", "stated"], "rollups": True, "summary": True, "audit": True})]


def cp139(k):
    return [("as", "uma"), ("sheet", "c"), ("today", T), ("rate", "A", "10.00"), ("person", "Cy", "A"), ("claim", "Cy", "1.00"), ("open", "Cy", 0),
            ("sheet", "cc"), ("today", T), ("person", "Cy", "B"), ("setting", "parent", "__SHEET__-c"),
            ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("person", "Cy", "C"), ("person", "Ada", "A"), ("claim", "Cy", "2.00"),
            ("sheet", "c"), ("setting", "parent", "__SHEET__"),
            ("sheet", ""),
            ("audit_view", "Cy"), ("audit_view", "ada"), ("audit_view", ""),
            ("sheet", "c"), ("audit_view", "cy"),
            ("check", {"audit": True})]


def cp140(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("setting", "pot", "10.01"),
        ("pool", "P1"), ("pool_member", "P1", "Ada", "33.33"), ("pool_member", "P1", "Ben", "33.33"), ("pool_member", "P1", "Cam", "33.34"),
        ("pool", "P2"), ("pool_member", "P2", "Ada", "99.99"), ("pool_member", "P2", "Ben", "0.01"),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("setting", "pot", "0.02"),
        ("check", {"pools": True, "people": ["cut-total"]}),
        ("hold", "Cam", "2026-03-01", None), ("setting", "pot", "10.01"),
        ("check", {"pools": True, "people": ["cut-total"], "audit": True})]


def cp141(k):
    return _base(k, today="2026-01-15", people=(("Ada", "A"),), rates=A1) + [
        ("plan", "Ada", "10.00", "2026-01-31", "m31", "2026-06-30"), ("plan", "Ada", "5.00", "2026-02-10", "m1", "2026-04-02"),
        ("plan", "Ada", "5.00", "2026-02-10", "m32", "2026-04-02"), ("plan", "Ada", "5.00", "2026-02-10", "m0", "2026-04-02"),
        ("generate",), ("today", "2026-02-28"), ("generate",), ("today", "2026-03-31"), ("generate",),
        ("check", {"plans": True, "claims": ["amount", "date"], "people": ["claimed"]}),
        ("today", "2026-05-02"), ("generate",),
        ("check", {"plans": True, "claims": ["amount", "date"], "people": ["claimed"], "audit": True})]


def cp142(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("plan", "Ada", "10.00", "2026-02-20", "7", "2026-04-15"), ("plan", "Ada", "1.00", "2026-03-31", "m31", "2026-12-31"),
        ("plan", "Ada", "1.00", "2026-03-01", "10", "2026-03-05"),
        ("check", {"plans": True}),
        ("generate",), ("today", "2026-03-20"),
        ("check", {"plans": True}),
        ("today", "2026-04-20"), ("generate",),
        ("check", {"plans": True, "claims": ["date"], "audit": True})]


def cp143(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2025-12-20", "2026-01-05"), ("period", "P2", "2026-04-01", "2026-04-30"),
        ("check", {"periods": True}),
        ("setting", "fiscal-start-month", "4"), ("setting", "fiscal-start-month", "13"), ("setting", "fiscal-start-month", "x"),
        ("check", {"periods": True}),
        ("generate_fy", "2026"), ("generate_fy", "x"), ("generate_fy", "2026"),
        ("claim", "Ada", "10.00", "2026-05-05"), ("open", "Ada", 0),
        ("check", {"periods": True, "claims": ["period"], "summary": True, "audit": True})]


def cp144(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("rate", "A", "10.00"), ("person", "Pam", "A"),
            ("claim", "Pam", "1.00", "2025-12-30"), ("open", "Pam", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("setting", "parent", "__SHEET__-p"), ("setting", "fiscal-start-month", "3"),
            ("setting", "terms", "5"), ("person", "Ada", "A"),
            ("claim", "Ada", "10.00", "2026-02-20"), ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "30.00"), ("claim", "Ada", "40.00", "2026-02-24"),
            ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
            ("sheet", "p"), ("claim", "Pam", "2.00"), ("open", "Pam", 1),
            ("sheet", ""),
            ("check", {"claims": ["number", "period", "due-by"], "audit": True}),
            ("setting", "period-numbering-from", "2026-03-01"), ("period", "P1", "2026-02-01", "2026-02-28"), ("open", "Ada", 3),
            ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("claim", "Ada", "-1.00", None, "", ("number", "Ada", 0)), ("open", "Ada", 4),
            ("setting", "period-numbering-from", ""), ("claim", "Ada", "50.00"), ("open", "Ada", 5),
            ("check", {"claims": ["number", "period", "status"], "audit": True}),
            ("sheet", "p"),
            ("check", {"claims": ["number"], "audit": True})]


def cp145(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "period-numbering-from", "2026-03-01"), ("setting", "terms", "5"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"), ("period", "P3", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ben", "30.00", "2026-03-07"),
        ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("close", "P3"), ("retire", "Ben", "2026-03-12"), ("show_retired", True),
        ("bulk_redate", [("Ada", 0), ("Ben", 0)], "2026-03-15"),
        ("as", "vic"), ("show_retired", True), ("bulk_redate", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Ben", 1)], "2026-03-15"),
        ("bulk_redate", [("Ada", 1)], "2026-02-05"),
        ("check", {"claims": ["date", "number", "period", "due-by", "status"], "periods": True, "audit": True})]


def cp146(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "alert-threshold", "x"), ("setting", "alert-threshold", "2.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "20.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"people": ["due-total"], "rollups": True}),
        ("rate", "A", "5.00"), ("rate", "A", "20.00"), ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"), ("hold", "Ada", "2026-03-01", None), ("setting", "cap", "2.00"),
        ("setting", "cap", ""), ("setting", "alert-threshold", ""), ("rate", "B", "30.00"),
        ("check", {"people": ["due-total"], "rollups": True, "audit": True})]


def cp147(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("today", "2026-03-11"), ("rate", "A", "20.00"), ("today", "2026-03-12"), ("person", "Cam", "C"), ("hold", "Ada", "2026-03-01", None),
        ("today", "2026-03-13"),
        ("check", {"people": ["snapshot", "due-total"], "rollups": True, "audit": True})]


def cp148(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "50.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("claim", "Ada", "-20.00", None, "fix", ("number", "Ada", 0)), ("open", "Ada", 1),
        ("check", {"claims": ["amount", "corrects", "due"], "people": ["claimed", "due-total"], "rollups": True, "counters": True}),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("hold", "Ada", "2026-03-01", None),
        ("check", {"claims": ["amount", "corrects", "due", "status"], "people": ["claimed", "due-total"], "rollups": True, "audit": True})]


def cp149(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "5"),
        ("period", "P1", "2026-03-01", "2026-03-10", "2"), ("period", "P2", "2026-03-11", "2026-03-20", "0"), ("period", "P2", "2026-03-11", "2026-03-20", ""),
        ("claim", "Ada", "10.00", "2026-03-02"), ("claim", "Ada", "20.00", "2026-03-03"), ("claim", "Ada", "30.00", "2026-03-04"),
        ("claim", "Ben", "5.00", "2026-03-04"), ("claim", "Ada", "40.00", "2026-03-15"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0), ("open", "Ada", 3),
        ("bulk_open", [("Ada", 2)]),
        ("as", "vic"), ("settle", "Ada", 0), ("open", "Ada", 2),
        ("check", {"claims": ["status", "period", "number"], "periods": True, "audit": True})]


def cp150(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("rate", "A", "10.00"), ("person", "Pam", "A"), ("person", "Bea", "B"),
            ("claim", "Pam", "1.00"), ("open", "Pam", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("setting", "parent", "__SHEET__-p"),
            ("person", "Ada", "A"), ("person", "Ben", "B"), ("alias", "Ben", "Pal"), ("claim", "Ada", "10.00"), ("open", "Ada", 0),
            ("sheet", "c"), ("today", T), ("setting", "parent", "__SHEET__"), ("person", "Cal", "A"),
            ("sheet", ""),
            ("search", "a"), ("search", "PA"), ("search", "zz"), ("search", ""),
            ("retire", "Ada", "2026-03-01"), ("show_retired", True), ("hold", "Ben", "2026-03-01", None),
            ("search", "a"),
            ("check", {"audit": True})]



# ---- Act IV (cp151-200): rule versioning and legacy semantics -----------------------------------

DUE = {"claims": ["due", "status", "stated"], "people": ["due-total"], "rollups": True}


def cp151(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("setting", "policy-date", "2026-03-05"),
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25", "2026-03-06"), ("claim", "Ada", "10.35", "2026-03-08"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", DUE),
        ("setting", "rounding", "half-even", "2026-03-01"), ("setting", "rounding", "x"), ("setting", "rounding", "half-up", "2026-03-07"),
        ("check", DUE),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("statement", "Ada"), ("setting", "rounding", "", "2026-03-01"),
        ("check", dict(DUE, audit=True))]


def cp152(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "note-threshold", "1.50"), ("period", "P1", "2026-02-01", "2026-02-10"), ("close", "P1"),
        ("claim", "Ada", "10.00", "2026-03-01", "draft"), ("claim", "Ada", "20.00"), ("open", "Ada", 1),
        ("paste", ["Ada,30.00,2026-03-01,draft", "Ben,5.00,,n"]),
        ("check", {"claims": ["amount", "number", "status", "note"], "people": ["claimed", "due-total"], "rollups": True}),
        ("paste", ["Ada,30.00,,", "Ben,6.00,,n"]), ("paste", ["Ben,1.00,2026-02-05,n"]), ("paste", ["Ada,40.00,,draft"]),
        ("paste", ["Ada,1.00,,x", "Ada,2.00,2026-03-01,draft"]),
        ("as", "wes"), ("paste", ["Ben,7.00,,n"]),
        ("check", {"claims": ["amount", "number", "status", "note"], "people": ["claimed", "due-total"], "rollups": True, "audit": True})]


def cp153(k):
    return _base(k, people=(("Ada", "A"),), rates=()) + [
        ("role", "wes", "viewer"), ("role", "vic", "steward"),
        ("rate", "A", "10.00"), ("rate", "A", "20.00", "2026-03-05"), ("rate", "A", "30.00", "2026-03-05"), ("rate", "A", "12.00"),
        ("as", "wes"), ("rate", "A", "70.00", "2026-03-05"), ("as", "vic"), ("delegate", "wes", "2026-03-10", "2026-03-12"),
        ("as", "wes"), ("rate", "A", "25.00"), ("as", "uma"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rate_rows": True, "rollups": True}),
        ("import_rates", ["A,40.00,2026-03-05", "B,1.00"]), ("statement", "Ada"), ("rate", "A", "50.00", "2026-03-05"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "rates": True, "rate_rows": True, "rollups": True, "audit": True})]


def cp154(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=(("A", "10.00"), ("B", "20.00"), ("C", "30.00"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ben", "20.00", "2026-03-06"), ("claim", "Cam", "30.00", "2026-03-07"),
        ("claim", "Ada", "40.00", "2026-03-15"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("check", {"summary": True, "rollups": True}),
        ("today", "2026-03-21"), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ben", 0), ("void", "Cam", 0),
        ("check", {"summary": True, "rollups": True}),
        ("as", "uma"), ("close", "P1"), ("rate", "A", "20.00"), ("hold", "Ada", "2026-03-15", None),
        ("check", {"summary": True, "rollups": True, "audit": True})]


def cp155(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "review-threshold", "1.50"), ("setting", "review-threshold", "3.00", "2026-03-05"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00"), ("claim", "Ben", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ben", 0),
        ("check", {"claims": ["status", "number", "due", "opened-by"], "people": ["due-total"], "rollups": True, "counters": True, "summary": True}),
        ("settle", "Ada", 2), ("claim_edit", "Ada", 2, {"amount": "1.00"}), ("review", "Ada", 2),
        ("as", "vic"), ("review", "Ada", 2), ("settle", "Ada", 2), ("review", "Ben", 0),
        ("as", "wes"), ("settle", "Ada", 2),
        ("as", "uma"), ("void", "Ada", 1), ("statement", "Ada"),
        ("check", {"claims": ["status", "number", "due", "opened-by", "stated"], "people": ["due-total"], "rollups": True, "counters": True,
                   "summary": True, "audit": True})]


def cp156(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-10"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("today", "2026-03-10"), ("rate", "A", "20.00", "2026-03-10"), ("rate", "A", "30.00", "2026-02-01"),
        ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rollups": True}),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("open", "Ada", 2), ("open", "Ada", 3),
        ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rollups": True}),
        ("today", "2026-03-12"), ("rate", "A", "40.00", "2026-03-11"), ("rate_preview", "A", "50.00"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 4), ("statement", "Ada"), ("rate", "A", "50.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "rates": True, "rollups": True, "audit": True})]


def cp157(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "12345.67"))) + [
        ("claim", "Ada", "10.25"), ("claim", "Ben", "9999.99"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("statement", "Ben"),
        ("locale", "de"),
        ("check", {"claims": ["amount", "due", "stated"], "people": ["claimed", "due-total", "stated-total"], "rollups": True,
                   "rates": True, "counters": True, "summary": True}),
        ("as", "vic"),
        ("check", {"claims": ["amount", "due"], "people": ["due-total"], "rollups": True}),
        ("as", "uma"), ("locale", "en"), ("export",),
        ("check", {"claims": ["amount", "due"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp158(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("statement", "Ada"), ("hold", "Ben", "2026-03-01", None), ("rate", "A", "20.00"), ("setting", "cap", "3.00"),
        ("columns", ["claimed", "due-total", "hold", "excess"]),
        ("check", {"people": ["claimed", "due-total", "hold", "excess", "statement-count", "overdue-total"], "rollups": True, "counters": True}),
        ("as", "vic"),
        ("check", {"people": ["claimed", "due-total", "hold", "excess"], "rollups": True}),
        ("as", "uma"), ("columns", []), ("rate", "A", "30.00"),
        ("check", {"people": ["claimed", "due-total", "hold"], "rollups": True, "audit": True})]


def cp159(k):
    return _base(k, today="2026-03-05", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "2"), ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"), ("period", "P3", "2026-03-21", "2026-03-31"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ben", "30.00", "2026-03-15"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("today", "2026-03-25"), ("claim", "Ada", "40.00", "2026-03-25"), ("open", "Ada", 2),
        ("check", {"person_periods": True, "periods": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("hold", "Ben", "2026-03-01", None), ("rate", "A", "20.00"),
        ("check", {"person_periods": True, "periods": True}),
        ("today", "2026-04-02"), ("as", "vic"), ("settle", "Ada", 1),
        ("check", {"person_periods": True, "periods": True, "claims": ["status", "period"], "audit": True})]


def cp160(k):
    return [("as", "uma"), ("sheet", "c"), ("today", "2026-03-01"), ("rate", "A", "10.00"), ("person", "Cy", "A"),
            ("claim", "Cy", "10.00"), ("open", "Cy", 0),
            ("sheet", ""), ("today", "2026-03-01"), ("rate", "A", "20.00"), ("role", "vic", "steward"), ("person", "Ada", "A"),
            ("setting", "terms", "2"), ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
            ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("open", "Ada", 0), ("open", "Ada", 1),
            ("sheet", "c"), ("setting", "parent", "__SHEET__"), ("today", "2026-03-05"), ("rate", "A", "30.00"), ("claim", "Cy", "20.00"), ("open", "Cy", 1),
            ("sheet", ""), ("today", "2026-03-25"), ("claim", "Ada", "5.00", "2026-03-15"), ("open", "Ada", 2),
            ("close", "P2"), ("rate", "A", "40.00"), ("as", "vic"), ("settle", "Ada", 0),
            ("check", {"person_periods": True, "periods": True, "sheet": True, "rollups": True}),
            ("asof", "2026-03-01"),
            ("check", {"sheet": True, "rollups": True}),
            ("asof", "2026-03-05"),
            ("check", {"sheet": True, "rollups": True}),
            ("asof_clear",), ("soft_close", "P1"), ("reopen", "P2"),
            ("check", {"person_periods": True, "periods": True, "sheet": True, "audit": True})]


def cp161(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("pool", "P1"), ("pool_member", "P1", "Ada", "100.00"), ("setting", "pot", "10.00"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("today", "2026-03-05"), ("rate", "A", "20.00"), ("claim", "Ben", "5.00"), ("open", "Ben", 0), ("setting", "pot", "20.00"),
        ("retire", "Ben", "2026-03-05"),
        ("export",), ("export_claims",), ("export_pools",),
        ("asof", "2026-03-01"),
        ("export",), ("export_claims",), ("export_pools",),
        ("asof_clear",), ("export",)]


def cp162(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"),
        ("timeline", "Ada", 0), ("open", "Ada", 0), ("claim_edit", "Ada", 1, {"note": "n"}), ("timeline", "Ada", 1),
        ("as", "vic"), ("settle", "Ada", 0), ("remind", "Ada", 0), ("as", "uma"), ("statement", "Ada"),
        ("timeline", "Ada", 0), ("timeline", "Ada", 2),
        ("check", {"claims": ["status"], "audit": True})]


def cp163(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("statement", "Ada"), ("rate", "A", "20.00"), ("today", "2026-03-11"), ("statement", "Ada"),
        ("claim", "Ada", "5.00"), ("open", "Ada", 1), ("today", "2026-03-12"), ("statement", "Ada", "2026-03-11"),
        ("check", {"people": ["statement-line", "statement-count", "stated-total", "statement-date"], "claims": ["stated", "due"]}),
        ("as", "vic"), ("unstate", "Ada"),
        ("check", {"people": ["statement-line", "statement-count", "stated-total", "statement-date"], "claims": ["stated", "due"],
                   "audit": True})]


def cp164(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "50.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"),
        ("claim", "Ada", "-30.00", None, "", ("number", "Ada", 0)), ("open", "Ada", 1),
        ("claim", "Ada", "-20.01", None, "", ("number", "Ada", 0)), ("claim", "Ada", "-20.00", None, "", ("number", "Ada", 0)),
        ("claim", "Ada", "-0.01", None, "", ("number", "Ada", 0)),
        ("void", "Ada", 2), ("claim", "Ada", "-20.00", None, "", ("number", "Ada", 0)), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 1), ("settle", "Ada", 3),
        ("check", {"claims": ["amount", "corrects", "status", "due"], "people": ["claimed", "due-total"], "rollups": True, "audit": True})]


def cp165(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("setting", "escalate-after", "2"),
        ("remind", "Ada", 0), ("remind", "Ada", 0), ("today", "2026-03-11"), ("remind", "Ada", 0), ("remind", "Ada", 0),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("settle", "Ada", 1), ("remind", "Ada", 1),
        ("today", "2026-03-13"), ("remind", "Ada", 0), ("remind", "Ada", 1), ("today", "2026-03-20"), ("remind", "Ada", 0),
        ("check", {"claims": ["reminded", "status"], "audit": True})]


def cp166(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Cam", "30.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("crew", "Red", "Ada"), ("crew", "Red", "Ben"), ("crew", " ", "Ben"), ("crew", "Sky", "Cam"),
        ("crew_member", "Red", "Ben"), ("crew_member", "Red", "Ada"), ("crew_member", "Red", "Ben"), ("crew_member", "Sky", "Ada"),
        ("check", {"crews": True, "pools": True, "people": ["due-total"]}),
        ("rate", "C", "10.00"), ("hold", "Ben", "2026-03-01", None), ("setting", "cap", "1.50"),
        ("check", {"crews": True, "pools": True, "people": ["due-total"], "audit": True})]


def cp167(k):
    return _base(k, people=(("vic", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("claim", "vic", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Cam", "30.00"), ("open", "vic", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("crew", "Red", "vic"), ("crew_member", "Red", "Ben"), ("crew", "Blue", "Ben"), ("crew_member", "Blue", "vic"),
        ("check", {"counters": True, "crews": True}),
        ("as", "vic"), ("check", {"counters": True, "crews": True}),
        ("as", "uma"), ("alias", "Cam", "Uma"), ("crew", "Green", "Cam"), ("rate", "C", "10.00"),
        ("check", {"counters": True, "crews": True}),
        ("as", "vic"), ("settle", "Ben", 0),
        ("check", {"counters": True, "crews": True, "audit": True})]


def cp168(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("setting", "pot", "10.00"),
        ("crew", "Red", "Ada"), ("crew_member", "Red", "Ben"), ("crew_member", "Red", "Cam"),
        ("pool", "Red"), ("pool", "P1"), ("pool_member", "P1", "Ada", "100.00"), ("crew", "P1", "Ben"),
        ("check", {"crews": True, "pools": True, "people": ["cut-total"], "rollups": True}),
        ("hold", "Ben", "2026-03-01", None), ("retire", "Cam", "2026-03-01"), ("show_retired", True),
        ("check", {"crews": True, "pools": True, "people": ["cut-total"], "rollups": True}),
        ("export_pools",),
        ("check", {"audit": True})]


def cp169(k):
    return _base(k, today="2026-03-20", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "10"),
        ("edit", "Ada", {"terms": "3", "terms_from": "2026-03-05"}), ("edit", "Ada", {"terms": "5"}),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"), ("claim", "Ada", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"people": ["terms", "overdue-count"], "claims": ["due-by", "overdue"], "rollups": True}),
        ("person", "Ben", "B", None, "2"), ("claim", "Ben", "10.00", "2026-03-01"), ("open", "Ben", 0),
        ("edit", "Ben", {"terms": "", "terms_from": "2026-03-10"}), ("claim", "Ben", "10.00", "2026-03-12"), ("open", "Ben", 1),
        ("check", {"people": ["terms", "overdue-count"], "claims": ["due-by", "overdue"], "rollups": True, "audit": True})]


def cp170(k):
    return _base(k, people=(("Ada", "A"),), rates=()) + [
        ("rate", "A", "10.00", "2026-02-15"), ("rate", "A", "20.00", "2026-05-01", "2026-07-31"), ("rate", "B", "5.00"),
        ("check", {"calendar": True, "rates": True}),
        ("import_rates", ["A,30.00,2026-12-01", "C,1.00,2026-01-01"]), ("today", "2027-01-10"),
        ("check", {"calendar": True, "rates": True, "audit": True})]


def cp171(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "review-threshold", "1.50"), ("setting", "review-sla", "2"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 2),
        ("today", "2026-03-12"), ("open", "Ada", 1),
        ("check", {"claims": ["status", "review-late"], "summary": True}),
        ("today", "2026-03-13"),
        ("check", {"claims": ["status", "review-late"], "summary": True}),
        ("as", "vic"), ("review", "Ada", 0), ("as", "uma"), ("setting", "review-sla", ""),
        ("check", {"claims": ["status", "review-late", "number"], "summary": True, "audit": True})]


def cp172(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("statement", "Ada"), ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "wes"), ("settle", "Ada", 0),
        ("check", DUE),
        ("as", "vic"), ("reject", "Ada", 0, "no"), ("as", "uma"), ("statement", "Ada"), ("as", "wes"), ("settle", "Ada", 1),
        ("as", "uma"), ("rate", "A", "30.00"),
        ("check", dict(DUE, audit=True))]


def cp173(k):
    return _base(k, today="2026-03-25", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("alias", "Ben", "Benny"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("open", "Ada", 0),
        ("import_openings", ["Ada,P2,5.00", "benny,P1,2.50"]), ("import_openings", ["Ada,P2,1.005"]), ("import_openings", ["Ada,P3,1.00"]),
        ("import_openings", ["Zed,P1,1.00"]), ("import_openings", ["Ada,P2,-1.00"]), ("import_openings", ["Ada,P2,0.50", ""]),
        ("check", {"person_periods": True, "periods": True}),
        ("close", "P2"), ("import_openings", ["Ada,P2,9.00"]), ("import_openings", ["Ada,P1,4.00"]),
        ("check", {"person_periods": True, "periods": True, "audit": True})]


def cp174(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "floor", "3.00"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("waive", "Ada", 0), ("as", "vic"), ("waive", "Ada", 0), ("waive", "Ada", 0), ("waive", "Ada", 2),
        ("as", "uma"), ("statement", "Ada"), ("today", "2026-05-10"),
        ("check", {"claims": ["due", "overdue", "waived", "stated"], "people": ["due-total", "overdue-total"], "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 1), ("waive", "Ada", 1),
        ("check", {"claims": ["due", "overdue", "waived", "status"], "people": ["due-total", "overdue-total"], "rollups": True,
                   "audit": True})]


def cp175(k):
    return [("as", "uma"), ("sheet", "t"), ("today", T), ("rate", "A", "20.00"), ("role", "vic", "steward"), ("role", "wes", "steward"),
            ("sheet", ""), ("today", T), ("rate", "A", "10.00"), ("role", "vic", "steward"), ("person", "Ada", "A"), ("person", "Ben", "B"),
            ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("statement", "Ada"),
            ("as", "vic"), ("transfer", "Ada", "t"), ("transfer", "Ben", "t"),
            ("sheet", "t"), ("transfer_undo", "Ada"), ("as", "uma"), ("sheet", "t"), ("transfer_undo", "Ben"),
            ("as", "wes"), ("sheet", "t"), ("today", "2026-03-11"), ("transfer_undo", "Ben"),
            ("check", {"people": ["name", "origin", "statement-count"], "claims": ["number", "status"], "rollups": True, "audit": True}),
            ("sheet", ""),
            ("check", {"people": ["name", "origin", "statement-count"], "claims": ["number", "status", "stated"], "rollups": True,
                       "audit": True})]


def cp176(k):
    return _base(k, today="2026-01-05", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "floor", "3.00"),
        ("claim", "Ada", "200.00"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("today", "2026-03-12"),
        ("check", DUE),
        ("statement", "Ada"), ("today", "2026-04-12"), ("rate", "A", "20.00"),
        ("check", DUE),
        ("statement", "Ada"), ("today", "2026-05-15"),
        ("check", DUE),
        ("as", "vic"), ("unstate", "Ada"),
        ("check", DUE),
        ("unstate", "Ada"), ("settle", "Ada", 0),
        ("check", dict(DUE, audit=True))]


def cp177(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "proof-threshold", "1.50"), ("setting", "proof-kinds", "receipt,photo"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("proof", "Ada", 0, "receipt"), ("proof", "Ada", 0, "x"), ("proof", "Ada", 1),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("proof", "Ada", 0, "photo"), ("settle", "Ada", 0),
        ("as", "uma"), ("setting", "proof-kinds", "photo"), ("as", "vic"), ("settle", "Ada", 1), ("proof", "Ada", 1, "photo"), ("settle", "Ada", 1),
        ("check", {"claims": ["status", "proofs", "proofs-receipt", "proofs-photo", "due"], "rollups": True, "audit": True})]


def cp178(k):
    return _base(k, today="2026-03-20", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "review-threshold", "3.00"), ("setting", "terms", "5"),
        ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "40.00"), ("claim", "Ben", "10.00", "2026-03-01"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("as", "wes"), ("settle", "Ada", 0),
        ("check", {"dash": True}),
        ("as", "vic"), ("check", {"dash": True}),
        ("hold", "Ben", "2026-03-01", None), ("review", "Ada", 1),
        ("check", {"dash": True, "audit": True})]


def cp179(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ben", "5.00"),
        ("flag", "Ada", "late", "2026-03-12"), ("as", "vic"), ("flag", "Ada", "", "2026-03-12"), ("flag", "Ada", "late", "2026-03-12"),
        ("as", "uma"), ("open", "Ada", 0), ("bulk_open", [("Ada", 1), ("Ben", 0)]), ("paste", ["Ada,1.00,,"]),
        ("as", "vic"), ("open", "Ada", 0),
        ("check", {"people": ["flag-shown"], "claims": ["status"]}),
        ("as", "uma"), ("today", "2026-03-13"), ("open", "Ada", 1),
        ("check", {"people": ["flag-shown"], "claims": ["status"], "audit": True})]


def cp180(k):
    return _base(k, today="2026-03-10", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "5"), ("setting", "terms", "2", "2026-03-10"), ("setting", "terms-B", "7", "2026-03-01"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00", "2026-02-20"),
        ("edit", "Ben", {"terms": "1", "terms_from": "2026-03-10"}), ("claim", "Ben", "10.00", "2026-03-01"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count"]}),
        ("today", "2026-03-20"), ("setting", "terms", "20", "2026-03-15"), ("claim", "Ada", "10.00", "2026-03-01"), ("open", "Ada", 2),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count"], "rollups": True, "audit": True})]


def cp181(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "wes", "viewer"), ("role", "vic", "steward"),
        ("note", "first"), ("note", " "), ("as", "vic"), ("today", "2026-03-11"), ("note", "second"),
        ("delegate", "uma", "2026-03-11", "2026-03-12"), ("as", "uma"), ("note", "third"),
        ("as", "wes"), ("note", "nope"),
        ("as", "vic"), ("archive",), ("note", "late"),
        ("as", "uma"), ("check", {"notes": True, "audit": True})]


def cp182(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "5"), ("period", "P1", "2026-03-01", "2026-03-10"), ("patron", "Ben", "Ada"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"), ("rate", "A", "20.00"),
        ("claim_hold", "Ada", 0), ("claim_hold", "Ada", 2), ("claim_hold", "Ada", 1),
        ("check", {"claims": ["held", "due", "stated"], "people": ["claimed", "due-total", "backing"], "rollups": True, "periods": True,
                   "person_periods": True}),
        ("today", "2026-03-20"), ("claim_hold", "Ada", 1), ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["held", "due", "status", "overdue"], "people": ["claimed", "due-total", "overdue-total"], "rollups": True,
                   "audit": True})]


def cp183(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("open", "Ada", 0),
        ("close", "P1"), ("lock", "P1", True), ("as", "vic"), ("lock", "P1", True), ("lock", "P1", True),
        ("reopen", "P1"), ("rate", "A", "20.00"),
        ("check", {"periods": True, "claims": ["due"]}),
        ("lock", "P1", False), ("lock", "P1", False), ("reopen", "P1"),
        ("check", {"periods": True, "claims": ["due"], "audit": True})]


def cp184(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("statement", "Ada"),
        ("hold", "Ada", "2026-03-01", "2026-03-05"), ("claim_hold", "Ben", 0),
        ("check", {"people": ["claimed", "due-total"], "claims": ["held", "due"], "rollups": True, "counters": True}),
        ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("defer", "Ben", 0, "2026-03-20"),
        ("check", {"people": ["claimed", "due-total"], "claims": ["due", "status"], "rollups": True, "audit": True})]


def cp185(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "proof-threshold", "4.00"),
        ("claim", "Ada", "60.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("settle_part", "Ada", 0, "10.00"), ("as", "vic"), ("settle_part", "Ada", 0, "10.00"), ("settle_part", "Ada", 0, "50.00"),
        ("settle_part", "Ada", 0, "45.00"), ("settle_part", "Ada", 1, "5.00"),
        ("as", "wes"), ("settle_part", "Ada", 0, "1.00"),
        ("check", {"claims": ["amount", "number", "status", "due", "split-from", "proofs"], "people": ["claimed", "due-total"], "rollups": True,
                   "audit": True})]


def cp186(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2026-05-01", "2026-05-10"),
        ("generate_quarters", "2026"), ("generate_quarters", "x"), ("generate_quarters", "2026"),
        ("claim", "Ada", "10.00", "2026-02-15"), ("claim", "Ada", "20.00", "2026-09-30"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("check", {"periods": True, "claims": ["period"], "summary": True, "audit": True})]


def cp187(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("setting", "pot", "10.00"), ("pool", "P"), ("pool_member", "P", "Ada", "50.00"), ("pool_member", "P", "Ben", "50.00"),
        ("today", "2026-03-11"), ("setting", "pot", "20.00"), ("hold", "Ben", "2026-03-11", None),
        ("check", {"pools": True}),
        ("today", "2026-03-21"), ("pool_member", "P", "Ada", "1.00"), ("setting", "pot", "30.00"),
        ("check", {"pools": True}),
        ("close", "P1"), ("setting", "pot", "40.00"),
        ("check", {"pools": True, "audit": True})]


def cp188(k):
    return [("as", "uma"), ("sheet", "p"), ("today", T), ("rate", "B", "5.00"),
            ("sheet", ""), ("today", T), ("role", "vic", "steward"), ("rate", "A", "10.00"), ("setting", "parent", "__SHEET__-p"),
            ("person", "Ada", "A"), ("person", "Ben", "B"), ("person", "Cam", "C"),
            ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00"), ("claim", "Cam", "10.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
            ("as", "vic"), ("clone", "c"), ("as", "uma"), ("rate", "C", "30.00"),
            ("sheet", "p"), ("rate", "B", "7.00"),
            ("sheet", "c"), ("setting", "parent", ""),
            ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rollups": True}),
            ("rate", "C", "40.00"),
            ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rollups": True, "audit": True})]


def cp189(k):
    return _base(k, people=(), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("setting", "default-grade", "D"), ("setting", "default-grade", "B"),
        ("quick", "Ada", "10.00"), ("import_people", ["Ben,", "Cam,A"]), ("person", "Dot", "A"),
        ("open", "Ada", 0),
        ("check", {"people": ["name", "grade", "due-total"], "rollups": True}),
        ("setting", "default-grade", ""), ("quick", "Eve", "1.00"), ("import_people", ["Fay,"]),
        ("check", {"people": ["name", "grade"], "summary": True, "audit": True})]


def cp190(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("period", "P1", "2026-02-01", "2026-02-10"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("claim", "Ben", "5.00", "2026-02-05"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("close", "P1"), ("as", "vic"), ("settle", "Ben", 0),
        ("as", "uma"), ("bulk_void", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Ben", 1)]),
        ("check", {"claims": ["status", "number"], "people": ["claimed"], "rollups": True}),
        ("void_reason", "dup"), ("claim", "Ada", "1.00"), ("bulk_void", [("Ada", 2)]), ("bulk_void", [("Ada", 2)], "dup"),
        ("as", "vic"), ("bulk_void", [("Ben", 0)], "dup"),
        ("check", {"claims": ["status", "number"], "people": ["claimed", "due-total"], "summary": True, "rollups": True, "audit": True})]


def cp191(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "clerk-limit-B", "5.00"), ("setting", "clerk-limit-A", "0.50", "2026-03-20"),
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1),
        ("as", "wes"), ("settle", "Ada", 0), ("settle", "Ben", 0), ("settle", "Ben", 1),
        ("check", {"claims": ["status", "due"], "rollups": True}),
        ("as", "uma"), ("today", "2026-03-20"), ("claim", "Ada", "6.00"), ("open", "Ada", 1), ("as", "wes"), ("settle", "Ada", 1),
        ("as", "uma"), ("setting", "clerk-limit-B", ""), ("as", "vic"), ("approve", "Ben", 1),
        ("check", {"claims": ["status", "due"], "rollups": True, "audit": True})]


def cp192(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("patron", "Ada", "Ben"), ("patron", "Ada", "Cam"), ("crew", "Red", "Ben"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("check", {"people": ["name", "patrons", "grade"], "crews": True}),
        ("edit", "Ben", {"grade": "A", "grade_from": "2026-03-05"}), ("edit", "Cam", {"grade": "A", "grade_from": "2026-03-15"}),
        ("search", "a"), ("export",),
        ("check", {"people": ["name", "patrons", "grade"], "crews": True, "audit": True})]


def cp193(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00", "2026-02-01"), ("claim", "Ben", "30.00", "2026-01-01"), ("claim", "Ben", "40.00", "2026-02-07"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"people": ["aged-0-30", "aged-31-60", "aged-61"], "rollups": True}),
        ("today", "2026-04-10"), ("hold", "Ben", "2026-01-01", "2026-01-31"), ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"people": ["aged-0-30", "aged-31-60", "aged-61"], "rollups": True, "audit": True})]


def cp194(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"), ("setting", "late-pct", "10.00"),
        ("claim", "Ada", "100.00"), ("claim", "Ada", "20.00"), ("open", "Ada", 0),
        ("today", "2026-03-05"), ("rate", "A", "20.00"), ("open", "Ada", 1),
        ("today", "2026-04-20"), ("setting", "floor", "5.00"),
        ("as", "vic"), ("settle", "Ada", 0, "2026-04-21"), ("settle", "Ada", 1, "2026-03-01"), ("settle", "Ada", 0, "2026-03-05"),
        ("settle", "Ada", 1, "2026-04-20"),
        ("check", {"claims": ["due", "status", "log"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp195(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("export_statement", "Ada"),
        ("statement", "Ada"), ("rate", "A", "20.00"), ("open", "Ada", 2), ("as", "vic"), ("settle", "Ada", 0),
        ("export_statement", "Ada"),
        ("as", "uma"), ("statement", "Ada"), ("export_statement", "Ada")]


def cp196(k):
    return _base(k, today="2026-01-05", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "floor", "3.00"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00"), ("claim", "Ada", "5.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("today", "2026-03-12"),
        ("check", DUE),
        ("statement", "Ada"), ("rate", "A", "20.00"), ("today", "2026-04-12"),
        ("check", DUE),
        ("as", "vic"), ("settle", "Ada", 1),
        ("check", dict(DUE, audit=True))]


def cp197(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("rate", "A", "20.00"),
        ("activity",),
        ("today", "2026-03-11"), ("as", "vic"), ("statement", "Ada"),
        ("activity",), ("check", {"audit": True})]


def cp198(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("claim", "Ben", "5.00"),
        ("claim", "Ben", "5.00"), ("claim", "Ben", "5.00"), ("claim", "Ada", "9.00", "2026-03-01"), ("claim", "Ada", "9.00", "2026-03-01"),
        ("dups",), ("role", "vic", "steward"), ("void_reason", "dup"),
        ("void", "Ben", 2), ("delete", "Ada", 1), ("open", "Ada", 0),
        ("as", "vic"), ("merge", "Ben", "Ada"), ("hidden", "Ben"),
        ("dups",), ("check", {"audit": True})]


def cp199(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("as", "wes"), ("settle", "Ada", 0), ("settle", "Ada", 1),
        ("approve", "Ada", 0),
        ("as", "uma"), ("approver", "Ada", "wes"), ("as", "wes"), ("approve", "Ada", 0), ("reject", "Ada", 1, "no"),
        ("as", "uma"), ("approver", "Ada", "uma"), ("as", "wes"), ("approve", "Ada", 0), ("as", "uma"), ("open", "Ada", 1), ("approve", "Ada", 0),
        ("check", {"claims": ["status", "due"], "people": ["approver", "due-total"], "rollups": True, "audit": True})]


def cp200(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("setting", "terms", "5"), ("setting", "pot", "10.00"), ("period", "P1", "2026-03-01", "2026-03-10"), ("patron", "Cam", "Ada"),
        ("pool", "P"), ("pool_member", "P", "Ada", "50.00"), ("pool_member", "P", "Ben", "50.00"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("statement", "Ada"), ("rate", "A", "20.00"),
        ("hold", "Ada", "2026-03-01", None), ("claim_hold", "Ben", 0),
        ("check", {"people": ["claimed", "due-total", "backing", "cut-total", "hold"], "claims": ["due", "held"], "rollups": True,
                   "periods": True, "pools": True, "counters": True}),
        ("today", "2026-03-20"),
        ("check", {"people": ["claimed", "due-total", "overdue-total", "cut-total"], "claims": ["due", "overdue"], "rollups": True,
                   "pools": True, "audit": True})]



# ---- Act V (cp201-250): the squeeze ---------------------------------------------------------------

TREE3 = [("as", "uma"), ("sheet", "c1"), ("today", T), ("rate", "A", "10.00"), ("rate", "B", "20.00"), ("person", "Cy", "A"), ("person", "Di", "B"),
         ("claim", "Cy", "10.00"), ("claim", "Di", "20.00"), ("open", "Cy", 0), ("open", "Di", 0),
         ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("person", "Ada", "A"), ("person", "Ben", "B"),
         ("claim", "Ada", "10.00"), ("open", "Ada", 0),
         ("sheet", "c1"), ("setting", "parent", "__SHEET__"), ("sheet", "")]


def cp201(k):
    return TREE3 + [
        ("check", {"sheet": True, "summary": True}),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("rate", "B", "5.00"), ("retire", "Ben", "2026-03-01"),
        ("sheet", "c1"), ("void", "Di", 0), ("sheet", ""),
        ("check", {"sheet": True, "summary": True, "audit": True})]


def cp202(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("open", "Ada", 0),
        ("today", "2026-03-05"), ("rate", "A", "20.00"), ("claim", "Ben", "5.00"), ("open", "Ben", 0),
        ("today", "2026-03-10"), ("hold", "Ada", "2026-03-01", None),
        ("snapshot_compare", "2026-03-01", "2026-03-05"), ("snapshot_compare", "2026-03-05", ""), ("snapshot_compare", "2026-03-02", "2026-03-10"),
        ("today", "2026-03-11"), ("snapshot_compare", "2026-03-01", "2026-03-10"),
        ("check", {"audit": True})]


def cp203(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("plan", "Ada", "10.00", "2026-03-01", "2", "2026-03-20"),
        ("generate",), ("today", "2026-03-04"), ("plan_pause", "Ada", 0, True), ("plan_pause", "Ada", 0, True),
        ("today", "2026-03-08"), ("generate",), ("plan_pause", "Ada", 0, False), ("plan_pause", "Ada", 0, False),
        ("today", "2026-03-12"), ("generate",),
        ("check", {"plans": True, "claims": ["date", "amount"], "people": ["claimed"], "audit": True})]


def cp204(k):
    return [("as", "uma"), ("sheet", "c1"), ("today", T), ("rate", "A", "10.00"), ("rate", "B", "20.00"), ("person", "Cy", "A"), ("person", "Di", "B"),
            ("person", "Ada", "A"), ("alias", "Ada", "Addie"),
            ("claim", "Cy", "10.00"), ("claim", "Di", "20.00"), ("claim", "Ada", "40.00"), ("open", "Cy", 0), ("open", "Di", 0), ("open", "Ada", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("rate", "C", "30.00"), ("person", "Ada", "A"), ("person", "Ben", "B"), ("person", "Cam", "C"),
            ("claim", "Ada", "10.00"), ("claim", "Cam", "10.00"), ("open", "Ada", 0), ("open", "Cam", 0),
            ("sheet", "c1"), ("setting", "parent", "__SHEET__"), ("sheet", ""),
        ("check", {"sheet": True, "rollups": True}),
        ("setting", "terms", "1"), ("today", "2026-03-20"),
        ("check", {"sheet": True, "rollups": True, "audit": True})]


def cp205(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("plan", "Ada", "10.00", "2026-03-01", "3", "2026-03-20"),
        ("generate",), ("today", "2026-03-05"), ("generate",), ("open", "Ada", 0),
        ("plan_amount", "Ada", 0, "20.00"), ("plan_amount", "Ada", 0, "1.005"),
        ("today", "2026-03-11"), ("generate",), ("plan_amount", "Ada", 0, "5.00"), ("today", "2026-03-14"), ("generate",),
        ("check", {"plans": True, "claims": ["date", "amount", "status"], "people": ["claimed"], "audit": True})]


def cp206(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("wes", "C"), ("Dot", "A")), rates=AB) + [
        ("role", "wes", "restricted"), ("role", "wes", "x"),
        ("claim", "Ada", "10.00"), ("claim", "wes", "20.00"), ("open", "Ada", 0), ("open", "wes", 0),
        ("crew", "Red", "Ada"), ("crew_member", "Red", "wes"),
        ("as", "wes"), ("hidden", "Ben"), ("hidden", "Dot"),
        ("check", {"people": ["name", "due-total"], "rollups": True, "counters": True, "summary": True}),
        ("as", "uma"), ("crew", "Blue", "wes"), ("crew_member", "Blue", "Dot"), ("role", "vic", "restricted"),
        ("as", "wes"), ("hidden", "Ben"),
        ("check", {"people": ["name", "due-total"], "rollups": True}),
        ("as", "vic"), ("hidden", "Ada"), ("hidden", "Ben"), ("hidden", "wes"), ("hidden", "Dot"),
        ("check", {"rollups": True, "audit": True})]


def cp207(k):
    return _base(k, today="2026-11-20", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("generate_fy", "2026"),
        ("claim", "Ada", "10.00", "2026-11-05"), ("claim", "Ada", "20.00", "2026-12-05"), ("claim", "Ben", "30.00", "2026-10-05"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("today", "2026-12-20"), ("as", "vic"), ("settle", "Ada", 0),
        ("rollover", "x"), ("rollover", "2025"), ("as", "uma"), ("rollover", "2026"),
        ("today", "2027-01-05"), ("as", "vic"), ("rollover", "2026"),
        ("check", {"person_periods": True, "periods": True}),
        ("today", "2027-01-10"), ("claim", "Ada", "5.00"), ("open", "Ada", 2),
        ("check", {"person_periods": True, "periods": True, "audit": True})]


def cp208(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("open", "Ben", 1),
        ("check", {"claims": ["number", "status"]}),
        ("as", "vic"), ("settle", "Ben", 0), ("as", "wes"), ("settle", "Ada", 1), ("as", "vic"), ("approve", "Ada", 1),
        ("split", "Ada", 0, "4.00"), ("reassign", "Ben", 1, "Ada"), ("void", "Ada", 0), ("as", "wes"), ("settle", "Ada", 3),
        ("as", "uma"), ("claim", "Ada", "-1.00", None, "", ("number", "Ben", 0)),
        ("check", {"claims": ["number", "status", "due"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp209(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "3000.00"), ("claim", "Ada", "250.00"), ("claim", "Ben", "100.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ada", 1),
        ("as", "uma"), ("claim", "Ada", "-1000.00", None, "", ("number", "Ada", 0)), ("open", "Ada", 2), ("as", "vic"), ("settle", "Ada", 2),
        ("check", {"people": ["score", "due-total"]}),
        ("as", "uma"), ("today", "2026-03-20"),
        ("check", {"people": ["score", "overdue-count"], "audit": True})]


def cp210(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("setting", "terms", "5"),
        ("claim", "Ada", "500.00"), ("claim", "Ben", "100.00"), ("claim", "Cam", "10.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ben", 0),
        ("check", {"people": ["score", "band"]}),
        ("as", "uma"), ("setting", "score-mid", "0"), ("check", {"people": ["score", "band"]}),
        ("setting", "score-high", "1"), ("check", {"people": ["score", "band"]}),
        ("today", "2026-03-20"),
        ("check", {"people": ["score", "band"], "audit": True})]


def cp211(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "1"),
        ("claim", "Ada", "5000.00"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"),
        ("rate", "A", "20.00"),
        ("today", "2026-03-02"), ("setting", "score-log", "on"), ("setting", "score-mid", "0"), ("setting", "score-high", "1"),
        ("today", "2026-03-03"), ("claim", "Ben", "2500.00"), ("open", "Ben", 0), ("as", "vic"), ("settle", "Ben", 0),
        ("as", "uma"), ("today", "2026-03-04"), ("setting", "score-log", ""), ("today", "2026-03-05"),
        ("check", {"people": ["score", "band", "snapshot"], "audit": True})]


def cp212(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "score-mid", "0"), ("setting", "score-high", "2"),
        ("claim", "Ada", "3000.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("claim", "Ada", "-1000.00", None, "", ("number", "Ada", 0)), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ada", 1),
        ("check", {"people": ["score", "band"]}),
        ("as", "uma"), ("today", "2026-03-02"),
        ("check", {"people": ["score", "band"], "audit": True})]


def cp213(k):
    return [("as", "uma"), ("sheet", "c"), ("today", "2026-03-01"), ("rate", "A", "10.00"), ("person", "Ada", "A"),
            ("sheet", ""), ("today", "2026-03-01"), ("rate", "A", "20.00"), ("person", "Ada", "A"), ("person", "Ben", "B"),
            ("sheet", "c"), ("setting", "parent", "__SHEET__"), ("sheet", ""),
            ("plan", "Ada", "10.00", "2026-03-01", "5", "2026-03-20", "c"), ("plan", "Ben", "5.00", "2026-03-01", "5", "2026-03-20", "c"),
            ("plan", "Ada", "1.00", "2026-03-01", "5", "2026-03-20", "x"),
            ("generate",), ("today", "2026-03-12"), ("generate",),
            ("check", {"plans": True, "claims": ["amount", "date"], "people": ["claimed"], "audit": True}),
            ("sheet", "c"),
            ("check", {"claims": ["amount", "date", "status"], "people": ["claimed"], "audit": True})]


def cp214(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "max-open", "2"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "40.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("bulk_open", [("Ada", 3), ("Ben", 0)]), ("paste", ["Ada,1.00,,"]),
        ("as", "vic"), ("settle", "Ada", 0), ("open", "Ada", 2), ("as", "uma"), ("setting", "max-open", ""), ("open", "Ada", 3),
        ("check", {"claims": ["status", "number"], "people": ["due-total"], "audit": True})]


def cp215(k):
    return [("as", "uma"), ("sheet", "o"), ("today", T), ("rate", "A", "10.00"), ("person", "Ox", "A"), ("claim", "Ox", "10.00"), ("open", "Ox", 0),
            ("sheet", ""), ("today", T), ("rate", "A", "20.00"), ("rate", "B", "5.00"), ("person", "Ada", "A"), ("person", "Ben", "B"),
            ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00"), ("open", "Ada", 0), ("open", "Ben", 0),
            ("compare", "o"), ("compare", "zz"), ("retire", "Ada", "2026-03-01"), ("show_retired", True), ("compare", "o"),
            ("check", {"audit": True})]


def cp216(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("setting", "pot", "10.00"),
        ("pool", "P"), ("pool_member", "P", "Ada", "50.00"), ("pool_member", "P", "Ben", "50.00"),
        ("today", "2026-03-15"), ("setting", "pot", "20.00"),
        ("check", {"pools": True}),
        ("close", "P1"), ("setting", "pot", "30.00"), ("hold", "Ben", "2026-03-15", None),
        ("check", {"pools": True}),
        ("reopen", "P1"),
        ("check", {"pools": True, "audit": True})]


def cp217(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("claim", "Ada", "10.01"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("share", "Ada", 0, "Ben", "33.33"), ("share", "Ada", 0, "Ben", "10.00"), ("share", "Ada", 0, "Ada", "10.00"),
        ("share", "Ada", 0, "Cam", "66.68"), ("share", "Ada", 0, "Cam", "0.00"), ("share", "Ada", 0, "Cam", "33.33"),
        ("check", {"claims": ["shares", "due"], "people": ["due-total", "claimed"], "rollups": True}),
        ("as", "vic"), ("settle", "Ada", 1), ("share", "Ada", 1, "Ben", "50.00"), ("as", "uma"), ("rate", "A", "20.00"),
        ("hold", "Ada", "2026-03-01", None),
        ("check", {"claims": ["shares", "due"], "people": ["due-total", "claimed"], "rollups": True, "audit": True})]


def cp218(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "review-threshold", "1.50"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("role", "wes", "viewer"), ("as", "wes"), ("assign_review", "Ada", 0, "wes"),
        ("as", "uma"), ("assign_review", "Ada", 0, "wes"), ("as", "vic"), ("assign_review", "Ada", 0, "wes"), ("assign_review", "Ada", 1, " "), ("assign_review", "Ada", 2, "wes"),
        ("delegate", "uma", "2026-03-10", "2026-03-11"), ("as", "uma"), ("assign_review", "Ada", 1, "vic"), ("as", "vic"),
        ("as", "wes"), ("check", {"claims": ["review-assigned", "status"], "counters": True}),
        ("as", "vic"), ("review", "Ada", 0), ("check", {"claims": ["review-assigned", "status"], "counters": True, "audit": True})]


def cp219(k):
    return _base(k, today="2026-12-20", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("generate_fy", "2026"), ("claim", "Ada", "10.00", "2026-12-05"), ("open", "Ada", 0),
        ("as", "vic"), ("rollover", "2026"),
        ("check", {"periods": True, "person_periods": True}),
        ("rollover_undo",), ("rollover_undo",),
        ("check", {"periods": True, "person_periods": True}),
        ("rollover", "2026"), ("as", "uma"), ("rollover_undo",), ("claim", "Ada", "1.00", "2027-01-05"),
        ("as", "vic"), ("rollover_undo",), ("void", "Ada", 1), ("rollover_undo",), ("today", "2026-12-21"), ("rollover", "2026"), ("today", "2026-12-22"), ("rollover_undo",),
        ("check", {"periods": True, "person_periods": True, "audit": True})]


def cp220(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("plan", "Ada", "10.00", "2026-03-01", "2", "2026-03-10"),
        ("generate",), ("today", "2026-03-05"), ("generate",), ("open", "Ada", 0), ("delete", "Ada", 1),
        ("plan_amount", "Ada", 0, "20.00"),
        ("check", {"plans": True, "claims": ["date", "amount", "status"], "people": ["claimed"], "audit": True})]


def cp221(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("check", {"counters": True}),
        ("watch", "Ada", True), ("watch", "Ben", True), ("as", "vic"), ("watch", "Ben", True),
        ("check", {"counters": True}),
        ("as", "uma"), ("hold", "Ben", "2026-03-01", None), ("setting", "cap", "1.50"), ("watch", "Ada", False),
        ("check", {"counters": True, "audit": True})]


def cp222(k):
    return TREE3 + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "review-threshold", "3.00"), ("setting", "terms", "5"),
        ("claim", "Ada", "40.00"), ("open", "Ada", 1), ("as", "wes"), ("settle", "Ada", 0),
        ("sheet", "c1"), ("as", "uma"), ("sheet", "c1"), ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("setting", "review-threshold", "3.00"), ("setting", "terms", "5"), ("claim", "Cy", "40.00"), ("open", "Cy", 1),
        ("as", "wes"), ("sheet", "c1"), ("settle", "Cy", 0), ("today", "2026-03-20"),
        ("sheet", ""), ("as", "vic"), ("check", {"dash": True}),
        ("sheet", "c1"), ("check", {"dash": True, "audit": True})]


def cp223(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("grade_retire", "B"), ("grade_retire", "B"), ("grade_retire", "D"),
        ("person", "Cam", "B"), ("edit", "Ada", {"grade": "B"}), ("edit", "Ben", {"grade": "B"}), ("import_people", ["Dot,B"]),
        ("setting", "default-grade", "B"), ("quick", "Eve", "1.00"), ("inline_grade", "Ada", "B"),
        ("claim", "Ben", "10.00"), ("open", "Ben", 0),
        ("check", {"people": ["name", "grade", "due-total"], "summary": True, "audit": True})]


def cp224(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("setting", "pot", "10.00"), ("pool", "P"), ("pool_member", "P", "Ada", "50.00"), ("pool_member", "P", "Ben", "50.00"),
        ("claim", "Ada", "40.00"), ("claim", "Ben", "10.00"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("setting", "cap", "6.00"),
        ("check", {"people": ["due-total", "excess", "cut-total"], "rollups": True}),
        ("setting", "cap", "3.00"), ("setting", "pot", "4.00"),
        ("check", {"people": ["due-total", "excess", "cut-total"], "rollups": True, "audit": True})]


def cp225(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=(("A", "10.00"), ("B", "20.00"), ("C", "30.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("claim", "Cam", "10.00", "2026-03-01"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Cam", 0), ("statement", "Cam"),
        ("grade_merge", "A", "B"), ("as", "vic"), ("grade_merge", "A", "A"), ("grade_merge", "A", "B"),
        ("check", {"people": ["grade", "due-total"], "claims": ["due", "stated"], "summary": True, "rollups": True}),
        ("today", "2026-03-11"), ("claim", "Ada", "10.00"), ("open", "Ada", 2), ("grade_merge", "C", "B"),
        ("check", {"people": ["grade", "due-total"], "claims": ["due", "stated"], "summary": True, "rollups": True, "audit": True})]


def cp226(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "grace-days", "0"), ("setting", "score-mid", "0"), ("setting", "score-high", "1"),
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "20.00"), ("claim", "Ben", "20.00"), ("open", "Ada", 0), ("open", "Ben", 0),
        ("hold", "Ben", "2026-03-20", None), ("retire", "Ada", "2026-03-15"), ("show_retired", True), ("rate", "A", "20.00", "2026-04-01"),
        ("check", {"people": ["due-total", "overdue-total", "retired"], "claims": ["due", "overdue"], "rollups": True, "periods": True, "sheet": True}),
        ("preview", "2026-04-20"),
        ("check", {"people": ["due-total", "overdue-total", "retired"], "claims": ["due", "overdue"], "rollups": True, "periods": True, "sheet": True}),
        ("claim", "Ada", "1.00", "2026-03-01"), ("open", "Ada", 1),
        ("check", {"claims": ["due", "overdue", "status"], "rollups": True, "sheet": True}),
        ("as", "vic"), ("check", {"claims": ["due", "overdue"], "rollups": True, "sheet": True}),
        ("as", "uma"), ("preview_clear",),
        ("check", {"people": ["due-total", "overdue-total"], "rollups": True, "periods": True, "sheet": True, "audit": True})]


def cp227(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "terms", "5"), ("setting", "late-pct", "10.00"),
        ("claim", "Ada", "100.00"), ("open", "Ada", 0),
        ("export",), ("export_claims",), ("preview", "2026-05-01"), ("export",), ("export_claims",), ("preview_clear",), ("export",)]


def cp228(k):
    return _base(k, today="2026-12-20", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("generate_fy", "2026"), ("claim", "Ada", "10.00", "2026-12-05"), ("open", "Ada", 0),
        ("close", "2026-11"), ("as", "vic"), ("rollover", "2026"),
        ("check", {"periods": True, "person_periods": True}),
        ("claim", "Ada", "5.00", "2026-12-06"), ("open", "Ada", 1), ("rate", "A", "20.00"),
        ("check", {"periods": True, "person_periods": True, "claims": ["late-entry", "due"], "audit": True})]


def cp229(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("grade_add", "D"), ("grade_add", "D"), ("grade_add", "dd"), ("grade_add", "ABCD"), ("grade_add", "E1"), ("grade_add", " XY "),
        ("person", "Ben", "D"), ("rate", "D", "40.00"), ("claim", "Ben", "10.00"), ("open", "Ben", 0),
        ("edit", "Ada", {"grade": "XY"}), ("quick", "Cam", "1.00"),
        ("check", {"people": ["name", "grade", "due-total"], "claims": ["due"], "rates": True, "summary": True, "calendar": True, "audit": True})]


def cp230(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "pending-sla", "2"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("as", "wes"), ("settle", "Ada", 0), ("as", "uma"), ("today", "2026-03-03"), ("as", "wes"), ("settle", "Ada", 1),
        ("check", {"claims": ["status", "pending-late"], "summary": True}),
        ("as", "uma"), ("today", "2026-03-04"),
        ("check", {"claims": ["status", "pending-late"], "summary": True}),
        ("as", "vic"), ("reject", "Ada", 0, "no"), ("as", "wes"), ("settle", "Ada", 0), ("as", "uma"), ("today", "2026-03-06"),
        ("check", {"claims": ["status", "pending-late"], "summary": True, "audit": True})]


def cp231(k):
    return _base(k, today="2026-03-25", people=(("Ada", "A"), ("Lee, Jo", "B")), rates=AB) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Lee, Jo", "20.00", "2026-03-15"), ("open", "Ada", 0), ("open", "Lee, Jo", 0),
        ("export_periods",), ("close", "P1"), ("rate", "A", "20.00"), ("export_periods",)]


def cp232(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"), ("C", "30.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00", "2026-03-01"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("as", "vic"), ("grade_merge", "A", "C"),
        ("check", {"people": ["grade", "due-total"], "claims": ["due"], "rollups": True}),
        ("as", "uma"), ("rate", "A", "50.00"), ("rate", "C", "60.00"), ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "10.00", "2026-03-11"),
        ("open", "Ada", 2), ("open", "Ada", 3), ("edit", "Ada", {"grade": "B", "grade_from": "2026-03-20"}),
        ("check", {"people": ["grade", "due-total"], "claims": ["due"], "rollups": True, "audit": True})]


def cp233(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "terms", "5"), ("setting", "late-pct", "10.00"), ("setting", "grace-A", "2"),
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0),
        ("set_due_by", "Ada", 0, "2026-03-15"), ("as", "vic"), ("set_due_by", "Ada", 0, "2026-03-15"), ("set_due_by", "Ada", 1, "2026-03-02"),
        ("check", {"claims": ["due-by", "overdue", "period", "due"], "periods": True, "person_periods": True}),
        ("as", "uma"), ("holiday", "2026-03-15"), ("today", "2026-04-20"),
        ("check", {"claims": ["due-by", "overdue", "period", "due"], "people": ["overdue-total"], "periods": True, "audit": True})]


def cp234(k):
    return TREE3 + [("export_tree",), ("sheet", "c1"), ("export_tree",)]


def cp235(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("role", "wes", "viewer"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "20.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("statement", "Ada"),
        ("bulk_hold", ["Cam", "Ada"], "2026-03-01", "2026-03-05"),
        ("check", {"people": ["hold", "due-total"], "rollups": True}),
        ("as", "wes"), ("bulk_hold", ["Ben"], "2026-03-01", None),
        ("as", "uma"), ("bulk_hold", ["Ben", "Ada"], "2026-03-10", None),
        ("check", {"people": ["hold", "due-total"], "rollups": True, "audit": True})]


def cp236(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "terms", "2"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("statement", "Ada"), ("rate", "A", "20.00"), ("defer", "Ada", 0, "2026-03-20"), ("defer", "Ada", 1, "2026-03-20"),
        ("check", DUE | {"claims": ["due", "status", "stated", "deferred", "overdue"]}),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("statement", "Ada"),
        ("check", DUE | {"claims": ["due", "status", "stated", "deferred"]}),
        ("as", "vic"), ("unstate", "Ada"), ("unstate", "Ada"),
        ("check", DUE | {"claims": ["due", "status", "stated", "deferred"], "audit": True})]


def cp237(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("role", "wes", "viewer"),
        ("setting", "perm-today", "steward"), ("today", "2026-03-11"), ("as", "vic"), ("today", "2026-03-12"), ("as", "wes"), ("today", "2026-03-13"),
        ("as", "uma"), ("setting", "perm-today", ""), ("today", "2026-03-14"), ("as", "wes"), ("today", "2026-03-15"),
        ("as", "uma"), ("check", {"today": True, "audit": True})]


def cp238(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"), ("claim", "Ben", "30.00"), ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ben", 1),
        ("alias", "Ben", "Benny"), ("alias", "Ada", "Addie"),
        ("as", "vic"), ("merge", "Ben", "Ada"), ("hidden", "Ben"), ("claim", "Ada", "5.00"),
        ("merge_undo", "Cam"), ("as", "uma"), ("merge_undo", "Ada"), ("as", "vic"), ("merge_undo", "Ada"),
        ("check", {"people": ["name", "aliases", "claimed", "due-total"], "claims": ["amount", "number", "status"], "rollups": True}),
        ("merge_undo", "Ada"), ("merge", "Cam", "Ada"), ("today", "2026-03-11"), ("merge_undo", "Ada"),
        ("check", {"people": ["name", "aliases", "claimed"], "claims": ["amount", "status"], "rollups": True, "audit": True})]


def cp239(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-06"), ("claim", "Ada", "30.00", "2026-03-15"), ("claim", "Ada", "40.00", "2026-03-25"),
        ("open", "Ada", 0), ("void", "Ada", 1), ("delete", "Ada", 3),
        ("check", {"periods": True}),
        ("close", "P1"), ("setting", "terms", "10"), ("claim", "Ada", "1.00", "2026-03-05"),
        ("check", {"periods": True, "audit": True})]


def cp240(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")), rates=AB) + [
        ("claim", "Ada", "10.01"), ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("share", "Ada", 0, "Ben", "33.33"), ("share", "Ada", 0, "Cam", "33.33"), ("share", "Ada", 1, "Ben", "50.00"),
        ("check", {"claims": ["shares", "due"], "people": ["due-total"], "rollups": True}),
        ("rate", "C", "30.00"), ("as", "vic"), ("settle", "Ada", 1), ("as", "uma"), ("rate", "B", "10.00"),
        ("check", {"claims": ["shares", "due", "status"], "people": ["due-total"], "rollups": True, "audit": True})]


def cp241(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("today", "2026-03-05"), ("role", "wes", "viewer"), ("role", "vic", "clerk"), ("today", "2026-03-10"),
        ("check", {"roles": True}),
        ("asof", "2026-03-01"), ("check", {"roles": True}),
        ("asof", "2026-03-05"), ("check", {"roles": True}),
        ("asof_clear",), ("check", {"roles": True, "audit": True})]


def cp242(k):
    return _base(k, today="2026-03-10", people=(("Ada", "A"),), rates=A1) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-05"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"), ("edit", "Ada", {"grade": "B", "grade_from": "2026-03-05"}), ("hold", "Ada", "2026-03-02", "2026-03-04"),
        ("retire", "Ada", "2026-03-08"), ("show_retired", True),
        ("check", {"people": ["timeline"]}),
        ("today", "2026-03-12"), ("unretire", "Ada"), ("hold", "Ada", "2026-03-05", None),
        ("check", {"people": ["timeline"], "audit": True})]


def cp243(k):
    return _base(k, people=(("Ada", "A"), ("Lee, Jo", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("alias", "Ada", "Addie"), ("hold", "Lee, Jo", "2026-03-01", None),
        ("export_person", "Ada"), ("export_person", "Lee, Jo"),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("export_person", "Ada")]


def cp244(k):
    return TREE3 + [
        ("person", "Cam", "C"), ("rate", "C", "30.00"), ("setting", "pot", "10.00"), ("pool", "P"),
        ("pool_member", "P", "Ada", "40.00"), ("pool_member", "P", "Ben", "30.00"), ("pool_member", "P", "Cam", "30.00"),
        ("claim", "Ben", "20.00"), ("claim", "Cam", "30.00"), ("open", "Ben", 0), ("open", "Cam", 0),
        ("as", "vic"), ("settle", "Ada", 0), ("settle", "Ben", 0),
        ("check", {"sheet": True, "rollups": True, "people": ["settled-total", "open-total", "cut-total"]}),
        ("sheet", "c1"), ("settle", "Cy", 0), ("sheet", ""),
        ("check", {"sheet": True, "rollups": True, "audit": True})]


def cp245(k):
    return _base(k, people=(("Ada", "A"),), rates=()) + [
        ("role", "vic", "steward"),
        ("rate", "A", "10.00"), ("rate", "A", "20.00"), ("rate", "A", "30.00", "2026-03-05"), ("rate", "B", "5.00"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("check", {"claims": ["due"], "rates": True, "rate_rows": True}),
        ("withdraw_rate", "A"), ("as", "vic"), ("withdraw_rate", "A"),
        ("check", {"claims": ["due"], "rates": True, "rate_rows": True}),
        ("withdraw_rate", "A"), ("withdraw_rate", "A", "2026-03-05"), ("withdraw_rate", "C"),
        ("check", {"claims": ["due"], "people": ["due-total"], "rates": True, "rate_rows": True, "rollups": True, "audit": True})]


def cp246(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ben", "5.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("as", "vic"), ("settle", "Ada", 0), ("void", "Ben", 0),
        ("check", {"people": ["claims-OPEN-count", "claims-SETTLED-count"]}),
        ("hold", "Ada", "2026-03-01", None), ("as", "uma"), ("delete", "Ada", 2),
        ("check", {"people": ["claims-OPEN-count", "claims-SETTLED-count"], "audit": True})]


def cp247(k):
    return _base(k, people=(("Ada", "A"),), rates=A1) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "20.00"), ("open", "Ada", 0), ("as", "wes"), ("settle", "Ada", 0),
        ("as", "vic"), ("reject", "Ada", 0, ""), ("reject", "Ada", 0, " "), ("reject", "Ada", 0, "no"),
        ("check", {"claims": ["status", "log"], "audit": True})]


def cp248(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("role", "vic", "steward"), ("setting", "clerk-limit", "1.50"), ("setting", "cap", "3.00"), ("setting", "floor", "2.00", "2026-03-05"),
        ("claim", "Ada", "10.00", "2026-02-20"), ("claim", "Ada", "20.00"), ("claim", "Ben", "40.00", "2026-02-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"claims": ["policy", "due"], "people": ["due-total", "excess"], "counters": True, "rollups": True}),
        ("today", "2026-03-10"), ("setting", "cap", "9.00"), ("setting", "clerk-limit", "9.00", "2026-02-22"), ("setting", "terms", "5"),
        ("as", "wes"), ("settle", "Ada", 0), ("settle", "Ben", 0), ("settle", "Ada", 1),
        ("as", "uma"), ("claim", "Ada", "1.00", "2026-03-10"), ("open", "Ada", 2),
        ("check", {"claims": ["policy", "due", "status"], "people": ["due-total", "excess"], "counters": True, "rollups": True, "audit": True})]


def cp249(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"),), rates=A1) + [
        ("setting", "floor", "2.00"), ("setting", "terms", "5", "2026-03-10"), ("setting", "rounding", "half-up", "2026-02-01"),
        ("claim", "Ada", "10.00", "2026-02-20"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00", "2026-03-10"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("policy",), ("setting", "late-pct", "10.00", "2026-03-10"), ("policy",),
        ("check", {"claims": ["policy"], "counters": True, "audit": True})]


def cp250(k):
    return _base(k, today="2026-03-01", people=(("Ada", "A"), ("Ben", "B")), rates=AB) + [
        ("setting", "cap", "3.00"), ("setting", "terms", "5", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-02-20"), ("claim", "Ada", "20.00"), ("claim", "Ben", "40.00", "2026-03-10"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("export_policy",), ("as", "uma"), ("hold", "Ben", "2026-03-10", None), ("export_policy",)]


SCRIPTS = {n: globals()[f"cp{n:02d}"] for n in range(1, 251)}
