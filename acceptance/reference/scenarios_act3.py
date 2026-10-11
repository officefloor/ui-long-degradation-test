"""Act III scenarios (cp101-150), registered into the same registry as Acts I-II (scenarios.py).

The entries are generated together with the Act III specs (act3_authoring/build.py), so every figure a
spec asserts comes from the model with the spec's own seed. They include earlier specs' updated
versions shipped at Act III mutations.
"""
try:
    from acceptance.reference.scenarios_act3_data import DATA
except ImportError:      # before the first generation
    DATA = []


def register(S, SC, copy_at):
    for spec, title, n, fx, checks, label in DATA:
        S(spec, title, n, fx, checks, label)
