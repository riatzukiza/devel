---
title: "Direction Statement — Framework Scope"
date: "2026-01-31T01:31:04"
tags: [experimental-design, scope, research-direction]
summary: "Defines the research as a safety-availability-cost evaluation framework, not just a classifier. Plan: translate prompts to 20 languages, create mixed-language prompts, split train/eval, evaluate baseline models."
---

A safety–availability–cost evaluation framework, primarily. We are evaluating existing techniques against novel modes of attack.
I would like to *try* to make a better model, but that isn't the focus.
I will make 1 new model and train it on these datasets.

We will translate all prompts from all databases into the top... 20 most spoken languages in the world.
Then we create a set of mixed language prompts using those translations

We split the dataset into training/evaluation
And we evaluate all models against this, and we train our model on the training set.
