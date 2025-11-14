#!/usr/bin/env bun

import { makeOpenAIAdapter } from "./orgs/riatzukiza/promethean/packages/pantheon/llm-openai/dist/index.js";

async function testConnection() {
  const baseURL = process.env.OPENAI_BASE_URL || "http://localhost:11434/v1";
  const apiKey = process.env.OPENAI_API_KEY || "ollama";

  console.log("Testing connection to:", baseURL);
  const maskedKey = apiKey && apiKey.length > 8 ? `${apiKey.slice(0,4)}...${apiKey.slice(-4)}` : "[redacted]";
  console.log("Using API key:", maskedKey);

  try {
    // Test models endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const modelsUrl = baseURL.replace(/\/$/, "") + "/models";
    console.log("Testing models endpoint:", modelsUrl);
    
    const modelsRes = await fetch(modelsUrl, { 
      method: "GET",
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    console.log("Models response status:", modelsRes.status);
    if (modelsRes.ok) {
      const models = await modelsRes.json();
      const modelIds = Array.isArray(models?.data)
        ? models.data.map((m: any) => m.id).slice(0, 5)
        : models;
      console.log("Available models:", modelIds);
    } else {
      console.log("Models response text:", await modelsRes.text());
    }

    // Test LLM adapter
    const llm = makeOpenAIAdapter({
      apiKey,
      baseURL,
      defaultModel: "gpt-oss:20b-cloud",
      timeout: 8000,
      retryConfig: { maxRetries: 1, baseDelay: 500 },
    });

    const response = await llm.complete([
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say 'Hello world'" }
    ], { model: "gpt-oss:20b-cloud" });

    console.log("LLM Response:", response.content);
  } catch (error) {
    console.error("Connection test failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

testConnection();