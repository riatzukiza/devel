import { renderToolSchemaPanel } from "../ux/tool_schema_panel.js";

export const toolSchemaInspector = {
  key: "schema",
  label: "Schema",
  async render({ container, state, store }) {
    container.innerHTML = "";
    await renderToolSchemaPanel(container, state, store);
  },
};
