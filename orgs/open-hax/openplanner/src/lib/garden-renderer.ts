/**
 * Garden Renderer Service
 *
 * Renders markdown documents with uxx themes for garden publication.
 */

import { marked } from "marked";
import { codeToHtml, createHighlighter, type Highlighter } from "shiki";
import { extractPublicationBlocks as extractReactPublicationBlocks } from "@open-hax/garden-publication-components";
import { renderPublicationBlocksHtml, serializeGardenPublicationProps } from "@open-hax/garden-publication-components/server";
import type { GardenDocument } from "./mongodb.js";

export type ThemeName = "monokai" | "night-owl" | "proxy-console";

export interface GardenRenderOptions {
  /** Include full HTML document wrapper */
  fullDocument?: boolean;
  /** Include garden navigation */
  includeNav?: boolean;
  /** Base URL for links */
  baseUrl?: string;
  /** Requested language for translation */
  requestedLanguage?: string;
  /** Available target languages for this garden */
  targetLanguages?: string[];
  /** Languages that have translations available with their status */
  translations?: { language: string; status: string }[];
}

export interface GardenDocumentInput {
  title: string;
  content: string;
  source_path?: string | null;
  language?: string;
  metadata?: Record<string, unknown>;
  translationStatus?: "pending" | "in_review" | "approved" | "rejected";
  /** Available languages including the source language */
  availableLanguages?: string[];
}


// Shiki theme mapping
const SHIKI_THEMES: Record<ThemeName, string> = {
  monokai: "vitesse-dark",
  "night-owl": "night-owl",
  "proxy-console": "github-dark",
};

// Cache for highlighter instance
let highlighterCache: Highlighter | null = null;

/**
 * Get or create a shiki highlighter instance
 */
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterCache) {
    highlighterCache = await createHighlighter({
      themes: ["vitesse-dark", "night-owl", "github-dark"],
      langs: ["javascript", "typescript", "python", "bash", "json", "markdown", "html", "css", "yaml", "rust", "go"],
    });
  }
  return highlighterCache;
}

// Theme CSS variable definitions (matching uxx tokens)
const THEME_VARS: Record<ThemeName, Record<string, string>> = {
  monokai: {
    "--uxx-colors-text-default": "#f8f8f2",
    "--uxx-colors-text-muted": "#a6a6a6",
    "--uxx-colors-text-subtle": "#75715e",
    "--uxx-colors-bg-default": "#272822",
    "--uxx-colors-bg-subtle": "#1e1f1c",
    "--uxx-colors-bg-elevated": "#3e3d32",
    "--uxx-colors-border-default": "#3e3d32",
    "--uxx-colors-border-subtle": "#2d2e27",
    "--uxx-colors-accent-cyan": "#66d9ef",
    "--uxx-colors-accent-green": "#a6e22e",
    "--uxx-colors-accent-orange": "#fd971f",
    "--uxx-colors-accent-purple": "#ae81ff",
    "--uxx-colors-accent-pink": "#f92672",
    "--uxx-colors-accent-yellow": "#e6db74",
    "--uxx-font-family-sans": "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
    "--uxx-font-family-mono": "'JetBrains Mono', 'Fira Code', monospace",
    "--uxx-radius-sm": "4px",
    "--uxx-radius-md": "4px",
  },
  "night-owl": {
    "--uxx-colors-text-default": "#d6deeb",
    "--uxx-colors-text-muted": "#9eaebe",
    "--uxx-colors-text-subtle": "#637777",
    "--uxx-colors-bg-default": "#011627",
    "--uxx-colors-bg-subtle": "#010b14",
    "--uxx-colors-bg-elevated": "#021f35",
    "--uxx-colors-border-default": "#1f3a52",
    "--uxx-colors-border-subtle": "#0f283e",
    "--uxx-colors-accent-cyan": "#82aaff",
    "--uxx-colors-accent-green": "#c5e478",
    "--uxx-colors-accent-orange": "#f78c6c",
    "--uxx-colors-accent-purple": "#c792ea",
    "--uxx-colors-accent-pink": "#f07178",
    "--uxx-colors-accent-yellow": "#ffcb6b",
    "--uxx-font-family-sans": "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
    "--uxx-font-family-mono": "'JetBrains Mono', 'Fira Code', monospace",
    "--uxx-radius-sm": "4px",
    "--uxx-radius-md": "4px",
  },
  "proxy-console": {
    "--uxx-colors-text-default": "#e0e0e0",
    "--uxx-colors-text-muted": "#a0a0a0",
    "--uxx-colors-text-subtle": "#606060",
    "--uxx-colors-bg-default": "#0a0a0a",
    "--uxx-colors-bg-subtle": "#050505",
    "--uxx-colors-bg-elevated": "#151515",
    "--uxx-colors-border-default": "#252525",
    "--uxx-colors-border-subtle": "#1a1a1a",
    "--uxx-colors-accent-cyan": "#00d4ff",
    "--uxx-colors-accent-green": "#4ade80",
    "--uxx-colors-accent-orange": "#fb923c",
    "--uxx-colors-accent-purple": "#a78bfa",
    "--uxx-colors-accent-pink": "#f472b6",
    "--uxx-colors-accent-yellow": "#facc15",
    "--uxx-font-family-sans": "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
    "--uxx-font-family-mono": "'JetBrains Mono', 'Fira Code', monospace",
    "--uxx-radius-sm": "4px",
    "--uxx-radius-md": "4px",
  },
};

/**
 * Get theme name from garden, with fallback
 */
export function getThemeName(garden: GardenDocument): ThemeName {
  const theme = garden.theme as ThemeName;
  if (theme && THEME_VARS[theme]) {
    return theme;
  }
  return "monokai";
}

/**
 * Generate CSS variables for a theme
 */
export function getThemeCss(theme: ThemeName): string {
  const vars = THEME_VARS[theme];
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n    ");
}

/**
 * Render navigation HTML
 */
function renderNav(
  garden: GardenDocument,
  options: GardenRenderOptions
): string {
  if (!garden.nav?.items?.length) {
    return "";
  }

  const pageUrl = options.baseUrl ?? `/gardens/${garden.garden_id}`;
  const baseUrl = /\/html\/[^/?#]+(?:[?#].*)?$/.test(pageUrl)
    ? getGardenIndexUrl(pageUrl)
    : pageUrl;

  const renderNavItem = (item: { label: string; path: string; children?: { label: string; path: string }[] }): string => {
    const hasChildren = item.children && item.children.length > 0;
    const href = `${baseUrl}${item.path}`;

    if (hasChildren) {
      return `
      <li class="garden-nav-item garden-nav-group">
        <span class="garden-nav-label">${escapeHtml(item.label)}</span>
        <ul class="garden-nav-children">
          ${item.children!.map(child => `
            <li class="garden-nav-child">
              <a href="${baseUrl}${escapeHtml(child.path)}">${escapeHtml(child.label)}</a>
            </li>
          `).join("")}
        </ul>
      </li>`;
    }

    return `
      <li class="garden-nav-item">
        <a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a>
      </li>`;
  };

  return `
  <nav class="garden-nav" aria-label="Garden navigation">
    <ul class="garden-nav-list">
      ${garden.nav.items.map(renderNavItem).join("")}
    </ul>
  </nav>`;
}

function getGardenIndexUrl(baseUrl: string): string {
  return baseUrl.replace(/\/[^/?#]+(?=([?#].*)?$)/, "");
}

function renderGlobalLinks(gardenHomeUrl: string, knoxxHomeUrl = "/"): string {
  return `
  <div class="garden-global-links" aria-label="Page links">
    <a class="garden-global-link" href="${escapeHtml(gardenHomeUrl)}">← Published documents</a>
    <a class="garden-global-link" href="${escapeHtml(knoxxHomeUrl)}">Knoxx home</a>
  </div>`;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Configure marked options
 */
function configureMarked(): void {
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
}

/**
 * Highlight code with shiki
 */
async function highlightCode(
  code: string,
  lang: string | undefined,
  theme: ThemeName
): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const shikiTheme = SHIKI_THEMES[theme];
    
    // Normalize language name
    const normalizedLang = lang?.toLowerCase() || "text";
    
    // Check if language is supported
    const loadedLangs = highlighter.getLoadedLanguages();
    const safeLang = loadedLangs.includes(normalizedLang) ? normalizedLang : "text";
    
    const html = await codeToHtml(code, {
      lang: safeLang,
      theme: shikiTheme,
    });
    
    return html;
  } catch {
    // Fallback to plain code block if highlighting fails
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

/**
 * Render markdown content to HTML with theme styling and syntax highlighting
 */
export async function renderMarkdown(
  content: string,
  theme: ThemeName
): Promise<string> {
  configureMarked();

  // Custom renderer for code blocks.
  //
  // marked does not support async renderers, so we capture each code block's
  // raw text/lang into a side array during the synchronous parse and emit an
  // opaque, index-keyed placeholder token. Afterwards we highlight each block
  // asynchronously and splice the results back in by index. This avoids the
  // previous regex (which depended on `[^<]*` over HTML-escaped content and on
  // String.replace special-pattern semantics for the substituted HTML).
  const renderer = new marked.Renderer();
  const codeBlocks: Array<{ text: string; lang?: string }> = [];

  renderer.code = function({ text, lang }: { text: string; lang?: string }) {
    const index = codeBlocks.length;
    codeBlocks.push({ text, lang });
    return `<!--SHIKI-PLACEHOLDER-${index}-->`;
  };

  // Parse markdown to HTML with custom renderer
  let html = marked.parse(content, { renderer }) as string;

  // Highlight each captured block, then substitute placeholders by index.
  // Using split/join with the literal token avoids regex-replacement pitfalls
  // (e.g. `$&` / `$1` sequences appearing inside highlighted code).
  for (let index = 0; index < codeBlocks.length; index += 1) {
    const { text, lang } = codeBlocks[index];
    const highlighted = await highlightCode(text, lang, theme);
    html = html.split(`<!--SHIKI-PLACEHOLDER-${index}-->`).join(highlighted);
  }

  // Wrap with themed styling
  return `
  <div class="garden-content">
    ${html}
  </div>`;
}

function safeDomId(value: unknown): string {
  return String(value ?? "playlist").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "playlist";
}

async function renderPublicationBlocks(metadata: unknown, _theme: ThemeName): Promise<string | null> {
  const blocks = extractReactPublicationBlocks(metadata);
  if (blocks.length === 0) return null;
  const rootId = `garden-publication-${safeDomId(blocks.map((block) => block.id).join("-"))}`;
  const props = { blocks, maxInitialPlaylistTracks: 100, audioUrlBase: "/api/studio/stream" };
  const rendered = renderPublicationBlocksHtml(props);
  return `
    <div class="garden-content garden-publication-react">
      <link rel="stylesheet" href="/api/openplanner/v1/public/assets/style.css">
      <div id="${rootId}">${rendered}</div>
      <script type="application/json" data-garden-publication-props data-garden-publication-root="${rootId}">${serializeGardenPublicationProps(props)}</script>
      <script type="module" src="/api/openplanner/v1/public/assets/garden-publication-app.js"></script>
    </div>`;
}

/**
 * Render translation status banner
 */
function renderTranslationBanner(
  translationStatus: "pending" | "in_review" | "approved" | "rejected" | undefined,
  language: string
): string {
  if (!translationStatus || translationStatus === "approved") {
    return "";
  }

  const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
    pending: { label: "Pending Review", class: "warning", icon: "⚠️" },
    in_review: { label: "In Review", class: "info", icon: "📝" },
    rejected: { label: "Rejected", class: "error", icon: "❌" },
  };

  const config = statusConfig[translationStatus] ?? statusConfig.pending;

  return `
  <div class="translation-banner translation-banner--${config.class}" role="status">
    <span class="translation-banner__icon">${config.icon}</span>
    <span class="translation-banner__text">
      This is a <strong>${config.label}</strong> translation in <strong>${language}</strong>.
      Content may be inaccurate until reviewed.
    </span>
  </div>`;
}

/**
 * Render language selector
 */
function renderLanguageSelector(
  currentLanguage: string,
  defaultLanguage: string,
  targetLanguages: string[] | undefined,
  baseUrl: string,
  availableLanguages?: string[],
  translations?: { language: string; status: string }[]
): string {
  if (!targetLanguages || targetLanguages.length === 0) {
    return "";
  }

  const allLanguages = [defaultLanguage, ...targetLanguages];
  const uniqueLanguages = [...new Set(allLanguages)];

  const languageNames: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    ja: "日本語",
    zh: "中文",
    ko: "한국어",
    pt: "Português",
    ru: "Русский",
    it: "Italiano",
  };

  const translationStatus = new Map((translations ?? []).map(t => [t.language, t.status]));
  const hasTranslation = (lang: string) => (availableLanguages ?? []).includes(lang);

  const options = uniqueLanguages.map(lang => {
    const isSelected = lang === currentLanguage;
    const selectedAttr = isSelected ? ' selected' : '';
    const name = languageNames[lang] ?? lang;
    const isAvailable = hasTranslation(lang);
    const status = translationStatus.get(lang);
    
    // Show status indicator
    let indicator = '';
    if (lang !== defaultLanguage) {
      if (isAvailable && status === 'available') {
        indicator = ' ✓'; // Translation available
      } else if (isAvailable) {
        indicator = ` (${status})`; // Has segments but not fully ready
      } else {
        indicator = ' (pending)'; // Not yet translated
      }
    }
    
    return `<option value="${lang}"${selectedAttr}>${name}${indicator}</option>`;
  }).join("");

  return `
  <div class="language-selector">
    <label for="language-select" class="language-selector__label">Language:</label>
    <select id="language-select" class="language-selector__select" onchange="window.location.href='${baseUrl}' + (this.value !== '${defaultLanguage}' ? '?language=' + this.value : '')">
      ${options}
    </select>
  </div>`;
}

/**
 * Render a full garden page with navigation and themed content
 */
export async function renderGardenPage(
  garden: GardenDocument,
  document: GardenDocumentInput,
  options: GardenRenderOptions = {}
): Promise<string> {
  const theme = getThemeName(garden);
  const themeCss = getThemeCss(theme);
  const pageUrl = options.baseUrl ?? `/gardens/${garden.garden_id}`;
  const gardenHomeUrl = getGardenIndexUrl(pageUrl);
  const globalLinksHtml = renderGlobalLinks(gardenHomeUrl);
  const navHtml = options.includeNav !== false ? renderNav(garden, options) : "";
  const contentHtml = await renderPublicationBlocks(document.metadata, theme) ?? await renderMarkdown(document.content, theme);
  const translationBanner = renderTranslationBanner(document.translationStatus, document.language ?? "en");
  const languageSelector = renderLanguageSelector(
    document.language ?? "en",
    garden.default_language ?? "en",
    options.targetLanguages,
    pageUrl,
    document.availableLanguages,
    options.translations
  );

  if (!options.fullDocument) {
    return `
    <div class="garden-page" data-theme="${theme}">
      <style>${getGardenStyles()}</style>
      <style>:root { ${themeCss} }</style>
      ${globalLinksHtml}
      ${navHtml}
      <main class="garden-main">
        ${translationBanner}
        ${languageSelector}
        <header class="garden-header">
          <h1>${escapeHtml(document.title)}</h1>
          ${document.source_path ? `<p class="garden-path">${escapeHtml(document.source_path)}</p>` : ""}
        </header>
        ${contentHtml}
      </main>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="${document.language ?? "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(document.title)} - ${escapeHtml(garden.title)}</title>
  <style>${getGardenStyles()}</style>
  <style>:root { ${themeCss} }</style>
</head>
<body class="garden-body" data-theme="${theme}">
  <div class="garden-page">
    <header class="garden-header-global">
      <div class="garden-header-topline">
        <div>
          <h1 class="garden-title">${escapeHtml(garden.title)}</h1>
          ${garden.description ? `<p class="garden-description">${escapeHtml(garden.description)}</p>` : ""}
        </div>
        ${globalLinksHtml}
      </div>
    </header>
    ${navHtml}
    <main class="garden-main">
      ${translationBanner}
      ${languageSelector}
      <article class="garden-article">
        <header class="garden-header">
          <h1>${escapeHtml(document.title)}</h1>
          ${document.source_path ? `<p class="garden-path">${escapeHtml(document.source_path)}</p>` : ""}
        </header>
        ${contentHtml}
      </article>
    </main>
    <footer class="garden-footer">
      <p>Powered by <a href="https://github.com/open-hax/openplanner">OpenPlanner Gardens</a></p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Render a garden index/landing page
 */
export async function renderGardenIndex(
  garden: GardenDocument,
  documents: Array<{
    doc_id: string;
    title: string;
    source_path?: string | null;
    language?: string;
  }>,
  options: GardenRenderOptions = {}
): Promise<string> {
  const theme = getThemeName(garden);
  const themeCss = getThemeCss(theme);
  const navHtml = options.includeNav !== false ? renderNav(garden, options) : "";
  const baseUrl = options.baseUrl ?? `/gardens/${garden.garden_id}`;
  const globalLinksHtml = renderGlobalLinks(baseUrl);

  const documentsHtml = documents.length > 0
    ? `
    <ul class="garden-document-list">
      ${documents.map(doc => `
        <li class="garden-document-item">
          <a href="${baseUrl}/${doc.doc_id}">
            <span class="doc-title">${escapeHtml(doc.title)}</span>
            ${doc.source_path ? `<span class="doc-path">${escapeHtml(doc.source_path)}</span>` : ""}
          </a>
        </li>
      `).join("")}
    </ul>`
    : `<p class="garden-empty">No documents published yet.</p>`;

  if (!options.fullDocument) {
    return `
    <div class="garden-page" data-theme="${theme}">
      <style>${getGardenStyles()}</style>
      <style>:root { ${themeCss} }</style>
      ${globalLinksHtml}
      ${navHtml}
      <main class="garden-main">
        <header class="garden-header">
          <h1>${escapeHtml(garden.title)}</h1>
          ${garden.description ? `<p class="garden-description">${escapeHtml(garden.description)}</p>` : ""}
        </header>
        ${documentsHtml}
      </main>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(garden.title)}</title>
  <style>${getGardenStyles()}</style>
  <style>:root { ${themeCss} }</style>
</head>
<body class="garden-body" data-theme="${theme}">
  <div class="garden-page">
    <header class="garden-header-global">
      <div class="garden-header-topline">
        <div>
          <h1 class="garden-title">${escapeHtml(garden.title)}</h1>
          ${garden.description ? `<p class="garden-description">${escapeHtml(garden.description)}</p>` : ""}
        </div>
        ${globalLinksHtml}
      </div>
    </header>
    ${navHtml}
    <main class="garden-main">
      ${documentsHtml}
    </main>
    <footer class="garden-footer">
      <p>Powered by <a href="https://github.com/open-hax/openplanner">OpenPlanner Gardens</a></p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Get base garden styles
 */
function getGardenStyles(): string {
  return `
    * {
      box-sizing: border-box;
    }

    .garden-body {
      margin: 0;
      padding: 0;
      font-family: var(--uxx-font-family-sans);
      background: var(--uxx-colors-bg-default);
      color: var(--uxx-colors-text-default);
      line-height: 1.6;
    }

    .garden-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .garden-header-global {
      padding: 24px 32px;
      border-bottom: 1px solid var(--uxx-colors-border-default);
      background: var(--uxx-colors-bg-subtle);
    }

    .garden-header-topline {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .garden-title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--uxx-colors-text-default);
    }

    .garden-global-links {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .garden-global-link {
      color: var(--uxx-colors-accent-cyan);
      text-decoration: none;
      font-size: 14px;
      white-space: nowrap;
    }

    .garden-global-link:hover {
      text-decoration: underline;
    }

    .garden-description {
      margin: 8px 0 0;
      color: var(--uxx-colors-text-muted);
    }

    .garden-nav {
      padding: 16px 32px;
      border-bottom: 1px solid var(--uxx-colors-border-default);
      background: var(--uxx-colors-bg-subtle);
    }

    .garden-nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 24px;
    }

    .garden-nav-item a,
    .garden-nav-label {
      color: var(--uxx-colors-text-muted);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .garden-nav-item a:hover {
      color: var(--uxx-colors-accent-cyan);
    }

    .garden-nav-group {
      position: relative;
    }

    .garden-nav-children {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      list-style: none;
      margin: 8px 0 0;
      padding: 8px 0;
      background: var(--uxx-colors-bg-elevated);
      border: 1px solid var(--uxx-colors-border-default);
      border-radius: var(--uxx-radius-sm);
      min-width: 150px;
      z-index: 100;
    }

    .garden-nav-group:hover .garden-nav-children {
      display: block;
    }

    .garden-nav-child a {
      display: block;
      padding: 6px 16px;
    }

    .garden-main {
      flex: 1;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }

    .garden-header {
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--uxx-colors-border-subtle);
    }

    .garden-header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: var(--uxx-colors-text-default);
    }

    .garden-path {
      margin: 8px 0 0;
      font-family: var(--uxx-font-family-mono);
      font-size: 12px;
      color: var(--uxx-colors-text-subtle);
    }

    .garden-content {
      font-size: 15px;
      line-height: 1.7;
    }

    .garden-content h1,
    .garden-content h2,
    .garden-content h3,
    .garden-content h4,
    .garden-content h5,
    .garden-content h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      color: var(--uxx-colors-text-default);
    }

    .garden-content h1 { font-size: 28px; }
    .garden-content h2 { font-size: 24px; }
    .garden-content h3 { font-size: 20px; }
    .garden-content h4 { font-size: 18px; }
    .garden-content h5 { font-size: 16px; }
    .garden-content h6 { font-size: 14px; }

    .garden-content p {
      margin: 0 0 16px;
    }

    .garden-content a {
      color: var(--uxx-colors-accent-cyan);
      text-decoration: none;
    }

    .garden-content a:hover {
      text-decoration: underline;
    }

    .garden-content code {
      padding: 2px 6px;
      background: var(--uxx-colors-bg-elevated);
      border-radius: var(--uxx-radius-sm);
      font-family: var(--uxx-font-family-mono);
      font-size: 0.9em;
    }

    .garden-content pre {
      margin: 16px 0;
      padding: 16px;
      background: var(--uxx-colors-bg-subtle);
      border-radius: var(--uxx-radius-md);
      overflow-x: auto;
    }

    .garden-content pre code {
      padding: 0;
      background: transparent;
    }

    /* Shiki syntax highlighting */
    .garden-content pre.shiki {
      margin: 16px 0;
      padding: 16px;
      border-radius: var(--uxx-radius-md);
      overflow-x: auto;
    }

    .garden-content pre.shiki code {
      padding: 0;
      background: transparent;
      font-family: var(--uxx-font-family-mono);
      font-size: 14px;
      line-height: 1.5;
    }

    .garden-content blockquote {
      margin: 16px 0;
      padding: 8px 16px;
      border-left: 4px solid var(--uxx-colors-accent-cyan);
      background: var(--uxx-colors-bg-elevated);
      color: var(--uxx-colors-text-muted);
    }

    .garden-content ul,
    .garden-content ol {
      margin: 0 0 16px;
      padding-left: 24px;
    }

    .garden-content li {
      margin-bottom: 4px;
    }

    .garden-content table {
      width: 100%;
      margin: 16px 0;
      border-collapse: collapse;
    }

    .garden-content th,
    .garden-content td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--uxx-colors-border-default);
      text-align: left;
    }

    .garden-content th {
      font-weight: 600;
      color: var(--uxx-colors-text-default);
    }

    .garden-content hr {
      border: none;
      height: 1px;
      background: var(--uxx-colors-border-default);
      margin: 24px 0;
    }

    .garden-content img {
      max-width: 100%;
      height: auto;
      border-radius: var(--uxx-radius-md);
    }

    .garden-publication-react {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    @media (max-width: 720px) {
      .garden-main {
        padding: 20px;
      }
    }

    .garden-document-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .garden-document-item {
      margin-bottom: 8px;
    }

    .garden-document-item a {
      display: block;
      padding: 12px 16px;
      background: var(--uxx-colors-bg-subtle);
      border: 1px solid var(--uxx-colors-border-default);
      border-radius: var(--uxx-radius-md);
      text-decoration: none;
      transition: border-color 0.2s, background 0.2s;
    }

    .garden-document-item a:hover {
      border-color: var(--uxx-colors-accent-cyan);
      background: var(--uxx-colors-bg-elevated);
    }

    .garden-document-item .doc-title {
      display: block;
      color: var(--uxx-colors-text-default);
      font-weight: 500;
    }

    .garden-document-item .doc-path {
      display: block;
      margin-top: 4px;
      font-family: var(--uxx-font-family-mono);
      font-size: 12px;
      color: var(--uxx-colors-text-subtle);
    }

    .garden-empty {
      color: var(--uxx-colors-text-muted);
      font-style: italic;
    }

    .garden-footer {
      padding: 24px 32px;
      border-top: 1px solid var(--uxx-colors-border-default);
      background: var(--uxx-colors-bg-subtle);
      text-align: center;
      font-size: 13px;
      color: var(--uxx-colors-text-subtle);
    }

    .garden-footer a {
      color: var(--uxx-colors-accent-cyan);
      text-decoration: none;
    }

    /* Translation status banner */
    .translation-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--uxx-radius-md);
      margin-bottom: 24px;
      font-size: 14px;
    }

    .translation-banner--warning {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: #fbbf24;
    }

    .translation-banner--info {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
    }

    .translation-banner--error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .translation-banner__icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .translation-banner__text {
      line-height: 1.5;
    }

    .translation-banner__text strong {
      color: inherit;
    }

    /* Language selector */
    .language-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: var(--uxx-colors-bg-subtle);
      border: 1px solid var(--uxx-colors-border-default);
      border-radius: var(--uxx-radius-md);
    }

    .language-selector__label {
      font-size: 14px;
      color: var(--uxx-colors-text-muted);
      font-weight: 500;
    }

    .language-selector__select {
      padding: 6px 12px;
      background: var(--uxx-colors-bg-elevated);
      border: 1px solid var(--uxx-colors-border-default);
      border-radius: var(--uxx-radius-sm);
      color: var(--uxx-colors-text-default);
      font-family: var(--uxx-font-family-sans);
      font-size: 14px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .language-selector__select:hover {
      border-color: var(--uxx-colors-accent-cyan);
    }

    .language-selector__select:focus {
      outline: none;
      border-color: var(--uxx-colors-accent-cyan);
      box-shadow: 0 0 0 2px rgba(102, 217, 239, 0.2);
    }
  `;
}
