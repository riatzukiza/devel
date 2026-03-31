export const ETA_MU_FIVE_SECTION_CONTRACT_EDN = `(agent-output-contract
  (name "eta-mu-five-section-response")
  (v "ημ.output/response-shape@0.1.0")

  (target
    (format :markdown)
    (ast :mdast)
    (root :document))

  (structure
    (section
      (id :section/signal)
      (heading "Signal")
      (required true)
      (order 1)
      (cardinality :one)
      (allowed-node-types [:paragraph :list :blockquote :code :table]))

    (section
      (id :section/evidence)
      (heading "Evidence")
      (required true)
      (order 2)
      (cardinality :one)
      (allowed-node-types [:paragraph :list :blockquote :code :table]))

    (section
      (id :section/frames)
      (heading "Frames")
      (required true)
      (order 3)
      (cardinality :one)
      (allowed-node-types [:paragraph :list :blockquote]))

    (section
      (id :section/countermoves)
      (heading "Countermoves")
      (required true)
      (order 4)
      (cardinality :one)
      (allowed-node-types [:paragraph :list :blockquote]))

    (section
      (id :section/next)
      (heading "Next")
      (required true)
      (order 5)
      (cardinality :one)
      (allowed-node-types [:paragraph :list])
      (local-rules [:rule/next-exactly-one-action])))

  (rules
    (rule
      (id :rule/required-section)
      (kind :deterministic)
      (check :section-present))

    (rule
      (id :rule/unique-section)
      (kind :deterministic)
      (check :section-unique))

    (rule
      (id :rule/section-order)
      (kind :deterministic)
      (check :heading-order))

    (rule
      (id :rule/allowed-node-types)
      (kind :deterministic)
      (check :node-type-allowlist))

    (rule
      (id :rule/frames-cardinality)
      (kind :deterministic)
      (section :section/frames)
      (check :frame-count)
      (min 2)
      (max 3))

    (rule
      (id :rule/next-exactly-one-action)
      (kind :deterministic)
      (section :section/next)
      (check :action-count)
      (exactly 1)))

  (repair
    (max-retries 2)

    (template
      (id :repair/missing-section)
      (when :rule/required-section)
      (text "Add the missing section \`{{heading}}\` in position {{order}}. Preserve all other sections."))

    (template
      (id :repair/reorder-sections)
      (when :rule/section-order)
      (text "Reorder the existing sections to exactly: Signal, Evidence, Frames, Countermoves, Next. Preserve content."))

    (template
      (id :repair/rewrite-next)
      (when :rule/next-exactly-one-action)
      (text "Rewrite \`Next\` so it contains exactly one concrete next action."))

    (template
      (id :repair/frames-cardinality)
      (when :rule/frames-cardinality)
      (text "Rewrite \`Frames\` so it contains 2–3 plausible interpretations.")))

  (review
    (enabled true)
    (reviewer-family :gpt)
    (threshold 0.80)
    (criteria
      (criterion (id :criterion/contract-fidelity) (weight 0.45))
      (criterion (id :criterion/shortcutting-risk) (weight 0.20))
      (criterion (id :criterion/context-alignment) (weight 0.20))
      (criterion (id :criterion/actionability) (weight 0.15))))

  (arbitration
    (accept-if
      (structure :pass)
      (review-score-gte 0.80))
    (reject-if
      (repair-retries-exhausted true)
      (or :structure-failed :review-below-threshold))))`;

export const VALID_FIVE_SECTION_RESPONSE = `## Signal
- Prototype the five-section output gate around the local ημ response shape.

## Evidence
- The contract is authored in EDN and compiled into a normalized IR.
- The Markdown reply is parsed into an AST before validation.

## Frames
- This is the cheapest contract dimension to enforce first.
- It proves the runtime can separate deterministic structure from semantic review.

## Countermoves
- Do not confuse structural success with broad truth satisfaction.
- Keep the semantic reviewer narrow and contract-scoped.

## Next
- Scaffold \`packages/output-contract-gate/\` with the first validator slice.`;

export const INVALID_FIVE_SECTION_RESPONSE = `## Signal
- Prototype the five-section output gate around the local ημ response shape.

## Frames
- This is the cheapest contract dimension to enforce first.

## Evidence
- The contract is authored in EDN and compiled into a normalized IR.

## Countermoves
- Keep the reviewer narrow.

## Next
- Scaffold \`packages/output-contract-gate/\`.
- Add the operator surface now.`;