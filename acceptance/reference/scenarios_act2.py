"""Act II scenarios (cp51-100), registered into the same registry as Act I (scenarios.py).

The entries are generated together with the Act II specs, so every figure a spec asserts comes from
the model with the spec's own seed (plus what the test does through the UI). They include the Act I
specs' updated versions shipped at Act II mutations.
"""
try:
    from acceptance.reference.scenarios_act2_data import DATA
except ImportError:      # before the first generation
    DATA = []


def register(S, SC, copy_at):
    for spec, title, n, fx, checks, label in DATA:
        S(spec, title, n, fx, checks, label)
