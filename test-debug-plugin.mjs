export default function(api) {
  console.error("DEBUG PLUGIN LOADED");
  console.error("API keys:", Object.keys(api || {}));
  console.error("API type:", typeof api);
  if (api) {
    console.error("Has registerTool:", typeof api.registerTool);
    console.error("Has registerCommand:", typeof api.registerCommand);
    console.error("Has on:", typeof api.on);
    console.error("Has tool:", typeof api.tool);
    console.error("Has command:", typeof api.command);
  }
}
