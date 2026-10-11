"""Act V scenarios (cp201-250), registered into the same registry as Acts I-IV (scenarios.py).

The entries are generated together with the Act V specs (act5_authoring/build.py), so every figure a
spec asserts comes from the model with the spec's own seed. They include earlier specs' updated
versions shipped at Act V mutations, and the model checks of each test's actions ('ok.' keys).
"""
try:
    from acceptance.reference.scenarios_act5_data import DATA
except ImportError:      # before the first generation
    DATA = []


def register(S, SC, copy_at):
    for spec, title, n, fx, checks, label in DATA:
        S(spec, title, n, fx, checks, label)
