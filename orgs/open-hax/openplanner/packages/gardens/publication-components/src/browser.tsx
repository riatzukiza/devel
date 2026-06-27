import "@open-hax/uxx/css";
import { hydrateRoot } from "react-dom/client";
import { PublicationBlocksRenderer, type PublicationBlock } from "./PublicationBlocksRenderer.js";
import type { GardenPublicationRenderProps } from "./server.js";
import { audioUrlForPath } from "./url.js";

type RootPayload = GardenPublicationRenderProps & {
  blocks: PublicationBlock[];
};

function readPayload(script: HTMLScriptElement): RootPayload | null {
  try {
    const parsed = JSON.parse(script.textContent ?? "null") as RootPayload | null;
    return parsed && Array.isArray(parsed.blocks) ? parsed : null;
  } catch (error) {
    console.error("Failed to parse garden publication payload", error);
    return null;
  }
}

function hydrateGardenPublication(root: HTMLElement, payload: RootPayload): void {
  const audioUrlBase = payload.audioUrlBase ?? "/api/studio/stream";
  hydrateRoot(
    root,
    <PublicationBlocksRenderer
      blocks={payload.blocks}
      maxInitialPlaylistTracks={payload.maxInitialPlaylistTracks ?? 100}
      getAudioUrl={(path) => audioUrlForPath(path, audioUrlBase)}
    />,
  );
}

function boot(): void {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[data-garden-publication-props]"));
  for (const script of scripts) {
    const rootId = script.dataset.gardenPublicationRoot;
    const root = rootId ? document.getElementById(rootId) : null;
    const payload = readPayload(script);
    if (!root || !payload) continue;
    hydrateGardenPublication(root, payload);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
