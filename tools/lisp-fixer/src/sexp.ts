// GPL-3.0-only
export type Balance = { ok: boolean; missingOpen: number; missingClose: number; error?: string };

export function balanceParens(s: string): Balance {
  let depth = 0;
  let i = 0;
  let maxDepth = 0;
  
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\') i++;
        i++;
      }
      if (i < s.length) i++; // Skip closing quote
    } else if (c === ';') {
      while (i < s.length && s[i] !== '\n') i++;
      if (i < s.length) i++; // Skip newline
    } else if (c === '(') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      i++;
    } else if (c === ')') {
      depth--;
      if (depth < 0) {
        return { ok: false, missingOpen: 0, missingClose: 0, error: `Unbalanced closing parenthesis at position ${i}` };
      }
      i++;
    } else {
      i++;
    }
  }
  
  return { ok: depth === 0, missingOpen: 0, missingClose: depth };
}

export function autoCloseParens(s: string): string {
  const { missingClose, error } = balanceParens(s);
  if (error) {
    // Don't auto-fix unbalanced closing parens
    return s;
  }
  return missingClose > 0 ? s + ')'.repeat(missingClose) : s;
}