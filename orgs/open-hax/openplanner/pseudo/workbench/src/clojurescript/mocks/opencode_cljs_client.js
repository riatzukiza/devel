"use strict";

const createOpencodeClient = () => ({
  listSessions: async () => [{ id: "test-session-1", title: "First Test Session" }],
  getSession: async () => ({}),
  listMessages: async () => [],
  getMessage: async () => ({}),
});

module.exports = {
  createOpencodeClient,
};
