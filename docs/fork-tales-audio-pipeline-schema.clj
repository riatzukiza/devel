(ns fork-tales.audio.pipeline-schema
  "Malli μ registry for the Fork Tales audio agent pipeline.

  This namespace is intentionally data-first: the registry is plain
  EDN-serializable Malli schema data with named keys and [:ref ...]
  composition. Runtime validators are derived from the registry."
  (:require [malli.core :as m]
            [malli.registry :as mr]))

(def registry
  {:ft/Role
   [:enum
    :planner-agent
    :primary-agent
    :transcriber
    :producer
    :gemma-check-subagent
    :extraction-tool
    :adjudication-agent
    :qc-reviewer-agent
    :human-auditor]

   :ft/Mode
   [:enum :scribe :composition]

   :ft/Severity
   [:enum :info :minor :major :blocking]

   :ft/Verdict
   [:enum :accept :revise :reject :approve]

   :ft/Domain
   [:enum
    :lyrics-realized
    :word-syllable-timing
    :pitch-content
    :ornament-articulation
    :structure
    :render-fidelity
    :instruction-following
    :prompt-audio-discrepancy
    :arrangement-quality
    :mix-translation
    :fork-tales-identity]

   :ft/ArtifactKind
   [:enum
    :audio
    :stem
    :lyrics
    :phonemes
    :note-events
    :midi
    :musicxml
    :ustx
    :spectrogram
    :f0-contour
    :metrics-json
    :judge-scores
    :report
    :reference-catalog
    :handoff-packet]

   :ft/State
   [:enum
    :job-created
    :planning
    :scribe-executing
    :scribe-gemma-checking
    :scribe-adjudicating
    :scribe-qc-review
    :reference-cataloged
    :composition-executing
    :composition-gemma-checking
    :composition-adjudicating
    :composition-qc-review
    :human-audit
    :accepted
    :rejected
    :failed]

   :ft/MachineEvent
   [:enum
    :begin-plan
    :plan-ready
    :run-gemma-check
    :gemma-check-complete
    :submit-artifacts
    :score-claims
    :qc-accept
    :qc-revise
    :catalog-reference
    :start-composition
    :audit-accept
    :audit-reject
    :fail]

   :ft/Span
   [:map
    [:t0 {:optional true} :double]
    [:t1 {:optional true} :double]
    [:bars {:optional true} [:vector [:int {:min 1}]]]
    [:beats {:optional true} [:vector :double]]
    [:ticks {:optional true} [:vector :int]]
    [:section {:optional true} :string]
    [:track {:optional true} :keyword]
    [:phrase-id {:optional true} :string]]

   :ft/ArtifactRef
   [:map
    [:artifact/id :string]
    [:artifact/kind [:ref :ft/ArtifactKind]]
    [:artifact/path :string]
    [:artifact/label {:optional true} :string]
    [:artifact/source-job-id {:optional true} :string]
    [:artifact/span {:optional true} [:ref :ft/Span]]
    [:artifact/source-span {:optional true} [:ref :ft/Span]]
    [:artifact/provenance {:optional true} [:vector :string]]
    [:artifact/unresolved-issues {:optional true} [:vector :string]]
    [:artifact/sha256 {:optional true} :string]
    [:artifact/metadata {:optional true} [:map-of :keyword :any]]]

   :ft/AmbiguityPolicy
   [:map
    [:reduce-penalty {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:require-human-audit-if-disagreement-gt {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:suppress-domain {:optional true} [:vector [:ref :ft/Domain]]]
    [:notes {:optional true} [:vector :string]]]

   :ft/Ambiguity
   [:map
    [:ambiguity/id :string]
    [:ambiguity/type :keyword]
    [:ambiguity/domains [:vector [:ref :ft/Domain]]]
    [:ambiguity/severity [:double {:min 0.0 :max 1.0}]]
    [:ambiguity/span {:optional true} [:ref :ft/Span]]
    [:ambiguity/note :string]
    [:ambiguity/policy [:ref :ft/AmbiguityPolicy]]
    [:ambiguity/evidence-refs {:optional true} [:vector :string]]]

   :ft/Task
   [:map
    [:task/id :string]
    [:task/mode [:ref :ft/Mode]]
    [:task/role [:ref :ft/Role]]
    [:task/objective :string]
    [:task/domain {:optional true} [:ref :ft/Domain]]
    [:task/span {:optional true} [:ref :ft/Span]]
    [:task/inputs [:vector [:ref :ft/ArtifactRef]]]
    [:task/constraints {:optional true} [:map-of :keyword :any]]
    [:task/success-criteria {:optional true} [:vector :string]]
    [:task/ambiguities {:optional true} [:vector [:ref :ft/Ambiguity]]]]

   :ft/RestartContext
   [:map
    [:previous-plan-id {:optional true} :string]
    [:failed-artifacts {:optional true} [:vector [:ref :ft/ArtifactRef]]]
    [:latest-review-id {:optional true} :string]
    [:latest-audit-id {:optional true} :string]
    [:review-feedback {:optional true} :string]
    [:restart-goal {:optional true} :string]]

   :ft/Plan
   [:map
    [:plan/id :string]
    [:job/id :string]
    [:plan/version [:int {:min 1}]]
    [:plan/mode [:ref :ft/Mode]]
    [:plan/created-by [:enum :planner-agent]]
    [:plan/objective :string]
    [:plan/tasks [:vector [:ref :ft/Task]]]
    [:plan/global-ambiguities {:optional true} [:vector [:ref :ft/Ambiguity]]]
    [:plan/restart-context {:optional true} [:ref :ft/RestartContext]]]

   :ft/Observation
   [:map
    [:observation/tool :keyword]
    [:observation/role [:ref :ft/Role]]
    [:observation/raw :any]
    [:observation/confidence {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:observation/difficulty {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:observation/derived-score {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:observation/ambiguity-adjustment {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:observation/hypothesis {:optional true} :string]
    [:observation/counterhypotheses {:optional true} [:vector :string]]
    [:observation/rationale {:optional true} :string]
    [:observation/provenance {:optional true} [:vector [:ref :ft/ArtifactRef]]]]

   :ft/Claim
   [:map
    [:claim/id :string]
    [:claim/domain [:ref :ft/Domain]]
    [:claim/target :keyword]
    [:claim/span [:ref :ft/Span]]
    [:claim/hypothesis :string]
    [:claim/observations [:vector [:ref :ft/Observation]]]
    [:claim/score {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:claim/disagreement {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:claim/ambiguity-impact {:optional true} [:double {:min 0.0 :max 1.0}]]
    [:claim/status [:enum :pending :scored :contested :accepted :rejected]]]

   :ft/Coverage
   [:map
    [:bars-total {:optional true} [:int {:min 1}]]
    [:bars-covered {:optional true} [:int {:min 0}]]
    [:claims-total {:optional true} [:int {:min 1}]]
    [:claims-covered {:optional true} [:int {:min 0}]]
    [:coverage-ratio {:optional true} [:double {:min 0.0 :max 1.0}]]]

   :ft/ArtifactBundle
   [:map
    [:bundle/id :string]
    [:job/id :string]
    [:bundle/mode [:ref :ft/Mode]]
    [:bundle/produced-by [:ref :ft/Role]]
    [:bundle/artifacts [:vector [:ref :ft/ArtifactRef]]]
    [:bundle/open-issues {:optional true} [:vector :string]]
    [:bundle/coverage {:optional true} [:ref :ft/Coverage]]]

   :ft/ReviewNote
   [:map
    [:note/id :string]
    [:note/domain [:ref :ft/Domain]]
    [:note/severity [:ref :ft/Severity]]
    [:note/span {:optional true} [:ref :ft/Span]]
    [:note/issue :string]
    [:note/required-action {:optional true} :string]
    [:note/preferred-hypothesis {:optional true} :string]]

   :ft/Review
   [:map
    [:review/id :string]
    [:job/id :string]
    [:review/by [:enum :qc-reviewer-agent :human-auditor]]
    [:review/verdict [:ref :ft/Verdict]]
    [:review/severity [:ref :ft/Severity]]
    [:review/notes [:vector [:ref :ft/ReviewNote]]]
    [:review/restart-from {:optional true} [:enum :planner :primary :adjudication :qc-review :human-audit]]]

   :ft/ReferenceEntry
   [:map
    [:reference/id :string]
    [:reference/source-audio [:ref :ft/ArtifactRef]]
    [:reference/accepted-bundle [:ref :ft/ArtifactBundle]]
    [:reference/reviews [:vector [:ref :ft/Review]]]
    [:reference/tags {:optional true} [:vector :string]]
    [:reference/languages {:optional true} [:vector :keyword]]
    [:reference/usable-for [:vector [:ref :ft/Mode]]]]

   :ft/ReferenceCatalog
   [:map
    [:catalog/id :string]
    [:catalog/version [:int {:min 1}]]
    [:catalog/entries [:vector [:ref :ft/ReferenceEntry]]]]

   :ft/EventType
   [:enum
    :job/created
    :plan/generated
    :task/dispatched
    :gemma-check/run
    :gemma-check/completed
    :artifacts/submitted
    :claims/scored
    :qc/accepted
    :qc/revise-requested
    :references/cataloged
    :composition/started
    :human-audit/accepted
    :human-audit/rejected
    :job/completed
    :job/failed]

   :ft/Event
   [:map
    [:event/id :string]
    [:job/id :string]
    [:event/type [:ref :ft/EventType]]
    [:event/at :inst]
    [:event/by [:ref :ft/Role]]
    [:event/payload [:map-of :keyword :any]]]

   :ft/Job
   [:map
    [:job/id :string]
    [:job/mode [:ref :ft/Mode]]
    [:job/state [:ref :ft/State]]
    [:job/objective :string]
    [:job/inputs [:vector [:ref :ft/ArtifactRef]]]
    [:job/plan {:optional true} [:ref :ft/Plan]]
    [:job/current-bundle {:optional true} [:ref :ft/ArtifactBundle]]
    [:job/current-claims {:optional true} [:vector [:ref :ft/Claim]]]
    [:job/reviews {:optional true} [:vector [:ref :ft/Review]]]
    [:job/reference-catalog {:optional true} [:ref :ft/ReferenceCatalog]]
    [:job/events {:optional true} [:vector [:ref :ft/Event]]]]

   :ft/HandoffKind
   [:enum
    :planner-assignment
    :primary-result
    :adjudication-report
    :qc-review
    :human-audit
    :reference-catalog-entry
    :restart-packet
    :final-release]

   :ft/HandoffPacket
   [:map
    [:schema/version :string]
    [:handoff/kind [:ref :ft/HandoffKind]]
    [:job/id :string]
    [:handoff/mode [:ref :ft/Mode]]
    [:handoff/role [:ref :ft/Role]]
    [:handoff/created-at :inst]
    [:handoff/payload [:map-of :keyword :any]]]

   :ft/Transition
   [:map
    [:from [:ref :ft/State]]
    [:event [:ref :ft/MachineEvent]]
    [:to [:ref :ft/State]]
    [:guard {:optional true} :keyword]
    [:action {:optional true} :keyword]]

   :ft/StateMachine
   [:map
    [:machine/id :keyword]
    [:machine/initial [:ref :ft/State]]
    [:machine/states [:vector [:ref :ft/State]]]
    [:machine/events [:vector [:ref :ft/MachineEvent]]]
    [:machine/transitions [:vector [:ref :ft/Transition]]]
    [:machine/guards {:optional true} [:map-of :keyword :keyword]]
    [:machine/actions {:optional true} [:map-of :keyword :keyword]]]

   :ft/MuSpec
   [:map
    [:mu/id :keyword]
    [:mu/title :string]
    [:mu/rule :string]
    [:mu/applies-to [:vector :keyword]]]})

(def malli-registry
  (mr/composite-registry
   m/default-registry
   registry))

(defn μ
  "Return the executable validator for a named Fork Tales pipeline schema."
  [schema-key]
  (m/validator [:ref schema-key] {:registry malli-registry}))

(def validate-job (μ :ft/Job))
(def validate-plan (μ :ft/Plan))
(def validate-claim (μ :ft/Claim))
(def validate-review (μ :ft/Review))
(def validate-handoff-packet (μ :ft/HandoffPacket))
(def validate-state-machine (μ :ft/StateMachine))

(def mu-specs
  [{:mu/id :mu-1
    :mu/title "Accepted bundle must be auditable"
    :mu/rule "Any accepted bundle includes provenance, source span coverage, and open-issues list."
    :mu/applies-to [:artifact-bundle :reference-entry :final-release]}

   {:mu/id :mu-2
    :mu/title "Revision must be actionable"
    :mu/rule "Any :revise verdict contains at least one note with :note/required-action."
    :mu/applies-to [:review]}

   {:mu/id :mu-3
    :mu/title "Composition uses approved references only"
    :mu/rule "Composition mode may only consume entries present in the accepted reference catalog."
    :mu/applies-to [:job :planner-assignment]}

   {:mu/id :mu-4
    :mu/title "Contested claims escalate"
    :mu/rule "If claim disagreement exceeds threshold and ambiguity severity is high, route to human audit."
    :mu/applies-to [:claim :ambiguity]}

   {:mu/id :mu-5
    :mu/title "Primary agent is mode-specialized"
    :mu/rule "In :scribe mode, primary agent role resolves to :transcriber; in :composition mode, to :producer."
    :mu/applies-to [:plan :task]}

   {:mu/id :mu-6
    :mu/title "Gemma Check is a tool, not final review"
    :mu/rule "Gemma Check may emit observations and recommended actions, but cannot transition a bundle to accepted."
    :mu/applies-to [:event :review :handoff]}

   {:mu/id :mu-7
    :mu/title "Prompt text does not override sung realization"
    :mu/rule "In scribe mode, lyrics-realized scoring prefers performed audio over original prompt text when they diverge."
    :mu/applies-to [:claim :adjudication-report]}

   {:mu/id :mu-8
    :mu/title "Rejected outputs preserve restart context"
    :mu/rule "Any restart carries prior plan, failed artifacts, latest review, and latest audit feedback."
    :mu/applies-to [:restart-context :planner-assignment]}

   {:mu/id :mu-9
    :mu/title "No silent acceptance"
    :mu/rule "A bundle cannot transition to accepted without adjudication output and review verdict."
    :mu/applies-to [:state-machine :review]}

   {:mu/id :mu-10
    :mu/title "Human rejection is structured"
    :mu/rule "Human auditor rejection must identify domain, span or section, severity, and issue text."
    :mu/applies-to [:review :human-audit]}

   {:mu/id :mu-11
    :mu/title "Reference catalog is append-only by version"
    :mu/rule "Accepted references are versioned; supersession creates a new catalog version rather than mutating history."
    :mu/applies-to [:reference-catalog]}])

(def pipeline-machine
  {:machine/id :fork-tales/music-pipeline
   :machine/initial :job-created
   :machine/states [:job-created
                    :planning
                    :scribe-executing
                    :scribe-gemma-checking
                    :scribe-adjudicating
                    :scribe-qc-review
                    :reference-cataloged
                    :composition-executing
                    :composition-gemma-checking
                    :composition-adjudicating
                    :composition-qc-review
                    :human-audit
                    :accepted
                    :rejected
                    :failed]
   :machine/events [:begin-plan
                    :plan-ready
                    :run-gemma-check
                    :gemma-check-complete
                    :submit-artifacts
                    :score-claims
                    :qc-accept
                    :qc-revise
                    :catalog-reference
                    :start-composition
                    :audit-accept
                    :audit-reject
                    :fail]
   :machine/transitions
   [{:from :job-created :event :begin-plan :to :planning}
    {:from :planning :event :plan-ready :to :scribe-executing :guard :scribe-mode?}
    {:from :scribe-executing :event :run-gemma-check :to :scribe-gemma-checking}
    {:from :scribe-gemma-checking :event :gemma-check-complete :to :scribe-executing}
    {:from :scribe-executing :event :submit-artifacts :to :scribe-adjudicating :guard :bundle-valid?}
    {:from :scribe-adjudicating :event :score-claims :to :scribe-qc-review :guard :claims-valid?}
    {:from :scribe-qc-review :event :qc-revise :to :planning :guard :review-actionable?}
    {:from :scribe-qc-review :event :qc-accept :to :reference-cataloged :guard :accepted-bundle-auditable?}
    {:from :reference-cataloged :event :start-composition :to :composition-executing :guard :has-approved-references?}
    {:from :planning :event :plan-ready :to :composition-executing :guard :composition-mode?}
    {:from :composition-executing :event :run-gemma-check :to :composition-gemma-checking}
    {:from :composition-gemma-checking :event :gemma-check-complete :to :composition-executing}
    {:from :composition-executing :event :submit-artifacts :to :composition-adjudicating :guard :bundle-valid?}
    {:from :composition-adjudicating :event :score-claims :to :composition-qc-review :guard :claims-valid?}
    {:from :composition-qc-review :event :qc-revise :to :planning :guard :review-actionable?}
    {:from :composition-qc-review :event :qc-accept :to :human-audit}
    {:from :human-audit :event :audit-reject :to :planning :guard :human-rejection-structured?}
    {:from :human-audit :event :audit-accept :to :accepted}
    {:from :job-created :event :fail :to :failed}
    {:from :planning :event :fail :to :failed}
    {:from :scribe-executing :event :fail :to :failed}
    {:from :scribe-gemma-checking :event :fail :to :failed}
    {:from :scribe-adjudicating :event :fail :to :failed}
    {:from :scribe-qc-review :event :fail :to :failed}
    {:from :reference-cataloged :event :fail :to :failed}
    {:from :composition-executing :event :fail :to :failed}
    {:from :composition-gemma-checking :event :fail :to :failed}
    {:from :composition-adjudicating :event :fail :to :failed}
    {:from :composition-qc-review :event :fail :to :failed}
    {:from :human-audit :event :fail :to :failed}]})
