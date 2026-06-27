const OUTPUT_PREVIEW_CHARS = 2800;

function asPrettyJSON(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) {
      return "";
    }
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (_err) {
      return text;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (_err) {
    return String(value);
  }
}

function asText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function createCopyButton(label, resolveText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inspector-copy-button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    const text = asText(resolveText());
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = original;
      }, 900);
    } catch (_err) {
      const original = button.textContent;
      button.textContent = "Copy failed";
      window.setTimeout(() => {
        button.textContent = original;
      }, 900);
    }
  });
  return button;
}

function renderValueSection(container, title, text, options = {}) {
  const { truncatable = false, copyLabel = "Copy" } = options;
  const section = document.createElement("section");
  section.className = "inspector-section";

  const row = document.createElement("div");
  row.className = "inspector-section-header";
  const heading = document.createElement("h4");
  heading.textContent = title;
  row.append(heading, createCopyButton(copyLabel, () => text));
  section.append(row);

  if (!text) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = `No ${title.toLowerCase()} available.`;
    section.append(empty);
    container.append(section);
    return;
  }

  const pre = document.createElement("pre");
  if (truncatable && text.length > OUTPUT_PREVIEW_CHARS) {
    let expanded = false;
    pre.textContent = `${text.slice(0, OUTPUT_PREVIEW_CHARS)}\n...truncated...`;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "button-link";
    toggle.textContent = "Expand output";
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      pre.textContent = expanded ? text : `${text.slice(0, OUTPUT_PREVIEW_CHARS)}\n...truncated...`;
      toggle.textContent = expanded ? "Collapse output" : "Expand output";
    });
    section.append(toggle);
  } else {
    pre.textContent = text;
  }

  if (!pre.textContent) {
    pre.textContent = text;
  }
  section.append(pre);
  container.append(section);
}

export const toolInspector = {
  key: "tool",
  label: "Tool",
  render({ container, state }) {
    container.innerHTML = "";
    const selectedTool = state.selectedTool;
    if (!selectedTool || typeof selectedTool !== "object") {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No tool call selected yet. Choose one from the run timeline.";
      container.append(empty);
      return;
    }

    const block = document.createElement("section");
    block.className = "tool-inspector";

    const heading = document.createElement("h3");
    heading.textContent = "Tool Call";
    const meta = document.createElement("p");
    meta.className = "muted";
    const status = selectedTool.status === "failed" ? "failed" : "ok";
    const duration = Number(selectedTool.duration_ms);
    const durationText = Number.isFinite(duration) && duration > 0 ? `${duration}ms` : "-";
    meta.textContent = `${selectedTool.tool || "unknown.tool"} · ${status} · duration ${durationText}`;
    block.append(heading, meta);

    if (selectedTool.tool_call_id) {
      const callID = document.createElement("p");
      callID.className = "muted";
      callID.textContent = `Tool call id: ${selectedTool.tool_call_id}`;
      block.append(callID);
    }

    const prettyArgs = asPrettyJSON(selectedTool.arguments_json || selectedTool.arguments || "");
    const outputText = asText(selectedTool.output || "");
    const errorText = asText(selectedTool.error || selectedTool.callback_error || "");

    renderValueSection(block, "Args JSON", prettyArgs, { copyLabel: "Copy args" });
    renderValueSection(block, "Output", outputText, { truncatable: true, copyLabel: "Copy output" });
    renderValueSection(block, "Error", errorText, { copyLabel: "Copy error" });

    container.append(block);
  },
};
