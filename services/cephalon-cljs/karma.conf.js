module.exports = function configKarma(config) {
  config.set({
    basePath: "",
    frameworks: ["cljs-test"],
    files: ["out/test.js"],
    browsers: ["ChromeHeadless"],
    singleRun: true,
    plugins: [
      "karma-cljs-test",
      "karma-chrome-launcher",
      "karma-coverage",
      "karma-sourcemap-loader",
    ],
    preprocessors: {
      "out/test.js": ["coverage", "sourcemap"],
    },
    reporters: ["progress", "coverage"],
    coverageReporter: {
      dir: "coverage",
      reporters: [
        { type: "text-summary" },
        { type: "lcovonly", file: "lcov.info" },
      ],
    },
    client: {
      captureConsole: true,
    },
  });
};
