import "dotenv/config";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import { WebSocket } from "ws";
import { FastifyRequest } from "fastify";
import { bus } from "./events.js";
import { listIssues, listPRs, openPR, commentPR, getIssueDetail, getPRDetail } from "./github.js";
import { getRepoInfo, getWorktreeConfig, createWorktree, runTaskInWorktree, pushBranch, listWorktrees } from "./git.js";
import { listFiles } from "./fs.js";

const PORT = Number(process.env.WEB_PORT ?? 8787);
const REPO = process.env.REPO_SLUG!;

const app = Fastify();
await app.register(cors);
await app.register(websocket);

app.get("/events", { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
  bus.attach(socket);
  socket.on("close", () => bus.detach(socket));
});

app.get("/api/issues", async (req, rep) => {
  const repo = (req.query as any).repo ?? REPO;
  return listIssues(repo);
});

app.get("/api/issues/:id", async (req, rep) => {
  const repo = (req.query as any).repo ?? REPO;
  const id = Number((req.params as any).id);
  return getIssueDetail(repo, id);
});

app.get("/api/repo", async (req, rep) => {
  return getRepoInfo();
});

app.get("/api/files", async (req, rep) => {
  const relPath = (req.query as any).path ?? ".";
  try {
    return await listFiles(relPath);
  } catch (err) {
    rep.status(400);
    return { error: String(err) };
  }
});

app.get("/api/prs", async (req, rep) => {
  const repo = (req.query as any).repo ?? REPO;
  return listPRs(repo);
});

app.get("/api/prs/:id", async (req, rep) => {
  const repo = (req.query as any).repo ?? REPO;
  const id = Number((req.params as any).id);
  return getPRDetail(repo, id);
});

app.get("/api/worktrees", async (req, rep) => {
  return listWorktrees();
});

app.get("/api/worktrees/config", async (req, rep) => {
  return getWorktreeConfig();
});

app.post("/api/worktrees", async (req, rep) => {
  const { repo = REPO, issue } = (req.body as any);
  const { branch, path } = await createWorktree(issue);
  // await runTaskInWorktree(path, `pnpm opencode run "Issue #${issue}" || true`);
  return { branch, path, issue };
});

app.post("/api/pulls", async (req, rep) => {
  const { repo = REPO, issue } = (req.body as any);
  const branch = `issue/${issue}`;
  const pr = await openPR(repo, issue, branch);
  await pushBranch(branch);
  return pr;
});

app.post("/api/pr-comment", async (req, rep) => {
  const { repo = REPO, pr, body } = (req.body as any);
  return commentPR(repo, Number(pr), body);
});

setInterval(async () => {
  try {
    bus.emit({ type: ":refresh/gh" });
  } catch (e) {
    bus.emit({ type: ":error/poll", data: String(e) });
  }
}, 20_000);

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`agentd on :${PORT}`);
});