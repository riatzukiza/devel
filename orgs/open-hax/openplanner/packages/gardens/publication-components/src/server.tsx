import { renderToString } from "react-dom/server";
import { PublicationBlocksRenderer, type PublicationBlock } from "./PublicationBlocksRenderer.js";
import { audioUrlForPath } from "./url.js";

export type GardenPublicationRenderProps = {
  blocks: PublicationBlock[];
  maxInitialPlaylistTracks?: number;
  audioUrlBase?: string;
};

export function renderPublicationBlocksHtml({
  blocks,
  maxInitialPlaylistTracks = 100,
  audioUrlBase = "/api/studio/stream",
}: GardenPublicationRenderProps): string {
  return renderToString(
    <PublicationBlocksRenderer
      blocks={blocks}
      maxInitialPlaylistTracks={maxInitialPlaylistTracks}
      getAudioUrl={(path) => audioUrlForPath(path, audioUrlBase)}
    />,
  );
}

export function serializeGardenPublicationProps(props: GardenPublicationRenderProps): string {
  return JSON.stringify(props)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
