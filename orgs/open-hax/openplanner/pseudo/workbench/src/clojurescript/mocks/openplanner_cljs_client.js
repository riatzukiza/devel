"use strict";

const request = async (path, init) => {
  const response = await fetch(path, init);
  if (!response.ok) {
    throw new Error(`mock openplanner request failed: ${response.status}`);
  }
  if (typeof response.json === "function") {
    return response.json();
  }
  return {};
};

const createOpenPlannerClient = () => ({
  health: async () => request("/v1/health", { method: "GET" }),
  listSessions: async () => request("/v1/sessions", { method: "GET" }),
  getSession: async (sessionId) => request(`/v1/sessions/${sessionId}`, { method: "GET" }),
  indexEvents: async (events) => request("/v1/events", { method: "POST", body: JSON.stringify({ events }) }),
  searchFts: async (payload) => request("/v1/search/fts", { method: "POST", body: JSON.stringify(payload) }),
  searchVector: async (payload) => request("/v1/search/vector", { method: "POST", body: JSON.stringify(payload) }),
  listJobs: async () => request("/v1/jobs", { method: "GET" }),
  getJob: async (jobId) => request(`/v1/jobs/${jobId}`, { method: "GET" }),
  createChatgptImportJob: async (payload) => request("/v1/jobs/import/chatgpt", { method: "POST", body: JSON.stringify(payload) }),
  createOpencodeImportJob: async (payload) => request("/v1/jobs/import/opencode", { method: "POST", body: JSON.stringify(payload) }),
  createCompilePackJob: async (payload) => request("/v1/jobs/compile/pack", { method: "POST", body: JSON.stringify(payload) }),
  getBlob: async () => new ArrayBuffer(0),
  uploadBlob: async () => ({}),
});

module.exports = {
  createOpenPlannerClient,
};
