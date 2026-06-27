import type { RGBA } from "./types.js";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** FNV-1a (32-bit) for stable colors/phase. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hh = ((h % 1) + 1) % 1;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hh * 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m];
}

export function colorFromId(id: string, alpha = 0.92): RGBA {
  const h = (hashString(id) % 360) / 360;
  const [r, g, b] = hslToRgb(h, 0.62, 0.56);
  return [r, g, b, alpha];
}

export function rgba(r: number, g: number, b: number, a: number): RGBA {
  return [r, g, b, a];
}
