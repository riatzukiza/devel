export default {
  files: ["src/**/*.test.ts"],
  timeout: "2m",
  workerThreads: false,
  nodeArguments: ["--import=tsx"],
};
