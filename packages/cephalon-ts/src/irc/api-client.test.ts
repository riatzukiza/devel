import test from "ava";

import { IrcApiClient } from "./api-client.js";

function createClient() {
  return new IrcApiClient({
    host: "irc.example.test",
    port: 6697,
    tls: true,
    nick: "duck",
    user: "cephalon",
    realName: "Duck IRC bridge",
    workspaceId: "ussy",
    channel: "#ussycode",
  }) as unknown as {
    socket: { destroyed: boolean; write: (chunk: string) => void; end: () => void };
    joined: boolean;
    currentNick: string;
    handleLine: (line: string) => void;
  };
}

test("self PART triggers immediate rejoin", (t) => {
  const sent: string[] = [];
  const client = createClient();
  client.socket = {
    destroyed: false,
    write: (chunk: string) => {
      sent.push(chunk.trim());
    },
    end: () => undefined,
  };
  client.joined = true;
  client.currentNick = "duck";

  client.handleLine(":duck!bot@example PART #ussycode :bye");
  client.handleLine(":duck!bot@example JOIN :#ussycode");

  t.false(sent.length === 0);
  t.true(sent.includes("JOIN #ussycode"));
  t.true(client.joined);
});

test("self KICK triggers immediate rejoin", (t) => {
  const sent: string[] = [];
  const client = createClient();
  client.socket = {
    destroyed: false,
    write: (chunk: string) => {
      sent.push(chunk.trim());
    },
    end: () => undefined,
  };
  client.joined = true;
  client.currentNick = "duck";

  client.handleLine(":chanop!ops@example KICK #ussycode duck :nope");
  client.handleLine(":duck!bot@example JOIN :#ussycode");

  t.true(sent.includes("JOIN #ussycode"));
  t.true(client.joined);
});
