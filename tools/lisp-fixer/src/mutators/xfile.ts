// GPL-3.0-only
import { Mutator } from "./common.js";

// marker for cross-file rename in dataset meta; actual FS move done in driver
export const rename_defsymbol_hint: Mutator = (code) =>
  code.replace(/\(def(\w*)\s+([^\s)]+)/, ";; RENAME: $2 -> $2_v2\n(def$1 $2");