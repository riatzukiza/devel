## How I teachh

* Programming = **values → state → control → composition → effects**.
* The browser is a lab. Python is a second dialect. The Lisp is the X-ray.
* We *will* read errors out loud. We *won’t* memorize syntax.
* Self-project is mandatory: we’ll sketch it today and keep it tiny.

---

## Structure (2 hours)

**Rail A: Concepts (mirrored across 3 notations)**
**Rail B: Build (browser mini-app with clear “done” states)**

---

**Variables (state):**

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
---

**Functions (pack steps):**

```js
function double(n)  {  
	return n * 2  
}// function keyword statement
const double = function(n) { return n * 2 } // function keyword expression/assignment (functions are just variables that "do" somthing.)
const  double = (n)=> { return n * 2 }// arrow function explicit return
const  double = (n)=>   n * 2 // arrow function implicit return

double(5) // 10
double(10) // 20
double(20) // 40

```

```python
def double(n): 
    return n * 2

double(5) # 10
double(10) # 20
double(20) # 40
```

We aren't actually going to run any of this.
Lisp is more like a syntax, that you can evaluate if you build a tool that understands it
Some programming languages use a syntax like this.

It's structure lends it's self nicely to treating code like you would treat math, and "expanding" each part into it's constituant parts.
And like math, while it does have an "official" syntax, that if you were to pbulish a paper (IE write an actual program to do something in lisp)
You'd want to follow it.

But when you're writing it down on paper, you do the parts that help you understand the problem
```lisp
(defn double [n] (* n 2)) ;; In lisp,all functions return implicitly the value of their last expression
```

---

**Conditionals (choice):**

```js
const msg = (score >= 10) ? "win" : "keep going"
let msg;
if(score >= 10) {
	msg = "win"
} else {
	msg = "keep going"
}

if(score >= 10) {
	msg = "win"
}                  
						 else {
	msg = "keep going"
}

if(score >= 10)  msg = "win"
else  msg = "keep going"


```

```python
msg = "win" if score >= 10 else "keep going"
if score == 10: msg = "win"
else: msg = "keep going" 
```

```python
msg = "win" if score >= 10 else "keep going"
if score == 10: msg = "win"
else: msg = "keep going" 
```

```lisp
(setv msg (if (>= score 10) "win" "keep going"))

```

---
### Types & truthiness (what’s “true”?)

```js
if(false || "" || undefined || null || 0) {
	console.log("this won't print")
} else if (false &&  "" && undefined && null && 0) {
	console.log("Still not true")
} else if(false && true)  {
	console.log("still not true)
}
else {
	console.log("all of the above was false")
}
```

```python
a = False
b = True
c = False and True # false
print(c) # Prints "False"

if False or "" None or [] or {}:
	print("this won't print")
else if False and "" and None and [] and {}:
	print("still not true")
else if False and True:
	print("still not true")
else if a and b:
	print("nope")
else:
	print("all of the above was false")

```
* JS: `0, "", null, undefined, NaN, false` are falsy; everything else truthy.
* Python: `0, "", None, False, [] , {}` are falsy; everything else truthy.
* Equality footgun call-out:
  * JS: **always** `===` (not `==`).
  * Python: `==` for value equality, `is` for identity.

---
## Is it true?

```js
Boolean([])   // ?
Boolean({})   // ?
```

```python
bool([])      # ?
bool({})      # ?
print({} is False) # False
print(False is False) # True
print(bool({}) is False) # True
print({} == False) # True
x = 1
y = False
a = "string"
z = {"foobar":"bazzle", "bingus":5}

b = {}
print(bool(b)) # False
b["foobar"] = "taco" 

print(b) # {"foobar":"taco"}
print(b["foobar"]) # "taco"

print(bool(b)) # True

#..............

```

---
### Collections (arrays/lists, maps/dicts)

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

---
### Loops & higher-order thinking

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

## Build Rail — Browser mini-app (Click Quest++)

;Goal: button increments count, show count, win at goal, disable button, reset.
### Implement baseline


* `goal` variable
* `update()` function
* click handler
* reset button handler

**Checkpoint tests (say out loud):**

* “What changes when I click?” → *`count`*
* “Where do we decide win?” → *`if (count >= goal)`*
* “What line disables the button?” → *`btn.disabled = true`*

---
### Add one stretch

Pick **one**:

* Custom goal via `prompt()` → validate number.
* Milestone message at halfway.
* “+2” button; discuss duplication vs extracting `increment(by)`.

### Error literacy drill (both langs)

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

### Self-project & next steps

sketch a 1-pager:

**Self-Project Mini-Brief**

* **Name:**
* **1-sentence goal:**
* **MVP scope (max 3 features):**
* **Inputs:** (clicks/keys/forms/files?)
* **State:** (what variables exist?)
* **Output:** (what changes on screen?)
* **Done criteria (demo in 60s):**
* **Blocked by:** (what you don’t know *yet*)

> If you can’t define state/inputs/outputs, scope is wrong. Cut features.

---

## Homework that reinforces “same idea, 3 ways”

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

## “How to keep going” loop

* **Daily (20–30m):** 1 tiny exercise, 1 concept card, 1 error read.
* **Weekly (2h):** ship one small feature to the self-project.
* **Source of truth:** problems you can demo in 60s.
* **Study tactics:** *interleave* (mix topics), *retrieval* (close notes, recall), *dual-code* (JS/Py/Lisp).

---

## Footguns

* JS: `==` vs `===`, accidental globals (always `let`/`const`), truthiness traps, mutating shared objects, `Number("3")` vs `"3"+1`.
* Python: indentation is syntax, `is` vs `==`, list-vs-tuple mutability, default-arg mutation (`def f(x, a=[])` is a trap).
* Both: off-by-one loops, copying vs referencing (shallow vs deep).

---

## If you want one more concept today (pick just one)

* **Pure vs impure functions** (why UI update is impure, `progress()` is pure).
* **Data > flags:** replace booleans with derived state (`status = progress(count, goal)`).
* **Event loop mental model:** clicks queue tasks; your handlers run later.
