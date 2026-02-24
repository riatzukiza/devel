import { spawn } from "node:child_process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr, child });
    });
  });
}

async function waitForPort(child, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => {
      reject(new Error(`Timed out waiting for server port after ${timeoutMs}ms`));
    }, timeoutMs);

    const handleChunk = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      const match = text.match(/mcp-fs-oauth listening on (\d+)/);
      if (match?.[1]) {
        clearTimeout(deadline);
        child.stdout?.off("data", handleChunk);
        resolve(Number(match[1]));
      }
    };

    child.stdout?.on("data", handleChunk);
    child.stderr?.on("data", (chunk) => process.stderr.write(chunk.toString()));
    child.on("error", (error) => {
      clearTimeout(deadline);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(deadline);
      reject(new Error(`Server exited before announcing port (code ${code ?? 1})`));
    });
  });
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (child.killed) {
      resolve();
      return;
    }

    child.once("close", () => resolve());
    child.kill("SIGTERM");
  });
}

async function main() {
  const server = spawn("bun", ["run", "--env-file=.env", "src/index.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const port = await waitForPort(server);
    const testResult = await run("bun", ["test", "src/tests/mcp-discovery.test.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MCP_TEST_URL: `http://127.0.0.1:${port}/mcp`,
      },
    });

    if (testResult.code !== 0) {
      process.exit(testResult.code);
    }
  } finally {
    await stopProcess(server);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
