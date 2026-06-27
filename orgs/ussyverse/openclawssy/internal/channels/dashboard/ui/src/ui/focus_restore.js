function isTextEntryElement(element) {
  if (!element || !element.tagName) {
    return false;
  }
  const tag = String(element.tagName).toUpperCase();
  if (tag === "TEXTAREA") {
    return true;
  }
  if (tag !== "INPUT") {
    return false;
  }
  const type = String(element.type || "text").toLowerCase();
  return !["button", "submit", "reset", "checkbox", "radio", "file"].includes(type);
}

export function captureFocusSnapshot(container) {
  if (!container || !container.isConnected) {
    return null;
  }
  const active = document.activeElement;
  if (!active || !container.contains(active)) {
    return null;
  }
  const focusID = active.getAttribute("data-focus-id");
  if (!focusID) {
    return null;
  }

  const snapshot = { focusID, isTextEntry: isTextEntryElement(active) };
  if (snapshot.isTextEntry && typeof active.selectionStart === "number" && typeof active.selectionEnd === "number") {
    snapshot.selectionStart = active.selectionStart;
    snapshot.selectionEnd = active.selectionEnd;
    if (typeof active.scrollTop === "number") {
      snapshot.scrollTop = active.scrollTop;
    }
  }
  return snapshot;
}

export function restoreFocusSnapshot(container, snapshot) {
  if (!container || !container.isConnected || !snapshot || !snapshot.focusID) {
    return;
  }
  const candidates = Array.from(container.querySelectorAll("[data-focus-id]"));
  const target = candidates.find((node) => node.getAttribute("data-focus-id") === snapshot.focusID);
  if (!target) {
    return;
  }

  try {
    target.focus({ preventScroll: true });
  } catch (_error) {
    target.focus();
  }

  if (!snapshot.isTextEntry || typeof target.setSelectionRange !== "function") {
    return;
  }

  const start = Number.isInteger(snapshot.selectionStart) ? snapshot.selectionStart : 0;
  const end = Number.isInteger(snapshot.selectionEnd) ? snapshot.selectionEnd : start;
  const valueLength = typeof target.value === "string" ? target.value.length : 0;
  const clampedStart = Math.max(0, Math.min(start, valueLength));
  const clampedEnd = Math.max(clampedStart, Math.min(end, valueLength));
  try {
    target.setSelectionRange(clampedStart, clampedEnd);
  } catch (_error) {
    // Some input types may reject setSelectionRange.
  }
  if (typeof snapshot.scrollTop === "number" && typeof target.scrollTop === "number") {
    target.scrollTop = snapshot.scrollTop;
  }
}
