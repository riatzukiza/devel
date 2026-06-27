import { bus } from "./events.js";
import { commentPR } from "./github.js";

type Ctx = { repo: string };

export async function handleEvent(e: {type: string, data: any}, ctx: Ctx) {
  if (e.type === ":pr/review-comment") {
    const pr = e.data.pr;
    await commentPR(ctx.repo, pr, "Thanks! Agent queued a fix ✅");
  }
}

bus.emit({ type: ":agent/ready" });