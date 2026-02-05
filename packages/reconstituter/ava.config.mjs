import base from "../../config/ava.config.mjs";

export default {
  ...base,
  files: [
    "dist/**/*.test.js",
  ],
  nodeArguments: [
    "--no-warnings",
  ],
};
