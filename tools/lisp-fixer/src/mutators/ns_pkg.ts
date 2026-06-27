// GPL-3.0-only
import { Mutator } from "./common.js";

export const clj_drop_ns_require: Mutator = (code) =>
  code.replace(/\(ns\s+([^\s)]+)\s+(:require\s+\[[^\]]+\])/, "(ns $1");

export const cl_incorrect_package: Mutator = (code) =>
  code.replace(/\(in-package\s+:[^\)]+\)/, "(in-package :wrong.pkg)");

export const elisp_wrong_provide: Mutator = (code) =>
  code.replace(/\(provide\s+'[^\)]+\)/, "(provide 'wrong-feature)");