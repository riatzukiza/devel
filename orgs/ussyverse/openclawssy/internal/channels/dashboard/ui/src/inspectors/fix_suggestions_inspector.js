import { renderFixSuggestions } from "../ux/fix_suggestions.js";

export const fixSuggestionsInspector = {
  key: "fixes",
  label: "Fixes",
  render({ container, state, store }) {
    container.innerHTML = "";
    renderFixSuggestions(container, state?.lastError || null, store);
  },
};
