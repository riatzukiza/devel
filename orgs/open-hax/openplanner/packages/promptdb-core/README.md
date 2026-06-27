# promptdb-core

Epistemic kernel for openplanner. Every other system — contracts, actors, events, receipts — emits these primitives.

## Layer map

| LayerKind | Epistemic Role | Primitive |
|---|---|---|
| actor | fact | A principal exists and has a role in this world |
| event | obs | Something happened (observed, not yet validated) |
| contract | inference-rule | A claim-verifier: given these obs/facts, this is true |
| contract execution | inference | A specific claim, produced by applying a contract to evidence |
| receipt | attestation | The actor's signature that they did what they said |
| fulfillment | judgment | The world's verdict on whether the claim held |

## Inference loop

```
obs (event arrives)
  → actor-fact (principal is permitted)
    → contract (rule fires)
      → inference (claim C, p=0.9)
        → action (world-effect)
          → attestation (actor: I did X)
            → judgment (did C hold?)
              → new obs
```

## Contract kinds → epistemic roles

| Contract kind | Role |
|---|---|
| `:trigger` | promotes obs → eligible for matching |
| `:policy` | side-condition: must hold for rule to fire |
| `:tool-call` | capability grant: which attestation types actor may emit |
| `:agent` | inference rule: obs + fact → inference + attestation |
| `:fulfillment` | issues judgment on an inference |
| `:role` | asserts actor-fact into the store |

## Usage

```clojure
(require '[promptdb.core :as db])

(db/validate! :promptdb/obs
  {:ctx   :己
   :about :discord/message
   :signal {:content "hello"}
   :p      0.95})
```

## Ingestor

Files in this package (and any `promptdb`-shaped EDN in the repo) are picked up
by the Knoxx ingestor with `source-kind: :promptdb`. Instead of chunk-and-embed,
they are parsed, validated, and written directly to the epistemic/Datalog store.

## License

LGPLv3+
