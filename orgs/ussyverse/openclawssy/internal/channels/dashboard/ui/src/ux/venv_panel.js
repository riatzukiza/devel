const venvState = {
  path: ".venv",
};

function commandSet(venvPath) {
  const safePath = String(venvPath || ".venv").trim() || ".venv";
  return [
    `python3 -m venv ${safePath}`,
    `${safePath}/bin/pip install -r requirements.txt`,
    `${safePath}/bin/python your_script.py`,
  ];
}

function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard unavailable"));
}

export function renderVenvPanel(container) {
  const panel = document.createElement("section");
  panel.className = "panel-section";

  const title = document.createElement("h3");
  title.textContent = "Python Env";

  const description = document.createElement("p");
  description.className = "muted";
  description.textContent = "UI-only helper for common virtual environment commands.";

  const venvLabel = document.createElement("label");
  venvLabel.className = "sessions-control";
  venvLabel.textContent = "Virtual env path";
  const venvInput = document.createElement("input");
  venvInput.type = "text";
  venvInput.value = venvState.path;
  venvInput.placeholder = ".venv";
  venvInput.addEventListener("input", () => {
    venvState.path = venvInput.value;
  });
  venvLabel.append(venvInput);

  const commands = commandSet(venvState.path);

  const list = document.createElement("ul");
  for (const command of commands) {
    const item = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = command;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "layout-toggle";
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      try {
        await copyToClipboard(command);
        const original = copy.textContent;
        copy.textContent = "Copied";
        window.setTimeout(() => {
          copy.textContent = original;
        }, 900);
      } catch (_error) {
        const original = copy.textContent;
        copy.textContent = "Copy failed";
        window.setTimeout(() => {
          copy.textContent = original;
        }, 900);
      }
    });

    item.append(code, copy);
    list.append(item);
  }

  panel.append(title, description, venvLabel, list);
  container.append(panel);
}
