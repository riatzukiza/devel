import { renderVenvPanel } from "../ux/venv_panel.js";

export const pythonEnvInspector = {
  key: "python",
  label: "Python Env",
  render({ container }) {
    container.innerHTML = "";
    renderVenvPanel(container);
  },
};
