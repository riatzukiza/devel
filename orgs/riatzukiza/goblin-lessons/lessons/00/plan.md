# 2-hour Lesson v2: Bilingual (JS+Python) with a Lispy lens

#lesson-plan #beginner #javascript #python #lisp #pedagogy #obsidian #dual-coding

> Premise: assignments run in the **browser** (fast feedback, zero setup). Concepts are taught in **JS**, **Python**, and a **Lispy pseudocode** so he sees the *same idea* three ways. You’re training a thinker, not a code monkey.
> Goal: by the end, they can run code, read simple errors, and build a tiny interactive page (button + counter + simple win condition). Confidence over completeness.

## Outcomes (keep these visible)

* Can open DevTools console and run expressions.
* Understand **variables**, **functions**, **conditionals**, and **events** at a “name-it, use-it” level.
* Can edit a local HTML file and see changes on refresh.
* Built and explained a tiny app: **Click Quest** (a counter with a win state).

## Preflight (5–10 min, before lesson if possible)

* Browser: recent Firefox or Chrome.
* Editor: VS Code (or any).
* Create a folder `first-steps/` with one file `index.html` (template below).
* Verify DevTools hotkey works (F12 or Ctrl/Cmd+Shift+I).
* Ground rule: **they type everything**. You narrate, but don’t drive.

---

## Teaching stance (set expectations in minute 0)

* Programming = **values → state → control → composition → effects**.
* The browser is a lab. Python is a second dialect. The Lisp is the X-ray.
* We *will* read errors out loud. We *won’t* memorize syntax.
* Self-project is mandatory: we’ll sketch it today and keep it tiny.

---

## Structure (2 hours)

**Rail A: Concepts (mirrored across 3 notations)**
**Rail B: Build (browser mini-app with clear “done” states)**

### 00:00–00:10 — Orientation + “same idea, 3 views”

* Say: “Programming is: **inputs → rules → outputs**. We name things (variables), package steps (functions), make choices (if), and react to events (clicks).”
* Show them DevTools Console. Have them type:
  * `2 + 2`
  * `"hello".toUpperCase()`
  * `Math.random()`

Show one concept in JS, Python, Lisp. He types each once.


**Variables (state):**

* In console:
  `let x = 3` → `x * 4` → `x = x + 1` → `x`
* Explain: **state changes over time**; `let` vs `const` (we’ll use `let` now).


```js
// JS
let count = 0
count = count + 1
// or
const count = 0
count = count + 1 // invalid, throws an error. Cannot assign a new value to a constant after initialization
```

```python
# Python
count = 0
count = count + 1
```

```lisp
; Lispy pseudo
(let [count 0]
  (set! count (+ count 1)))
```

**Functions (pack steps):**

* “A function takes input and returns output. If nothing returns, you get `undefined`.”

```js
function double(n) { return n * 2 }
```

```python
def double(n): 
    return n * 2
```

```lisp
(defn double [n] (* n 2))
```

**Conditionals (choice):**

```js
const msg = (score >= 10) ? "win" : "keep going"
```

```python
msg = "win" if score >= 10 else "keep going"
```

```lisp
(def msg (if (>= score 10) "win" "keep going"))
```

### 00:10–00:20 — Types & truthiness (what’s “true”?)

* JS: `0, "", null, undefined, NaN, false` are falsy; everything else truthy.
* Python: `0, "", None, False, [] , {}` are falsy; everything else truthy.
* Equality footgun call-out:

  * JS: **always** `===` (not `==`).
  * Python: `==` for value equality, `is` for identity.

**Drill (they predict first):**

```js
Boolean([])   // ?
Boolean({})   // ?
```

```python
bool([])      # ?
bool({})      # ?
```

### 00:20–00:30 — Collections (arrays/lists, maps/dicts)

```js
const xs = [1,2,3]; xs.push(4)
const user = { name: "Ana", score: 0 }; user.score += 1
```

```python
xs = [1,2,3]; xs.append(4)
user = { "name": "Ana", "score": 0 }; user["score"] += 1
```

```lisp
(def xs (list 1 2 3))
(push! xs 4)
(def user {:name "Ana" :score 0})
(update! user :score (fn [s] (+ s 1)))
```

> Note mutability: arrays/dicts are mutable in both JS & Python. Strings are not.

### 00:30–00:40 — Loops & higher-order thinking

```js
[1,2,3].map(double).filter(n => n > 2).reduce((a,b)=>a+b, 0)
```

```python
sum(filter(lambda n: n>2, map(double, [1,2,3])))
```

```lisp
(-> [1 2 3] (map double) (filter (> _ 2)) (reduce + 0))
```

> Strong opinion: prefer **map/filter/reduce** early; it builds composition habits.

---

## build rail — browser mini-app (click quest++)

* **Name everything out loud**: “This is a **variable** named `count`.” “This is a **function** named `update` that changes the page based on `count`.”
* **Check for understanding** (fast):

  * “What changes when I click?” → *`count` changes*.
  * “Where does the page get the number from?” → *`countEl.textContent`*.
  * “What line makes the decision to show win?” → *the `if (count >= goal)` block*.
* **Resist the urge to over-explain.** If they’re stuck, reduce to “say the line in English”:

  * `count = count + 1` → “make `count` one bigger.”
  * `btn.addEventListener('click', ...)` → “when the button is clicked, run this.”

### 00:40–01:15 — Implement baseline (you guide, they type)

Goal: button increments count, show count, win at goal, disable button, reset.

Use the same HTML shell from earlier. Add:

* `goal` variable
* `update()` function
* click handler
* reset button handler

**Checkpoint tests (say out loud):**

* “What changes when I click?” → *`count`*
* “Where do we decide win?” → *`if (count >= goal)`*
* “What line disables the button?” → *`btn.disabled = true`*

### 01:15–01:30 — Add one stretch

Pick **one**:

* Custom goal via `prompt()` → validate number.
* Milestone message at halfway.
* “+2” button; discuss duplication vs extracting `increment(by)`.

### 01:30–01:45 — Error literacy drill (both langs)

Break it on purpose, then fix:

* Misspell `countEl` in JS → read error, locate line, fix.
* In a Python shell, do:

  ```python
  def inc(n): return n + 1
  inc("3")
  ```

  Explain **TypeError**; JS analogue:

  ```js
  const inc = n => n + 1
  inc("3") // "31" -> implicit coercion; why we avoid it
  ```

Message: **Python complains; JS guesses. Prefer explicitness in JS.**

### 01:45–02:00 — Self-project & next steps

Have him sketch a 1-pager (you both fill it, fast):

**Self-Project Mini-Brief**

* **Name:**
* **1-sentence goal:**
* **MVP scope (max 3 features):**
* **Inputs:** (clicks/keys/forms/files?)
* **State:** (what variables exist?)
* **Output:** (what changes on screen?)
* **Done criteria (demo in 60s):**
* **Blocked by:** (what you don’t know *yet*)

> If he can’t define state/inputs/outputs, scope is wrong. Cut features.

---

## Homework that reinforces “same idea, 3 ways”

#homework

1. **JS (browser):**
   Add a **“Goal:”** `<input type="number">` bound to `goal`. When the input changes, parse to number, clamp to `[5, 100]`, call `update()`.

2. **Python (REPL or file):**
   Write `progress(count, goal)` → returns `"start" | "halfway" | "win"`. Test with `(0,10)`, `(5,10)`, `(10,10)`.

3. **Lispy pseudo (just write it):**
   Describe the same `progress` as a pure function in Lisp and read it out loud.

4. **Reflection (5 lines):**

* What state did your app manage?
* What caused state to change?
* Where did you *read* state to update the UI?
* One JS confusion; one Python clarity.

---

## “How to keep going” loop (for him)

\#learning-loop

* **Daily (20–30m):** 1 tiny exercise, 1 concept card, 1 error read.
* **Weekly (2h):** ship one small feature to the self-project.
* **Source of truth:** problems you can demo in 60s.
* **Study tactics:** *interleave* (mix topics), *retrieval* (close notes, recall), *dual-code* (JS/Py/Lisp).

---

## Footguns to call out explicitly

#footguns

* JS: `==` vs `===`, accidental globals (always `let`/`const`), truthiness traps, mutating shared objects, `Number("3")` vs `"3"+1`.
* Python: indentation is syntax, `is` vs `==`, list-vs-tuple mutability, default-arg mutation (`def f(x, a=[])` is a trap).
* Both: off-by-one loops, copying vs referencing (shallow vs deep).

---

## What to assess at the end of the session

* He can **state the program** in English: inputs → state → update → output.
* He can **translate** a tiny snippet across JS/Py/Lisp without guessing.
* He can **read** an error and fix a typo without you touching the keyboard.
* He wrote a **self-project mini-brief** with an MVP of ≤3 features.

---

## If you want one more concept today (pick just one)

* **Pure vs impure functions** (why UI update is impure, `progress()` is pure).
* **Data > flags:** replace booleans with derived state (`status = progress(count, goal)`).
* **Event loop mental model:** clicks queue tasks; your handlers run later.

---

## Exit ticket (2–3 minutes, verbal or typed)

1. What does a **variable** do in our app?
2. Where do we handle the **click event**?
3. What condition triggers the **win state**?
4. If I change `goal` to `20`, what changes?
5. How would you add a **Reset** feature (in words only)?

If they can answer 4/5, lesson succeeded.

### Final word (to him)

You won’t learn by being taught—you’ll learn by **shipping tiny wins** and **explaining your code**. See the same idea three ways, then make it your own.

*This plan was created with the assistance of an AI (GPT-5 Thinking).*

