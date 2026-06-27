// Mock for @opencode-ai/sdk/client
export function createOpencodeClient(config) {
  let sessions = [
    { id: "test-session-1", title: "First Test Session" },
    { sessionID: "test-session-2", title: "Second Test Session" },
    { sessionId: "test-session-3", title: "Third Test Session" }
  ];

  return {
    config: {
      get: function() { return Promise.resolve({ data: { status: "ok" } }); }
    },
    app: {
      call: function(method) {
        if (method === "agents") return Promise.resolve({ data: { agents: ["agent-1", "agent-2"] } });
        return Promise.resolve({ data: {} });
      }
    },
    tool: {
      call: function(method) {
        if (method === "ids") return Promise.resolve({ data: { tools: ["echo", "list"] } });
        return Promise.resolve({ data: {} });
      }
    },
    find: {
      text: function() { return Promise.resolve({ data: { results: [] } }); }
    },
    session: {
      list: function() {
        return Promise.resolve({
          data: {
            sessions: sessions
          }
        });
      },
      create: function(params) {
        const id = "mock-session-" + Math.random().toString(36).substr(2, 9);
        const newSession = { id: id, title: params?.body?.title || "New Session" };
        sessions.push(newSession);
        return Promise.resolve({ data: newSession });
      },
      get: function(params) {
        const id = params?.path?.id;
        const session = sessions.find(s => s.id === id || s.sessionID === id || s.sessionId === id);
        return Promise.resolve({ data: session || { id: id } });
      },
      delete: function(params) {
        const id = params?.path?.id;
        sessions = sessions.filter(s => s.id !== id && s.sessionID !== id && s.sessionId !== id);
        return Promise.resolve({ data: { success: true } });
      },
      prompt: function() { return Promise.resolve({ data: { id: "msg-1" } }); },
      command: function() { return Promise.resolve({ data: { status: "completed" } }); },
      update: function(params) {
        const id = params?.path?.id;
        return Promise.resolve({ data: { id: id, state: params?.body?.state } });
      }
    }
  };
}
