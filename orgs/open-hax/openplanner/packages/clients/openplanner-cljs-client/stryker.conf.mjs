/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "pnpm",
  testRunner: "command",
  commandRunner: {
    command: "node --enable-source-maps target/test.cjs",
  },
  coverageAnalysis: "off",
  mutate: [
    ".shadow-cljs/builds/test/dev/out/cljs-runtime/promethean.openplanner.client.js:352:29-354:2",
  ],
  reporters: ["clear-text", "json", "html"],
  htmlReporter: { fileName: "coverage/stryker.html" },
  jsonReporter: { fileName: "coverage/stryker.json" },
  thresholds: {
    break: 60,
    high: 80,
    low: 70,
  },
  timeoutMS: 60000,
};

export default config;
