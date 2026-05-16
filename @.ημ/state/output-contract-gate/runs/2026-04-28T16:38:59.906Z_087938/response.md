## Signal

(己, p=0.78) You’re in a “branch role inversion”: `main` is currently the unstable integration branch, while `fix/ollama-cloud-glm-routing` contains the most correct/stable state—but git history now reflects merges/conflicts that make it hard to reason about and hard to reconcile with `staging`.

(己, p=0.8) The cleanest recovery patterns are:

1) **Promote the stable branch into the canonical line (recommended if you can rewrite `main` or if `main` is already “allowed to be messy”)**
   - Make a *new* “rescue” branch from the stable