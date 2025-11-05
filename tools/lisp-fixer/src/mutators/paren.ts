// GPL-3.0-only
import { Mutator, randomIndex, replaceAt } from "./common.js";

export const dropRandomCloseParen: Mutator = (code) => {
const i = randomIndex(code, c => c === ')');
return i == null ? code : replaceAt(code, i, '');
};

export const duplicateRandomCloseParen: Mutator = (code) => {
  const i = randomIndex(code, c => c === ')');
  return i == null ? code : code.slice(0, i + 1) + ')' + code.slice(i + 1);
};

export const flipQuote: Mutator = (code) => {
  const i = randomIndex(code, c => c === "'" || c === "`");
  if (i == null) return code;
  const c = code[i] === "'" ? "`" : "'";
  return replaceAt(code, i, c);
};

export const strayReader: Mutator = (code) => {
  // insert a stray # or , at a random paren boundary (simple but effective)
  const i = randomIndex(code, c => c === '(' || c === ')');
  return i == null ? code : code.slice(0, i) + (Math.random() < 0.5 ? "#" : ",") + code.slice(i);
};