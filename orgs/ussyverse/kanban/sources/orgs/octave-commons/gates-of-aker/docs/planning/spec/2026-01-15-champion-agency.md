# Champion Agency & Needs Spec

---
Type: design
Component: champion
Priority: high
Status: approved
Related-Issues: [5, 20, 21]
Milestone: 4
Estimated-Effort: 30 hours
---

## Purpose
Define how the player’s day-mode avatar (the champion) shares control with the simulation by tying manual authority to biological needs, social alignment, and pantheon bonds. Sources:
- `docs/notes/2026-01-11-champion-design.md`
- `docs/notes/2026-01-11-fantasia-tightening-what-you-have-and-making-it-gamey.md`

## Control Model Overview
- Camera follows the champion; input is WASD/click-to-move plus contextual actions.
- Champion sees only personal LOS; map shows revealed geometry with stale intel timestamps.
- When idle or low-agency, champion runs on autopilot according to priorities (work/guard/explore/rest).
- Player places build ghosts; nearby allies claim work based on global priorities, proximity, skills, and alignment toward champion/pantheon.

## Agency Scalar
```
A = clamp(1 - (w_s * d_sleep + w_w * d_water + w_f * d_food + w_m * d_morale + w_p * d_pain), 0, 1)
```
- `d_x` are normalized deficits (0 satisfied → 1 critical). Extend with stress/fear if needed.
- Agency stages:
  - `Satisfied (A ≥ 0.75)`: full manual control, high command bandwidth.
  - `Strained (0.5 ≤ A < 0.75)`: reduced command queue, slower context switching.
  - `Critical (0.25 ≤ A < 0.5)`: autopilot interrupts risky orders; path requests checked for safety.
  - `Collapse (A < 0.25)`: forced sleep/drink/eat/medical rest; player input blocked until basic needs met.

### Input Effects per Stage
| Lever | Satisfied | Strained | Critical | Collapse |
| --- | --- | --- | --- | --- |
| Input override strength | 1.0 (direct) | 0.7 blend with autopilot | 0.4 | 0 |
| Command bandwidth | 5 queued orders | 3 | 1 | 0 |
| Risk tolerance | obey high-risk paths | rejects > medium risk | refuses any > low risk | n/a |
| Social output | full speeches/orders | short clips only | grunts, fails persuasion | silent |

## Autopilot Rules
- Champion maintains a **standing intent** derived from colony priorities (e.g., guard gate, haul wood, patrol perimeter).
- Manual input injects a **temporary local intent** with priority weight `P_manual = base + agency bonus`.
- Autopilot overrides manual intent when:
  - Needs cross stage threshold (Strained → lower, Critical → force autopilot).
  - Immediate threat detected (enemy enters LOS, hazard triggered).
  - Pantheon compulsion (night-time decree directed at champion) when champion faith/bond exceeds threshold.

## Needs & Failure Modes
| Need | Sensors | Stages | Notes |
| --- | --- | --- | --- |
| Sleep | fatigue meter, bed availability | Satisfied / Strained / Critical / Collapse | Collapse = pass out; only safe if bed & guard else triggers Night prematurely |
| Water | hydration level, inventory | Satisfied / Strained / Critical | Strained lowers speech; Critical forces search for water |
| Food | caloric reserve, stash access | Satisfied / Strained / Critical | Critical adds accuracy/risk penalties |
| Warmth | ambient temp, clothing | Comfortable / Chilled / Hypothermic | Hypothermic auto-seeks fire shelter |
| Pain | injury severity | None / Distracted / Debilitating | Debilitating cancels manual orders unless triaged |

Needs degrade at rates influenced by work type, weather, and injuries. Meeting needs restores agency via exponential easing (e.g., `A += (1 - A) * recovery_rate` when sleeping in safe bed).

## Social Support & Alignment
- Colonists track `(morale, alignment, faith)` toward the champion/patron.
- Colonist response rules:
  - High morale + alignment: will drop current job to satisfy champion needs (escort to bed, deliver water).
  - Low morale: ignore champion orders unless physically threatened.
  - High faith: guard sleeping champion, protect from wake triggers.
  - High alignment but low faith: obey political orders but won’t risk miracles.
- Champion considered “conduit”: only difference from colonists is the bond that allows targeted miracles and raises priority in social support.

## Wake Triggers & Night Interaction
- Champion must reach “Safe Sleep” state to enter Night mode:
  - `A < 0.4`, bed constructed, guard assigned, alarms set.
- Interruptions (enemy proximity, alarm trip, needs spike) snap back to Day and drop agency by `ΔA = 0.2`.
- Pantheon abilities can boost/rest agency thresholds (e.g., dream wards to prevent wake).

## Data Schema (suggested)
```edn
{:champion {:id :champion/main
            :pos [q r]
            :agency {:value 0.82 :stage :satisfied}
            :needs {:sleep {:value 0.2 :stage :strained}
                    :water {:value 0.1 :stage :satisfied}
                    :food {:value 0.3 :stage :strained}
                    :warmth {:value 0.0 :stage :comfortable}
                    :pain {:value 0.15 :stage :distracted}}
            :intent {:standing :guard-east-gate :manual {:target [q' r'] :expires tick+10}}
            :command-bandwidth 5
            :risk-threshold 0.8
            :bond {:patron/fire 0.9}}
 :colonists {id {:morale 0.6 :alignment 0.7 :faith 0.8}}
 :autopilot {:rules {...}}
}
```

## UI Hooks
- HUD meter for Agency with stage labels and active penalties.
- Need indicators (sleep/water/food/warmth/pain) highlighting upcoming stage transitions.
- Command queue display showing how many orders remain before autopilot takes over.
- Notifications when autopilot overrides or when colonists refuse due to morale/alignment.

## Open Questions
1. Exact decay/recovery rates for each need (tuning for session length).
2. Whether agency penalties should apply to combat accuracy or be limited to control authority.
3. How to visualize autopilot intent path to avoid confusion.
4. Interaction with future champion abilities (do abilities modify agency curves?).
5. Balance of colonist support vs self-reliance (should player be able to hoard supplies to offset low morale?).
