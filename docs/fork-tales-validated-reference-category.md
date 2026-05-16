# Validated Reference Category for Fork Tales

This document gives the formal/category-theoretic view of the Fork Tales audio pipeline. It is intentionally domain-general: music is one instance of a broader **Validated Reference → Guided Production** workflow.

## Music Workflow Category

Let \(\mathcal{M}\) be a category whose objects are typed music-work states:

\[
\operatorname{Ob}(\mathcal{M}) = \{I,J,P_s,P_c,S,A_s,R,G,A_c,H,F,\bot\}.
\]

Read them as:

\[
\begin{aligned}
I &:= \text{scribe inputs: source audio, lyric prompt, style prompt, metadata},\\
J &:= \text{composition brief: new prompt and instructions},\\
P_s &:= \text{scribe plan},\\
P_c &:= \text{composition plan},\\
S &:= \text{scribed artifacts},\\
A_s &:= \text{adjudicated scribe bundle},\\
R &:= \text{approved reference catalog},\\
G &:= \text{generated composition bundle},\\
A_c &:= \text{adjudicated composition bundle},\\
H &:= \text{human-audit candidate},\\
F &:= \text{final release},\\
\bot &:= \text{failed or abandoned job}.
\end{aligned}
\]

The identity morphism \(1_X : X \to X\) retains a state without transformation. Composition \(g \circ f\) means run \(f\), then run \(g\), preserving provenance.

## Generating Morphisms

\[
\begin{aligned}
\pi_s &: I \to P_s && \text{Planner creates a scribe plan},\\
\tau &: P_s \times I \to S && \text{Primary Agent acts as Transcriber},\\
\lambda_s &: S \to S && \text{Gemma Check/local lint on scribed artifacts},\\
\alpha_s &: S \to A_s && \text{adjudication of scribe outputs},\\
\rho_s &: A_s \to P_s && \text{QC restart of the scribe loop},\\
\kappa &: A_s \to R && \text{accepted scribe result enters the reference catalog},\\[4pt]
\pi_c &: J \times R \to P_c && \text{Planner creates a composition plan},\\
\gamma &: P_c \times R \to G && \text{Primary Agent acts as Producer},\\
\lambda_c &: G \to G && \text{Gemma Check/local lint on generated artifacts},\\
\alpha_c &: G \to A_c && \text{adjudication of composition outputs},\\
\rho_c &: A_c \to P_c && \text{QC restart of the composition loop},\\
\eta &: A_c \to H && \text{send accepted AI result to human audit},\\
\rho_h &: H \to P_c && \text{human rejection restarts the composition loop},\\
\omega &: H \to F && \text{human approval yields final release}.
\end{aligned}
\]

Gemma Check appears as \(\lambda_s\) and \(\lambda_c\): an internal pre-review morphism available to the Primary Agent. It is analogous to lint/typecheck/unit-test. It may produce evidence and restart pressure inside Primary execution, but it is not the QC acceptance morphism.

Hard failure is modeled by collapse morphisms:

\[
\chi_X : X \to \bot
\qquad
X \in \operatorname{Ob}(\mathcal{M}) \setminus \{F,\bot\}.
\]

## Main Composites

The scribe loop is:

\[
\Sigma = \kappa \circ \alpha_s \circ \lambda_s \circ \tau \circ \langle \pi_s,1_I\rangle : I \to R.
\]

Here \(\langle \pi_s,1_I\rangle : I \to P_s \times I\) pairs the generated plan with the unchanged source input.

The composition loop is:

\[
\Gamma = \omega \circ \eta \circ \alpha_c \circ \lambda_c \circ \gamma \circ \langle \pi_c,\pi_R\rangle : J \times R \to F.
\]

The first loop constructs \(R\), and the second loop consumes \(R\). That is the structural link: **reverse engineering builds the validated reference object that guided production is allowed to use**.

## Commutative-Style Factorization

```text
I --<pi_s,1_I>--> P_s × I --tau--> S --lambda_s--> S --alpha_s--> A_s --kappa--> R
                                                                                  |
                                                                                  v
J × R --<pi_c,pi_R>--> P_c × R --gamma--> G --lambda_c--> G --alpha_c--> A_c --eta--> H --omega--> F
```

The top row constructs approved symbolic references from existing audio. The bottom row consumes those references to produce new music. The vertical dependence on \(R\) is the structural coupling between the two loops.

## μ as Admissibility

The μ contracts define subobjects on which certain morphisms are allowed to act.

For example, let

\[
\iota_{\mathrm{aud}} : U_{\mathrm{aud}} \hookrightarrow A_s
\]

be the subobject of adjudicated scribe bundles satisfying provenance, coverage, and unresolved-issue requirements. Cataloging factors through it:

\[
U_{\mathrm{aud}} \xrightarrow{\kappa} R.
\]

Similarly:

\[
\rho_s : U_{\mathrm{rev},s} \to P_s,
\qquad
\rho_c : U_{\mathrm{rev},c} \to P_c,
\qquad
\rho_h : U_{\mathrm{rej},h} \to P_c,
\qquad
\omega : U_{\mathrm{acc},h} \to F.
\]

This is the categorical version of state-machine guards.

## State Machine Bridge

The control-flow graph is a quiver, and the workflow category is the free category on that quiver modulo the μ admissibility relations:

\[
\mathcal{M} \cong \operatorname{Free}(Q) / {\sim_{\mu}}.
\]

Nodes are states, arrows are primitive transitions, paths are workflows, and μ contracts rule out invalid or inadmissible paths.

## Abstract Validated-Reference Category

Define a domain-neutral category \(\mathcal{V}\) with objects:

\[
X,P_x,D,A_d,C,B,P_b,Y,A_y,U,Z.
\]

Read them as:

\[
\begin{aligned}
X &:= \text{raw source evidence},\\
P_x &:= \text{extraction plan},\\
D &:= \text{derived representation},\\
A_d &:= \text{adjudicated derived representation},\\
C &:= \text{approved catalog},\\
B &:= \text{new brief},\\
P_b &:= \text{production plan},\\
Y &:= \text{generated artifact},\\
A_y &:= \text{adjudicated generated artifact},\\
U &:= \text{external audit candidate},\\
Z &:= \text{released artifact}.
\end{aligned}
\]

Core morphisms:

\[
\epsilon : X \to P_x,
\quad
\delta : P_x \times X \to D,
\quad
\lambda_x : D \to D,
\quad
\alpha : D \to A_d,
\quad
\kappa : A_d \to C,
\]

and

\[
\beta : B \times C \to P_b,
\quad
\gamma : P_b \times C \to Y,
\quad
\lambda_y : Y \to Y,
\quad
\psi : Y \to A_y,
\quad
\eta : A_y \to U,
\quad
\omega : U \to Z.
\]

## Functors Into the Abstract Category

A music abstraction functor

\[
M : \mathcal{M} \to \mathcal{V}
\]

maps:

\[
\begin{aligned}
M(I)&=X,& M(P_s)&=P_x,& M(S)&=D,& M(A_s)&=A_d,& M(R)&=C,\\
M(J)&=B,& M(P_c)&=P_b,& M(G)&=Y,& M(A_c)&=A_y,& M(H)&=U,& M(F)&=Z.
\end{aligned}
\]

A software modernization functor

\[
S : \mathcal{S} \to \mathcal{V}
\]

maps legacy inputs, reverse-engineering plans, derived specs, approved spec catalogs, implementation plans, generated systems, and released systems to the same abstract objects. Thus music reconstruction and legacy software rescue share the same validated-reference workflow shape.

## Natural Transformations as Policy Variation

Let

\[
F,G : \mathcal{M} \to \mathcal{V}
\]

be two policy functors over the same workflow graph, for example strict and lenient adjudication regimes. A natural transformation

\[
\theta : F \Rightarrow G
\]

is a family of morphisms

\[
\theta_X : F(X) \to G(X)
\]

such that for every workflow morphism \(f:X\to Y\):

\[
G(f) \circ \theta_X = \theta_Y \circ F(f).
\]

In this system, \(\theta\) is a policy adapter. For example, \(\theta_{A_s}\) can weaken pronunciation penalties for mixed-language or kanji-reading ambiguity while preserving the workflow's compositional structure.

A paper-ready slogan:

\[
\textbf{Pipeline} = \text{Category of typed music-work states with guarded restart morphisms.}
\]

A domain-neutral slogan:

\[
\textbf{Validated Reference} \to \textbf{Guided Production}
\]

with review-sensitive restart morphisms.
