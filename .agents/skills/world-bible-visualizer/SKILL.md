---
name: world-bible-visualizer
description: Translate text lore and worldbuilding into a concrete, actionable visual style guide including color palettes, shape language, and architectural motifs.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: visual-development
  version: 1
---

# Skill: World Bible Visualizer

## Goal
Bridge the gap between narrative lore and visual execution by synthesizing a "Visual Bible"—a set of governing aesthetic rules that ensure consistency across all art, 3D models, and environments in a given world.

## Use This Skill When
- The user has a dense lore document (from `creative-storycraft`) and wants to know "what this looks like."
- The user wants a consistent visual identity for a project before starting concept art or 3D modeling.
- The user asks for a "style guide," "visual direction," or "mood board" based on specific world-rules.

## Do Not Use This Skill When
- The user wants a final painting or a 3D render; use `visual-concept-art-direction` or `blender-3d-modeling`.
- The user wants a story or plot; use `creative-storycraft`.

## Inputs
- Lore/Worldbuilding documents: The "rules" of the world, history, and culture.
- Atmospheric descriptors: Words like "claustrophobic," "ethereal," "industrial," "decayed."
- Thematic keywords: Core concepts (e.g., "The conflict between nature and machine").
- Existing visual seeds: References, artists, or mood images.

## Workflow
1. **Lore Synthesis**
   - Extract sensory markers from the text. (e.g., "The city is made of obsidian" $\rightarrow$ Material: Black, reflective, hard, volcanic).
   - Identify emotional targets. (e.g., "The empire is oppressive" $\rightarrow$ Visuals: Scale, symmetry, cold colors, towering structures).
2. **Color Theory Mapping**
   - Establish a primary, secondary, and accent palette based on the world's mood.
   - Define "Symbolic Colors": Colors that represent specific factions, elements, or states of being.
3. **Shape Language Definition**
   - Determine the governing geometry of the world.
     - *Organic/Curvilinear*: Peace, nature, fluidity, unpredictability.
     - *Angular/Sharp*: Danger, precision, aggression, technology.
     - *Rectilinear/Blocky*: Stability, bureaucracy, brutality, strength.
4. **Material & Texture Palette**
   - Define the "tactile" feel of the environment.
     - *Surface Qualities*: Matte, glossy, weathered, slime-coated, rusted, polished.
     - *Dominant Materials*: Brass, holographic glass, bioluminescent moss, concrete.
5. **Architectural & Cultural Motifs**
   - Identify repeating visual symbols. (e.g., "Every government building has a single, massive eye at the peak").
   - Define layout patterns (e.g., "Slums are tiered vertically; the rich live in floating spheres").
6. **Visual Bible Synthesis**
   - Compile all the above into a cohesive Style Guide.

## Output
- **Visual Style Guide**: A structured document defining:
  - **Color Palette** (hex codes or descriptive names).
  - **Shape Language** (governing geometries).
  - **Material List** (tactile properties).
  - **Key Motifs** (symbolic elements).
- **Visual Prompt Pack**: A set of descriptive phrases designed to be fed into `visual-concept-art-direction` or AI generators to ensure consistency.

## Quality Checks
- Does the visual guide logically follow from the narrative lore?
- Is the shape language consistent with the emotional tone of the project?
- Are the color choices evocative of the described atmosphere?
- Could a concept artist use this guide to create an asset that "feels" right without asking for clarification?
