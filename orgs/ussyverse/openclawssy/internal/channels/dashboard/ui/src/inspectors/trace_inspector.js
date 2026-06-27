import { renderJSONViewer } from "../ui/components/json_viewer.js";

function traceSourceLabel(source) {
  if (source === "debug") {
    return "debug";
  }
  if (source === "run") {
    return "run";
  }
  return "none";
}

function stripTraceMeta(trace) {
  if (!trace || typeof trace !== "object") {
    return { message: "No trace selected yet." };
  }
  const payload = { ...trace };
  delete payload._dashboard_meta;
  return payload;
}

export const traceInspector = {
  key: "trace",
  label: "Trace",
  render({ container, state }) {
    container.innerHTML = "";
    const block = document.createElement("section");
    const selectedTrace = state.selectedTrace;
    const meta =
      selectedTrace && typeof selectedTrace === "object" && selectedTrace._dashboard_meta
        ? selectedTrace._dashboard_meta
        : null;

    const source = traceSourceLabel(meta && meta.source);
    const note = meta && meta.source_note ? meta.source_note : "Trace source not available.";

    const heading = document.createElement("h3");
    heading.textContent = "Run Trace";
    const sourceNote = document.createElement("p");
    sourceNote.className = "muted";
    sourceNote.textContent = `Source: ${source}. ${note}`;
    block.append(heading, sourceNote);

    const metadata = {
      run_id: selectedTrace && selectedTrace.run_id ? selectedTrace.run_id : "",
      status: selectedTrace && selectedTrace.status ? selectedTrace.status : meta?.run_status || "",
      source,
      model_steps: Array.isArray(selectedTrace?.model_inputs) ? selectedTrace.model_inputs.length : 0,
      tool_calls: Array.isArray(selectedTrace?.tool_execution_results) ? selectedTrace.tool_execution_results.length : 0,
    };
    renderJSONViewer(block, metadata, { title: "Trace Metadata" });

    renderJSONViewer(block, stripTraceMeta(selectedTrace), { title: "Trace Payload" });
    container.append(block);
  },
};
