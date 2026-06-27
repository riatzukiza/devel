// GPL-3.0-only
import { Mutator } from "./common.js";

export const macro_to_fn: Mutator = (code) =>
  code.replace(/\(defmacro\s+([^\s)]+)/, "(defun $1"); // crude, but great negative

export const quote_level_off: Mutator = (code) =>
  code.replace(/`(\([^)]+\))/, "'$1");