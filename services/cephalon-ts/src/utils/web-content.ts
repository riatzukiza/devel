/**
 * Web content fetching utility
 * 
 * Provides content type detection and fetching for URLs encountered in messages.
 * Supports:
 * - Images (returns Buffer for later processing)
 * - PDF documents (returns Buffer for later conversion)
 * - HTML pages (converts to Markdown using Turndown)
 * - Plain text
 */

import TurndownService from 'turndown';

// Type for Turndown replacement function
type ReplacementFunction = (content: string, node: unknown) => string;

// Initialize Turndown service with common options
const turndownService = new TurndownService({
  headingStyle: 'atx',  // Use # for headings
  codeBlockStyle: 'fenced',  // Use ``` for code blocks
  bulletListMarker: '-',  // Use - for bullet lists
});

// Add custom rules for better markdown output
turndownService.addRule('preformatted', {
  filter: ['pre', 'code'],
  replacement: function(content: string, node: unknown): string {
    const element = node as { tagName?: string; parentElement?: { tagName?: string } };
    const tagName = element.tagName?.toUpperCase();
    if (tagName === 'PRE') {
      return '\n```\n' + content + '\n```\n';
    }
    if (tagName === 'CODE') {
      const parent = element.parentElement;
      if (parent && parent.tagName?.toUpperCase() === 'PRE') {
        return content;
      }
      return '`' + content + '`';
    }
    return content;
  }
});

turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: function(content: string): string {
    return '~~' + content + '~~';
  }
});

export type ContentType = 'image' | 'pdf' | 'html' | 'text' | 'markdown' | 'other';

export interface FetchedContent {
  type: ContentType;
  content: Buffer | string;
  contentType: string;
  url: string;
  size?: number;
}

/**
 * Fetch URL and detect content type
 * Uses HEAD request first to check Content-Type, then fetches body if needed
 */
export async function fetchUrlContent(url: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching: ${url}`);
  
  try {
    // First, do a HEAD request to check Content-Type
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Cephalon/1.0 (Discord bot)',
      },
    });

    if (!headResponse.ok) {
      throw new Error(`HEAD request failed: ${headResponse.status} ${headResponse.statusText}`);
    }

    const contentType = headResponse.headers.get('content-type') || 'application/octet-stream';
    console.log(`[WebContent] Content-Type: ${contentType}`);

    // Determine content type category
    if (contentType.startsWith('image/')) {
      return fetchImage(url, contentType);
    } else if (contentType === 'application/pdf' || url.toLowerCase().endsWith('.pdf')) {
      return fetchPdf(url, contentType);
    } else if (contentType.startsWith('text/html')) {
      return fetchHtml(url, contentType);
    } else if (contentType.startsWith('text/')) {
      return fetchText(url, contentType);
    } else {
      // For unknown types, try to fetch as binary and return as other
      console.log(`[WebContent] Unknown content type, fetching as binary: ${contentType}`);
      return fetchOther(url, contentType);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[WebContent] Error fetching ${url}: ${errorMsg}`);
    throw error;
  }
}

/**
 * Fetch image content
 */
async function fetchImage(url: string, contentType: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching image: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`[WebContent] Image fetched: ${buffer.length} bytes, type: ${contentType}`);

  return {
    type: 'image',
    content: buffer,
    contentType,
    url,
    size: buffer.length,
  };
}

/**
 * Fetch PDF content
 */
async function fetchPdf(url: string, contentType: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching PDF: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`[WebContent] PDF fetched: ${buffer.length} bytes`);

  return {
    type: 'pdf',
    content: buffer,
    contentType,
    url,
    size: buffer.length,
  };
}

/**
 * Fetch HTML content and convert to Markdown using Turndown
 */
async function fetchHtml(url: string, contentType: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching HTML: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  
  console.log(`[WebContent] HTML fetched: ${html.length} characters`);
  console.log(`[WebContent] Converting HTML to Markdown using Turndown`);

  const startTime = Date.now();
  const markdown = turndownService.turndown(html);
  const duration = Date.now() - startTime;

  console.log(`[WebContent] Markdown generated: ${markdown.length} characters in ${duration}ms`);

  return {
    type: 'markdown',
    content: markdown,
    contentType: 'text/markdown',
    url,
    size: markdown.length,
  };
}

/**
 * Fetch plain text content
 */
async function fetchText(url: string, contentType: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching text: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch text: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  
  console.log(`[WebContent] Text fetched: ${text.length} characters`);

  return {
    type: 'text',
    content: text,
    contentType,
    url,
    size: text.length,
  };
}

/**
 * Fetch unknown content type as binary
 */
async function fetchOther(url: string, contentType: string): Promise<FetchedContent> {
  console.log(`[WebContent] Fetching other content: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`[WebContent] Content fetched: ${buffer.length} bytes`);

  return {
    type: 'other',
    content: buffer,
    contentType,
    url,
    size: buffer.length,
  };
}

/**
 * Extract URLs from text content
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Check if text contains image URLs
 */
export function containsImageUrls(text: string): boolean {
  const urls = extractUrls(text);
  return urls.some(url => {
    const lower = url.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|avif)(\?.*)?$/i.test(lower) ||
           /\/img\/|\/image\/|\/pic\//i.test(lower);
  });
}
