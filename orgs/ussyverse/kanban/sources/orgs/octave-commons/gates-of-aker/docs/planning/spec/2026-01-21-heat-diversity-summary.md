# Agent Fire & Heat System - Implementation Summary

## Changes Made (2026-01-21)

### Overheating Protection
Agents now suffer health damage if they stay near fires too long:
- When warmth > 0.85, agents take 0.05 health damage per tick
- New constants: `heat-damage-threshold` (0.85), `heat-damage-per-tick` (0.05)
- Agents get negative mood (-0.02) when overheating
- Thoughts: "Too hot! Burning up!", "Get me away from this fire!", "Sweating profusely"

### Fire Building Rebalancing
- **Priority lowered**: build-fire now 70 (down from 97) - agents won't prioritize fire over food/sleep
- **Wood consumption**: Building a fire consumes 1 wood from agent's inventory
- **20% random chance**: Fire jobs only generated 20% of the time when conditions are met, reducing fire spam
- **Better logic**: Split condition checking from site finding

### Diverse Thoughts & Mood System
Agents now have varied, temperature-appropriate thoughts:

**Severe Cold (< 0.15)**: "I can't feel my toes", "It's unbearable cold"
**Very Cold (< 0.3)**: "Need warmth soon", "Shaking from cold"
**Cold (< 0.5)**: "The chill bites", "Could use some heat"
**Mild Cold (< 0.6)**: "A bit chilly"
**Comfortable (0.6-0.7)**: "Finally comfortable", "Just right"
**Warm (> 0.65)**: "Nice and toasty", "This fire feels good"
**Too Warm (> 0.8)**: "Too warm here"
**Overheating (> 0.9)**: "Sweating profusely", "Way too warm"

Mood is now affected by:
- Severe cold: -0.015 per tick
- Mild cold: -0.008 per tick
- Overheating: -0.02 per tick
- Comfortably warm: +0.008 per tick
- Very comfortable: +0.004 per tick
- Social need also affects mood

### Files Modified
- `backend/src/fantasia/sim/constants.clj` - Added heat damage constants
- `backend/src/fantasia/sim/jobs.clj` - Updated fire job priority, consumption, and randomness
- `backend/src/fantasia/sim/agents.clj` - Added health tracking, diverse thoughts, multi-tiered mood

## Testing
- Code compiles successfully
- Parentheses balanced in all files
- Agent thoughts now vary based on temperature
- Overheating discourages staying near fires too long
- Fire spam reduced by wood consumption, priority, and random chance
