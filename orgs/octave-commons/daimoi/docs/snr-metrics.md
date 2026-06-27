# Daimoi SNR Metrics

**Version**: 0.1.0 (Draft)
**Status**: Technical Specification
**Purpose**: Define non-arbitrary signal-to-noise ratio metrics for the Static Observer and noise-sensitive daimoi.

---

## Overview

This document defines the **Static Observer's measurement methodology** for distinguishing signal from noise in daemon populations. The key insight is that noise is not arbitrary—it is measured relative to density and field-following behavior.

The metrics below are designed for:
- Activation thresholds for noise-sensitive daemon classes
- SNR bands for entropy governance
- Field-following vs exploration behavior

---

## Core Concept: Non-Arbitrary Length Scale

Let total area/volume be A, count be N, and intensity be:

```
λ = N / A
```

Define **mean spacing**:

```
ℓ = 1 / √λ
```

Use ℓ as the canonical scale for "local neighborhood", bin sizes, kernel widths. This is the key "not arbitrary" move: all subsequent measurements are anchored to ℓ.

---

## Spatial Clumpiness Noise

### Option A: Fano Factor on ℓ-Bins

Partition space into bins with side length ≈ ℓ. Count daimoi per bin n_b.

```
Fano = Var(n_b) / E[n_b]
```

For a Poisson (random) distribution: **Fano ≈ 1**
- Clumping: **Fano > 1**
- Over-regular spacing: **Fano < 1**

Define spatial noise:

```
N_space = max(0, Fano - 1)
```

### Option B: Nearest-Neighbor Index (Clark-Evans)

Compute mean nearest-neighbor distance d̄_nn. Expected for Poisson:

```
d_pois = 1 / (2√λ)
R = d̄_nn / d_pois
```

- Clumping: R < 1
- Regular: R > 1

Define:

```
N_space = max(0, (1/R) - 1)
```

**Recommendation**: Use Option A for stability and speed. Use Option B for "shape" sensitivity.

---

## Field-Following Signal vs Motion Noise

At each daimon i:

- Position: x_i
- Velocity: v_i
- Field vector: F(x_i) with unit direction f̂_i = F(x_i) / (|F(x_i)| + ε)

### Alignment (Signal)

```
A_i = f̂_i · v̂_i = cos(angle between field and motion)
```

Average alignment:

```
S_alignment = mean(A_i) over all daimoi
```

This measures how well daimoi follow the semantic field. High alignment = high signal.

### Motion Noise

Variance in alignment:

```
N_motion = Var(A_i)
```

Or compute deviation from field-following:

```
D_i = |v_i| - |proj(v_i onto F)| = |v_i| × sin(angle)
N_motion = mean(D_i²)
```

---

## Combined SNR Metric

Define overall SNR:

```
SNR = S_alignment / (1 + N_space + N_motion)
```

Where:
- S_alignment ∈ [0, 1] (signal)
- N_space ≥ 0 (clumping penalty)
- N_motion ≥ 0 (deviation penalty)

Higher SNR = better field-following, less clumping.

---

## Entropy Band Governance

The Static Observer uses SNR bands to govern daemon behavior:

| Band | SNR Range | Behavior |
|------|-----------|----------|
| **Quiet** | SNR > 0.8 | Daimoi explore freely, variance injection |
| **Normal** | 0.5 < SNR ≤ 0.8 | Standard field-following |
| **Noisy** | 0.3 < SNR ≤ 0.5 | Daimoi clamp to field-lines, reduced exploration |
| **Critical** | SNR ≤ 0.3 | Emergency stabilization, mass redistribution |

### Band Transitions

The Static Observer regulates transitions between bands:

1. If entering Noisy: Increase field-following weight in daimoi policy
2. If entering Critical: Trigger redistribution, spawn exploration missions
3. If entering Quiet: Allow variance injection, reward exploration

---

## Daemon Class: Noise-Sensitive (Static Choir)

These daimoi are "substantially more influenced by noise" in one specific sense:

**They are activated by density anomalies, not by semantic intent.**

### Activation Rule

```
activate(daimon, SNR, density) =
  if density_anomaly(daimon.position, ℓ) > threshold_ρ:
    if SNR < SNR_critical:
      mode = "exploration"  # Inject variance
    else:
      mode = "adherence"    # Follow field lines
  else:
    dormant
```

### Mass Redistribution

When daimoi clump (high N_space), the Static Observer sets conditions for them to **self-select** into either:

1. **Exploration mode**: Variance injection, spread out
2. **Adherence mode**: Field-following, conform to semantic lines

---

## Measurement Protocol

### Step 1: Compute Density

```
λ = count(daimoi) / area
ℓ = 1 / √λ
```

### Step 2: Spatial Noise

Bin the space, compute Fano factor:

```
bins = partition_space(binsize=ℓ)
counts = [count_in_bin(b) for b in bins]
Fano = variance(counts) / mean(counts)
N_space = max(0, Fano - 1)
```

### Step 3: Field-Following Signal

For each daimon, compute alignment:

```
alignments = [dot(field_direction(d.position), normalize(d.velocity))
              for d in daimoi]
S_alignment = mean(alignments)
N_motion = variance(alignments)
```

### Step 4: Combined SNR

```
SNR = S_alignment / (1 + N_space + N_motion)
```

### Step 5: Band Assignment

```
if SNR > 0.8: band = "quiet"
elif SNR > 0.5: band = "normal"
elif SNR > 0.3: band = "noisy"
else: band = "critical"
```

---

## Implementation Sketch

```typescript
interface Daimon {
  position: Vector2D;
  velocity: Vector2D;
}

interface Field {
  directionAt(pos: Vector2D): Vector2D;
}

function computeSNR(daimoi: Daimon[], field: Field, area: number): number {
  // Step 1: Density
  const lambda = daimoi.length / area;
  const ell = 1 / Math.sqrt(lambda);
  
  // Step 2: Spatial noise
  const bins = partitionSpace(daimoi, ell);
  const counts = bins.map(b => b.length);
  const fano = variance(counts) / mean(counts);
  const N_space = Math.max(0, fano - 1);
  
  // Step 3: Field-following
  const alignments = daimoi.map(d => {
    const fieldDir = field.directionAt(d.position).normalize();
    const velDir = d.velocity.normalize();
    return fieldDir.dot(velDir);
  });
  const S_alignment = mean(alignments);
  const N_motion = variance(alignments);
  
  // Step 4: Combined SNR
  return S_alignment / (1 + N_space + N_motion);
}

function assignBand(snr: number): Band {
  if (snr > 0.8) return "quiet";
  if (snr > 0.5) return "normal";
  if (snr > 0.3) return "noisy";
  return "critical";
}
```

---

## References

- `research/snr-metrics-static-observer.md` - Original specification
- `research/static-observer-stabilization-pack.md` - World lore and daemon class design
- `orgs/octave-commons/graph-runtime/SPEC.md` - Underlying runtime model
