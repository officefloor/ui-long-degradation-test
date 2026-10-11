"""Act IV scenarios (cp151-200), registered into the same registry as Acts I-III (scenarios.py).

The entries are generated together with the Act IV specs (act4_authoring/build.py), so every figure a
spec asserts comes from the model with the spec's own seed. They include earlier specs' updated
versions shipped at Act IV mutations.
"""
try:
    from acceptance.reference.scenarios_act4_data import DATA
except ImportError:      # before the first generation
    DATA = []


def register(S, SC, copy_at):
    for spec, title, n, fx, checks, label in DATA:
        S(spec, title, n, fx, checks, label)
