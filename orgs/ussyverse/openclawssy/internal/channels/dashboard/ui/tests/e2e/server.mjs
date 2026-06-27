import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function safePath(relativePath) {
  const target = path.resolve(root, relativePath);
  const normalizedRoot = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (target === root || target.startsWith(normalizedRoot)) {
    return target;
  }
  return "";
}

async function serveFile(res, filePath) {
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(body);
  } catch (_error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
}

createServer(async (req, res) => {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("method not allowed");
    return;
  }

  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    await serveFile(res, path.join(root, "index.html"));
    return;
  }
  if (pathname.startsWith("/dashboard/static/")) {
    const relative = pathname.slice("/dashboard/static/".length);
    const full = safePath(relative);
    if (!full) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("bad path");
      return;
    }
    await serveFile(res, full);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
}).listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`dashboard ui e2e server running on http://127.0.0.1:${port}`);
});
