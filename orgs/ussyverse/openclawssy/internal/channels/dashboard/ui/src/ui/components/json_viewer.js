function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (_err) {
    return String(value);
  }
}

export function renderJSONViewer(container, value, options = {}) {
  const { title = "JSON", maxChars = 4000 } = options;
  container.classList.add("json-viewer");

  const label = document.createElement("h3");
  label.textContent = title;
  label.className = "json-viewer-title";

  const controls = document.createElement("div");
  controls.className = "chat-composer-actions";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search JSON";
  search.className = "settings-search";
  const searchMeta = document.createElement("span");
  searchMeta.className = "muted";
  searchMeta.textContent = "";
  controls.append(search, searchMeta);

  const pre = document.createElement("pre");
  const text = safeStringify(value);
  const isLong = text.length > maxChars;
  let expanded = !isLong;
  let visibleText = isLong ? `${text.slice(0, maxChars)}\n...truncated...` : text;

  const setRenderedText = () => {
    pre.textContent = visibleText;
    const query = search.value.trim().toLowerCase();
    if (!query) {
      searchMeta.textContent = "";
      return;
    }
    const haystack = visibleText.toLowerCase();
    const first = haystack.indexOf(query);
    searchMeta.textContent = first >= 0 ? `match at char ${first + 1}` : "no match in current view";
  };

  if (isLong) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button-link";
    button.textContent = "Expand";
    button.addEventListener("click", () => {
      expanded = !expanded;
      visibleText = expanded ? text : `${text.slice(0, maxChars)}\n...truncated...`;
      button.textContent = expanded ? "Collapse" : "Expand";
      setRenderedText();
    });
    controls.append(button);
  }

  search.addEventListener("input", () => {
    setRenderedText();
  });

  setRenderedText();
  container.append(label, controls, pre);
}
