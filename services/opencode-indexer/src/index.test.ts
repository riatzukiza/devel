import test from "ava";
import { runIndexer } from "./index.ts";

test("runIndexer calls indexSessions", async (t) => {
  let called = 0;
  await runIndexer({
    indexSessions: async () => {
      called += 1;
    },
  });
  t.is(called, 1);
});
