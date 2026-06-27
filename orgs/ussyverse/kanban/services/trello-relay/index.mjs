import http from "node:http";
import crypto from "node:crypto";

const json = (res, status, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(body);
};

const text = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(payload);
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks);
};

const sha1Base64Hmac = (secret, content) => crypto.createHmac("sha1", secret).update(content).digest("base64");

const timingSafeEqual = (a, b) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifyTrelloSignature = ({ rawBody, callbackUrl, secret, headerValue }) => {
  // Signature verification is strongly recommended, but can be optionally skipped.
  // If either secret or callbackUrl is missing, we accept the request but mark it unverified.
  if (!secret || !callbackUrl) {
    return { ok: true, verified: false, reason: "unverified-missing-secret-or-callback-url" };
  }
  if (!headerValue) {
    return { ok: true, verified: false, reason: "unverified-missing-x-trello-webhook" };
  }

  // Per Trello docs: base64(HMAC-SHA1(body + callbackURL, appSecret))
  const content = Buffer.concat([rawBody, Buffer.from(callbackUrl)]);
  const digest = sha1Base64Hmac(secret, content);
  return { ok: timingSafeEqual(digest, headerValue), verified: true, reason: digest };
};

const githubDispatch = async ({ repo, token, eventType, payload }) => {
  const url = `https://api.github.com/repos/${repo}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${token}`,
      "user-agent": "ussyverse-trello-relay",
      "content-type": "application/json"
    },
    body: JSON.stringify({ event_type: eventType, client_payload: payload })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`github dispatch failed: ${res.status} ${msg}`);
  }
};

const trelloFetchJson = async ({ path, apiKey, apiToken, method = "GET", body }) => {
  const url = new URL(`https://api.trello.com/1/${path}`);
  url.searchParams.set("key", apiKey);
  // NOTE: Trello webhooks are tied to a token; we use token auth for management.
  if (apiToken) url.searchParams.set("token", apiToken);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "content-type": body ? "application/json" : undefined
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`trello ${method} ${path} failed: ${res.status} ${msg}`);
  }
  return res.json();
};

const parseBoardShortlinkFromUrl = (boardUrl) => {
  // expected: https://trello.com/b/<shortLink>/<name>
  try {
    const u = new URL(boardUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const bIndex = parts.indexOf("b");
    return bIndex >= 0 ? parts[bIndex + 1] : undefined;
  } catch {
    return undefined;
  }
};

const ensureTrelloWebhook = async ({
  apiKey,
  apiToken,
  boardShortlink,
  callbackUrl,
  description
}) => {
  if (!apiKey || !apiToken || !boardShortlink || !callbackUrl) {
    return { ensured: false, reason: "missing-config" };
  }

  const board = await trelloFetchJson({
    path: `boards/${boardShortlink}?fields=id,name,url`,
    apiKey,
    apiToken
  });

  const webhooks = await trelloFetchJson({
    path: `tokens/${apiToken}/webhooks`,
    apiKey,
    apiToken
  });

  const existing = Array.isArray(webhooks)
    ? webhooks.find((w) => w?.callbackURL === callbackUrl && w?.idModel === board.id)
    : undefined;

  if (existing?.id) {
    return { ensured: true, boardId: board.id, webhookId: existing.id, created: false };
  }

  const created = await trelloFetchJson({
    path: `tokens/${apiToken}/webhooks`,
    apiKey,
    apiToken,
    method: "POST",
    body: {
      description: description ?? "Ussyverse Trello relay",
      callbackURL: callbackUrl,
      idModel: board.id
    }
  });

  return { ensured: true, boardId: board.id, webhookId: created?.id, created: true };
};

const PORT = Number(process.env.PORT ?? "8787");
const HOST = process.env.HOST ?? "0.0.0.0";

const TRELLO_API_KEY = process.env.TRELLO_API_KEY ?? "";
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN ?? "";
const TRELLO_BOARD_URL = process.env.TRELLO_BOARD_URL ?? "";
const TRELLO_BOARD_SHORTLINK = process.env.TRELLO_BOARD_SHORTLINK ?? parseBoardShortlinkFromUrl(TRELLO_BOARD_URL) ?? "";

const TRELLO_APP_SECRET = process.env.TRELLO_APP_SECRET ?? "";
const WEBHOOK_CALLBACK_URL = process.env.WEBHOOK_CALLBACK_URL ?? "";

const GITHUB_REPO = process.env.GITHUB_REPO ?? ""; // e.g. open-hax/ussyverse-kanban
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_EVENT_TYPE = process.env.GITHUB_EVENT_TYPE ?? "trello_webhook";

let lastDispatchAt = 0;
const DISPATCH_DEBOUNCE_MS = Number(process.env.DISPATCH_DEBOUNCE_MS ?? "1500");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true });
      return;
    }

    // Trello does a HEAD request on callbackURL and requires 200.
    if (req.method === "HEAD" && url.pathname === "/webhooks/trello") {
      res.statusCode = 200;
      res.end();
      return;
    }

    // Manual: hit to ensure webhook exists (requires env vars).
    if (req.method === "POST" && url.pathname === "/admin/ensure-webhook") {
      const ensured = await ensureTrelloWebhook({
        apiKey: TRELLO_API_KEY,
        apiToken: TRELLO_API_TOKEN,
        boardShortlink: TRELLO_BOARD_SHORTLINK,
        callbackUrl: WEBHOOK_CALLBACK_URL,
        description: "Ussyverse Trello → main relay"
      });
      json(res, 200, ensured);
      return;
    }

    if (url.pathname === "/webhooks/trello") {
      const rawBody = await readRawBody(req);

      if (req.method !== "POST") {
        text(res, 405, "method not allowed\n");
        return;
      }

      const header = String(req.headers["x-trello-webhook"] ?? "");
      const sig = verifyTrelloSignature({
        rawBody,
        callbackUrl: WEBHOOK_CALLBACK_URL,
        secret: TRELLO_APP_SECRET,
        headerValue: header
      });

      // Note: may be unverified if env vars are missing.
      if (!sig.ok) {
        console.log(JSON.stringify({ event: "trello-webhook", ok: false, verified: sig.verified, reason: sig.reason }));
        json(res, 401, {
          ok: false,
          error: "invalid-webhook-signature",
          verified: sig.verified,
          reason: sig.reason
        });
        return;
      }

      // Debounce: Trello events can burst; we just need to trigger a pull.
      const now = Date.now();
      if (now - lastDispatchAt >= DISPATCH_DEBOUNCE_MS) {
        lastDispatchAt = now;
        if (GITHUB_REPO && GITHUB_TOKEN) {
          await githubDispatch({
            repo: GITHUB_REPO,
            token: GITHUB_TOKEN,
            eventType: GITHUB_EVENT_TYPE,
            payload: {
              receivedAt: new Date().toISOString(),
              trelloBoardShortlink: TRELLO_BOARD_SHORTLINK
            }
          });
        }
      }

      console.log(JSON.stringify({ event: "trello-webhook", ok: true, verified: sig.verified }));
      json(res, 200, { ok: true, verified: sig.verified });
      return;
    }

    text(res, 404, "not found\n");
  } catch (err) {
    json(res, 500, { ok: false, error: err?.message ?? String(err) });
  }
});

server.listen(PORT, HOST, async () => {
  console.log(`trello-relay listening on http://${HOST}:${PORT}`);

  // Best-effort auto ensure webhook on startup.
  try {
    const ensured = await ensureTrelloWebhook({
      apiKey: TRELLO_API_KEY,
      apiToken: TRELLO_API_TOKEN,
      boardShortlink: TRELLO_BOARD_SHORTLINK,
      callbackUrl: WEBHOOK_CALLBACK_URL,
      description: "Ussyverse Trello → main relay"
    });
    console.log(JSON.stringify({ webhook: ensured }, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ webhook: { ensured: false, error: e?.message ?? String(e) } }, null, 2));
  }
});
