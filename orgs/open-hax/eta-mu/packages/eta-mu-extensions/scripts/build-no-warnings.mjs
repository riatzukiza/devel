#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const child = spawn(process.execPath, ["scripts/build.mjs", ...args], {
  cwd: new URL("..", import.meta.url),
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";
const capture = (chunk, stream) => {
  const text = chunk.toString();
  output += text;
  stream.write(text);
};

child.stdout.on("data", (chunk) => capture(chunk, process.stdout));
child.stderr.on("data", (chunk) => capture(chunk, process.stderr));

child.on("close", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  if (code !== 0) {
    process.exit(code ?? 1);
    return;
  }

  const normalized = output.replace(/\u001b\[[0-9;]*m/g, "");
  if (/------ WARNING|:infer-warning|WARNING #/.test(normalized)) {
    console.error("eta-mu-extensions build warning ratchet failed: build emitted warnings.");
    process.exit(1);
    return;
  }

  process.exit(0);
});
