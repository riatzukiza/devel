const TOOL_SCHEMAS_URL = "/dashboard/static/src/data/tool_schemas.json";

let cachedSchemas = null;
let cachedError = "";
let inFlight = null;

function asLower(value) {
  return String(value || "").toLowerCase();
}

function parseObject(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (Array.isArray(value)) {
    return null;
  }
  return value;
}

async function loadSchemas() {
  if (cachedSchemas || cachedError) {
    return;
  }
  if (inFlight) {
    await inFlight;
    return;
  }
  inFlight = (async () => {
    try {
      const response = await fetch(TOOL_SCHEMAS_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      cachedSchemas = parseObject(payload) || {};
      cachedError = "";
    } catch (error) {
      cachedSchemas = {};
      cachedError = error?.message || String(error);
    } finally {
      inFlight = null;
    }
  })();
  await inFlight;
}

function selectedToolName(state) {
  return String(state?.selectedTool?.tool || "").trim();
}

function selectedToolArgs(state) {
  const args = state?.selectedTool?.arguments_json;
  return parseObject(args) || {};
}

function selectedToolError(state) {
  const toolError = String(state?.selectedTool?.error || state?.selectedTool?.callback_error || "").trim();
  if (toolError) {
    return toolError;
  }
  return String(state?.lastError?.message || "").trim();
}

function missingRequiredFields(required, args) {
  if (!Array.isArray(required) || !required.length) {
    return [];
  }
  const parsed = parseObject(args) || {};
  return required.filter((field) => !(field in parsed));
}

function missingFromError(required, errorText) {
  const lower = asLower(errorText);
  if (!lower || !Array.isArray(required)) {
    return [];
  }
  const matches = [];
  for (const field of required) {
    const target = asLower(field);
    if (!target) {
      continue;
    }
    if (lower.includes(`missing argument: ${target}`) || lower.includes(`missing field: ${target}`)) {
      matches.push(field);
    }
  }
  return matches;
}

function createCopyButton(textResolver) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "layout-toggle";
  button.textContent = "Copy example";
  button.addEventListener("click", async () => {
    try {
      const text = String(textResolver() || "");
      if (!text) {
        return;
      }
      await navigator.clipboard.writeText(text);
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = original;
      }, 900);
    } catch (_error) {
      const original = button.textContent;
      button.textContent = "Copy failed";
      window.setTimeout(() => {
        button.textContent = original;
      }, 900);
    }
  });
  return button;
}

function renderSchemaList(panel, toolName, schemas) {
  const list = document.createElement("ul");
  list.className = "tool-schema-list";
  for (const name of Object.keys(schemas).sort()) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = name === toolName ? `${name} (selected)` : name;
    list.append(item);
  }
  panel.append(list);
}

export async function renderToolSchemaPanel(container, state, store) {
  const panel = document.createElement("section");
  panel.className = "panel-section";

  const title = document.createElement("h3");
  title.textContent = "Tool Schema";
  panel.append(title);

  const summary = document.createElement("p");
  summary.className = "muted";
  summary.textContent = "Hardcoded schema catalog loaded from src/data/tool_schemas.json.";
  panel.append(summary);

  if (!cachedSchemas && !cachedError) {
    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Loading tool schemas...";
    panel.append(loading);
    container.append(panel);
    void loadSchemas().then(() => {
      if (store?.setState) {
        store.setState({ inspectorTab: state?.inspectorTab || "schema" });
      }
    });
    return;
  }

  if (cachedError) {
    const error = document.createElement("p");
    error.className = "muted";
    error.textContent = `Failed to load schema catalog: ${cachedError}`;
    panel.append(error);
    container.append(panel);
    return;
  }

  const toolName = selectedToolName(state);
  const schemas = cachedSchemas || {};
  const selectedSchema = parseObject(schemas[toolName]);

  if (!toolName) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Select a tool call to show required fields and payload examples.";
    panel.append(empty);
    renderSchemaList(panel, "", schemas);
    container.append(panel);
    return;
  }

  const toolTitle = document.createElement("p");
  toolTitle.textContent = `Selected tool: ${toolName}`;
  panel.append(toolTitle);

  if (!selectedSchema) {
    const missing = document.createElement("p");
    missing.className = "muted";
    missing.textContent = "No hardcoded schema for this tool yet.";
    panel.append(missing);
    renderSchemaList(panel, toolName, schemas);
    container.append(panel);
    return;
  }

  const required = Array.isArray(selectedSchema.required) ? selectedSchema.required : [];
  const args = selectedToolArgs(state);
  const errorText = selectedToolError(state);
  const missingFromArgs = new Set(missingRequiredFields(required, args));
  const missingFromMessage = missingFromError(required, errorText);
  for (const field of missingFromMessage) {
    missingFromArgs.add(field);
  }

  const requiredLabel = document.createElement("h4");
  requiredLabel.textContent = "Required fields";
  panel.append(requiredLabel);
  const requiredList = document.createElement("ul");
  for (const field of required) {
    const item = document.createElement("li");
    if (missingFromArgs.has(field)) {
      item.textContent = `${field} (missing)`;
      item.style.color = "#cc2f2f";
      item.style.fontWeight = "600";
    } else {
      item.textContent = field;
    }
    requiredList.append(item);
  }
  panel.append(requiredList);

  const exampleLabel = document.createElement("h4");
  exampleLabel.textContent = "Example payload";
  panel.append(exampleLabel);
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(selectedSchema.example || {}, null, 2);
  panel.append(pre, createCopyButton(() => pre.textContent));

  if (toolName === "fs.edit" && asLower(errorText).includes("missing argument: edits")) {
    const targeted = document.createElement("p");
    targeted.className = "muted";
    targeted.textContent = "Detected fs.edit missing edits[]: include edits as an array of old/new text replacements.";
    panel.append(targeted);
  }

  container.append(panel);
}
