import ReactMarkdown from "react-markdown";
import { StudioPlaylistPlayer } from "./StudioPlaylistPlayer.js";

export type PlaylistTrackRef = {
  path: string;
  title: string;
  artist?: string;
  duration?: number;
  mime?: string;
  labels?: string[];
  description?: string;
  source_url?: string;
};

type BaseBlock = {
  id: string;
  type: string;
  hidden?: boolean;
};

export type HeroBlock = BaseBlock & {
  type: "hero";
  title: string;
  subtitle?: string;
  image_path?: string;
  audio_path?: string;
};

export type HeadingBlock = BaseBlock & {
  type: "heading";
  level: 2 | 3 | 4;
  text: string;
};

export type RichTextBlock = BaseBlock & {
  type: "rich_text";
  markdown: string;
};

export type CalloutBlock = BaseBlock & {
  type: "callout";
  tone: "note" | "tip" | "warning" | "promo";
  title?: string;
  markdown: string;
};

export type PlaylistBlock = BaseBlock & {
  type: "playlist";
  title?: string;
  description?: string;
  layout: "compact" | "cards" | "broadcast";
  tracks: PlaylistTrackRef[];
  show_labels?: boolean;
  show_descriptions?: boolean;
  show_duration?: boolean;
};

export type TrackBlock = BaseBlock & {
  type: "track";
  track: PlaylistTrackRef;
  commentary?: string;
  show_player?: boolean;
};

export type DividerBlock = BaseBlock & {
  type: "divider";
};

export type CtaBlock = BaseBlock & {
  type: "cta";
  label: string;
  href: string;
  tone?: "primary" | "secondary";
};

export type PublicationBlock =
  | HeroBlock
  | HeadingBlock
  | RichTextBlock
  | CalloutBlock
  | PlaylistBlock
  | TrackBlock
  | DividerBlock
  | CtaBlock;

type PublicationBlocksRendererProps = {
  blocks: PublicationBlock[];
  getAudioUrl?: (path: string) => string;
  maxInitialPlaylistTracks?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArrayValue(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : undefined;
}

function normalizeTrack(value: unknown): PlaylistTrackRef | null {
  if (!isRecord(value)) return null;
  const path = stringValue(value.path);
  const title = stringValue(value.title) ?? path;
  if (!path || !title) return null;
  return {
    path,
    title,
    artist: stringValue(value.artist),
    duration: numberValue(value.duration),
    mime: stringValue(value.mime),
    labels: stringArrayValue(value.labels),
    description: stringValue(value.description),
    source_url: stringValue(value.source_url),
  };
}

function normalizeBlock(value: unknown, index: number): PublicationBlock | null {
  if (!isRecord(value)) return null;
  const type = stringValue(value.type);
  const id = stringValue(value.id) ?? `block-${index}`;
  const hidden = value.hidden === true;

  switch (type) {
    case "hero": {
      const title = stringValue(value.title);
      if (!title) return null;
      return {
        id,
        type,
        hidden,
        title,
        subtitle: stringValue(value.subtitle),
        image_path: stringValue(value.image_path),
        audio_path: stringValue(value.audio_path),
      };
    }
    case "heading": {
      const text = stringValue(value.text);
      const level = value.level === 3 || value.level === 4 ? value.level : 2;
      if (!text) return null;
      return { id, type, hidden, level, text };
    }
    case "rich_text": {
      const markdown = stringValue(value.markdown) ?? "";
      return { id, type, hidden, markdown };
    }
    case "callout": {
      const markdown = stringValue(value.markdown) ?? "";
      const tone = value.tone === "tip" || value.tone === "warning" || value.tone === "promo" ? value.tone : "note";
      return { id, type, hidden, tone, title: stringValue(value.title), markdown };
    }
    case "playlist": {
      const tracks = Array.isArray(value.tracks) ? value.tracks.map(normalizeTrack).filter((track): track is PlaylistTrackRef => track !== null) : [];
      const layout = value.layout === "cards" || value.layout === "broadcast" ? value.layout : "compact";
      return {
        id,
        type,
        hidden,
        title: stringValue(value.title),
        description: stringValue(value.description),
        layout,
        tracks,
        show_labels: value.show_labels === true,
        show_descriptions: value.show_descriptions === true,
        show_duration: value.show_duration === true,
      };
    }
    case "track": {
      const track = normalizeTrack(value.track);
      if (!track) return null;
      return { id, type, hidden, track, commentary: stringValue(value.commentary), show_player: value.show_player !== false };
    }
    case "divider":
      return { id, type, hidden };
    case "cta": {
      const label = stringValue(value.label);
      const href = stringValue(value.href);
      if (!label || !href) return null;
      return { id, type, hidden, label, href, tone: value.tone === "secondary" ? "secondary" : "primary" };
    }
    default:
      return null;
  }
}

export function extractPublicationBlocks(metadata: unknown): PublicationBlock[] {
  if (!isRecord(metadata) || !Array.isArray(metadata.blocks)) return [];
  return metadata.blocks.map(normalizeBlock).filter((block): block is PublicationBlock => block !== null && block.hidden !== true);
}

function formatDuration(seconds: number | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function TrackCard({ track, showDescription, showLabels, showDuration, getAudioUrl }: {
  track: PlaylistTrackRef;
  showDescription?: boolean;
  showLabels?: boolean;
  showDuration?: boolean;
  getAudioUrl?: (path: string) => string;
}) {
  const duration = formatDuration(track.duration);
  return (
    <article className="publication-blocks__track-card">
      <div className="publication-blocks__track-main">
        <div>
          <div className="publication-blocks__track-title">{track.title}</div>
          {track.artist ? <div className="publication-blocks__track-artist">{track.artist}</div> : null}
          {showDescription && track.description ? <p className="publication-blocks__track-description">{track.description}</p> : null}
        </div>
        {showDuration && duration ? <span className="publication-blocks__duration">{duration}</span> : null}
      </div>
      {getAudioUrl ? <audio className="publication-blocks__audio" controls preload="none" src={getAudioUrl(track.path)} /> : null}
      {showLabels && track.labels && track.labels.length > 0 ? (
        <div className="publication-blocks__labels">
          {track.labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      ) : null}
    </article>
  );
}

function PlaylistPublicationView({ block, maxVisible, getAudioUrl }: { block: PlaylistBlock; maxVisible: number; getAudioUrl?: (path: string) => string }) {
  return (
    <StudioPlaylistPlayer
      title={block.title}
      description={block.description}
      tracks={block.tracks}
      getAudioUrl={getAudioUrl}
      maxVisible={maxVisible}
      showLabels={block.show_labels}
      showDescription={block.show_descriptions}
      showDuration={block.show_duration}
    />
  );
}

function renderHeading(block: HeadingBlock) {
  if (block.level === 4) return <h4 className="publication-blocks__heading">{block.text}</h4>;
  if (block.level === 3) return <h3 className="publication-blocks__heading">{block.text}</h3>;
  return <h2 className="publication-blocks__heading">{block.text}</h2>;
}

export function PublicationBlocksRenderer({ blocks, getAudioUrl, maxInitialPlaylistTracks = Number.POSITIVE_INFINITY }: PublicationBlocksRendererProps) {
  if (blocks.length === 0) return null;
  const hasPlaylistBlock = blocks.some((block) => block.type === "playlist");

  return (
    <div className="publication-blocks" data-testid="publication-blocks-renderer">
      <style>{`
        .publication-blocks { display: flex; flex-direction: column; gap: 16px; color: var(--token-colors-text-primary); }
        .publication-blocks__hero { padding: 20px; border: 1px solid var(--token-colors-border-default); border-radius: 16px; background: linear-gradient(135deg, var(--token-colors-surface-secondary), var(--token-colors-surface-tertiary)); }
        .publication-blocks__hero h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.1; }
        .publication-blocks__hero p { margin: 0; color: var(--token-colors-text-muted); }
        .publication-blocks__heading { margin: 8px 0 0; line-height: 1.2; }
        .publication-blocks__rich-text p { line-height: 1.6; }
        .publication-blocks__callout { padding: 12px 14px; border-radius: 12px; border: 1px solid var(--token-colors-border-default); background: var(--token-colors-surface-secondary); }
        .publication-blocks__callout[data-tone="warning"] { border-color: var(--token-colors-accent-amber); }
        .publication-blocks__callout[data-tone="promo"] { border-color: var(--token-colors-accent-cyan); }
        .publication-blocks__callout-title { font-weight: 700; margin-bottom: 6px; }
        .publication-blocks__playlist { padding: 14px; border: 1px solid var(--token-colors-border-default); border-radius: 14px; background: var(--token-colors-surface-secondary); }
        .publication-blocks__playlist--broadcast { gap: 12px; display: flex; flex-direction: column; }
        .publication-blocks__playlist-header { margin-bottom: 12px; }
        .publication-blocks__playlist-title { font-weight: 700; font-size: 18px; }
        .publication-blocks__playlist-description, .publication-blocks__empty-queue { color: var(--token-colors-text-muted); margin-top: 4px; }
        .publication-blocks__broadcast-hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr); gap: 14px; padding: 16px; border: 1px solid var(--token-colors-border-default); border-radius: 16px; background: linear-gradient(135deg, var(--token-colors-surface-tertiary), var(--token-colors-surface-secondary)); }
        .publication-blocks__broadcast-copy h2 { margin: 0 0 6px; font-size: 24px; line-height: 1.1; }
        .publication-blocks__broadcast-copy p { color: var(--token-colors-text-muted); margin: 0 0 10px; }
        .publication-blocks__eyebrow { color: var(--token-colors-accent-cyan); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
        .publication-blocks__now-card { padding: 12px; border-radius: 12px; background: var(--token-colors-surface-primary); border: 1px solid var(--token-colors-border-subtle); }
        .publication-blocks__broadcast-player { display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; }
        .publication-blocks__queue-count { align-self: flex-start; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--token-colors-border-default); color: var(--token-colors-text-muted); font-size: 12px; }
        .publication-blocks__queue { display: flex; flex-direction: column; gap: 4px; max-height: 420px; overflow: auto; padding-right: 4px; }
        .publication-blocks__queue-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--token-colors-text-secondary); text-align: left; cursor: pointer; }
        .publication-blocks__queue-row:hover, .publication-blocks__queue-row[data-active="true"] { border-color: var(--token-colors-border-default); background: var(--token-colors-surface-primary); color: var(--token-colors-text-primary); }
        .publication-blocks__queue-index { color: var(--token-colors-text-muted); font-size: 12px; text-align: right; }
        .publication-blocks__queue-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .publication-blocks__track-list { display: flex; flex-direction: column; gap: 10px; }
        .publication-blocks__track-card { padding: 10px; border: 1px solid var(--token-colors-border-subtle); border-radius: 10px; background: var(--token-colors-surface-primary); }
        .publication-blocks__track-main { display: flex; justify-content: space-between; gap: 12px; }
        .publication-blocks__track-title { font-weight: 650; }
        .publication-blocks__track-artist, .publication-blocks__track-description, .publication-blocks__duration { color: var(--token-colors-text-muted); font-size: 13px; }
        .publication-blocks__audio { width: 100%; margin-top: 8px; }
        .publication-blocks__labels { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .publication-blocks__labels span { padding: 2px 7px; border-radius: 999px; background: var(--token-colors-surface-tertiary); color: var(--token-colors-text-muted); font-size: 12px; }
        .publication-blocks__divider { border: 0; border-top: 1px solid var(--token-colors-border-default); width: 100%; }
        .publication-blocks__cta { display: inline-flex; align-self: flex-start; padding: 8px 12px; border-radius: 10px; text-decoration: none; background: var(--token-colors-accent-cyan); color: white; font-weight: 700; }
        .publication-blocks__cta[data-tone="secondary"] { background: var(--token-colors-surface-tertiary); color: var(--token-colors-text-primary); border: 1px solid var(--token-colors-border-default); }
        @media (max-width: 840px) { .publication-blocks__broadcast-hero { grid-template-columns: 1fr; } }
      `}</style>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <section key={block.id} className="publication-blocks__hero">
                <h1>{block.title}</h1>
                {block.subtitle ? <p>{block.subtitle}</p> : null}
                {!hasPlaylistBlock && block.audio_path && getAudioUrl ? <audio className="publication-blocks__audio" controls preload="none" src={getAudioUrl(block.audio_path)} /> : null}
              </section>
            );
          case "heading":
            return <section key={block.id}>{renderHeading(block)}</section>;
          case "rich_text":
            return <section key={block.id} className="publication-blocks__rich-text"><ReactMarkdown>{block.markdown}</ReactMarkdown></section>;
          case "callout":
            return (
              <aside key={block.id} className="publication-blocks__callout" data-tone={block.tone}>
                {block.title ? <div className="publication-blocks__callout-title">{block.title}</div> : null}
                <ReactMarkdown>{block.markdown}</ReactMarkdown>
              </aside>
            );
          case "playlist":
            return (
              <section key={block.id} className="publication-blocks__playlist" data-layout={block.layout}>
                <PlaylistPublicationView block={block} maxVisible={maxInitialPlaylistTracks} getAudioUrl={getAudioUrl} />
              </section>
            );
          case "track":
            return (
              <section key={block.id}>
                <TrackCard track={block.track} showDescription showDuration showLabels getAudioUrl={block.show_player === false ? undefined : getAudioUrl} />
                {block.commentary ? <div className="publication-blocks__rich-text"><ReactMarkdown>{block.commentary}</ReactMarkdown></div> : null}
              </section>
            );
          case "divider":
            return <hr key={block.id} className="publication-blocks__divider" />;
          case "cta":
            return <a key={block.id} className="publication-blocks__cta" data-tone={block.tone ?? "primary"} href={block.href}>{block.label}</a>;
          default:
            return null;
        }
      })}
    </div>
  );
}
