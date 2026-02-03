/**
 * Discord message normalization
 * 
 * Implements the normalization spec from the MVP:
 * - Step A: Canonical whitespace + unicode
 * - Step B: Remove volatile tokens
 * - Step C: Mentions canonicalization
 * - Step D: URL canonicalization
 * - Step E: Embeds + attachments signature
 */

import { createHash } from 'crypto';
import type { 
  NormalizedDiscordMessage, 
  AttachmentSignature, 
  EmbedSignature,
  NormalizePolicy 
} from '../types/index.js';

// ============================================================================
// Unicode Normalization
// ============================================================================

/**
 * NFKC normalize text
 */
export function unicodeNfkc(text: string): string {
  return text.normalize('NFKC');
}

// ============================================================================
// URL Handling
// ============================================================================

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'ref', 'si', 'mc_cid', 'mc_eid'
]);

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) || [];
}

/**
 * Canonicalize a URL
 */
export function canonicalizeUrl(url: string, policy: NormalizePolicy): string {
  try {
    const urlObj = new URL(url);
    
    // Lowercase scheme and host
    urlObj.protocol = urlObj.protocol.toLowerCase();
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    // Remove tracking params if configured
    if (policy.stripTrackingParams) {
      for (const param of Array.from(urlObj.searchParams.keys())) {
        if (TRACKING_PARAMS.has(param.toLowerCase())) {
          urlObj.searchParams.delete(param);
        }
      }
    }
    
    // Drop fragment
    urlObj.hash = '';
    
    // Build canonical token
    const path = urlObj.pathname;
    const query = urlObj.searchParams.toString();
    const queryPart = query ? `?${query}` : '';
    
    return `<url ${urlObj.hostname}${path}${queryPart}>`;
  } catch {
    return '<url invalid>';
  }
}

// ============================================================================
// Attachment & Embed Signatures
// ============================================================================

export interface DiscordAttachment {
  id?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
}

/**
 * Compute attachment signature
 */
export function computeAttachmentSig(attachments: DiscordAttachment[]): AttachmentSignature {
  const types: string[] = [];
  const sizeBuckets: string[] = [];
  
  for (const att of attachments) {
    if (att.contentType) {
      types.push(att.contentType.split('/')[0] || 'unknown');
    }
    
    if (att.size) {
      if (att.size < 1024) sizeBuckets.push('tiny');
      else if (att.size < 1024 * 1024) sizeBuckets.push('small');
      else if (att.size < 10 * 1024 * 1024) sizeBuckets.push('medium');
      else sizeBuckets.push('large');
    }
  }
  
  return {
    count: attachments.length,
    types: [...new Set(types)],
    sizeBuckets: [...new Set(sizeBuckets)]
  };
}

/**
 * Compute embed signature
 */
export function computeEmbedSig(embeds: DiscordEmbed[]): EmbedSignature {
  if (embeds.length === 0) {
    return { count: 0 };
  }
  
  const primary = embeds[0];
  
  return {
    count: embeds.length,
    primaryUrlToken: primary.url ? canonicalizeUrl(primary.url, { volatileRewrites: [], stripTrackingParams: true }) : undefined,
    titleHash: primary.title ? createHash('sha256').update(primary.title).digest('hex').slice(0, 16) : undefined,
    descriptionHash: primary.description ? createHash('sha256').update(primary.description).digest('hex').slice(0, 16) : undefined
  };
}

// ============================================================================
// Tokenization & SimHash
// ============================================================================

const STOP_WORDS = new Set(['the', 'and', 'or', 'to', 'of', 'in', 'a']);

/**
 * Tokenize text for SimHash
 */
export function tokenize(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2)
    .filter(t => !STOP_WORDS.has(t));
  
  // Keep top 64 by frequency to prevent spam walls from dominating
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 64)
    .map(([token]) => token);
}

/**
 * Compute MurmurHash3 (128-bit, returns first 64 bits)
 */
function murmur3_128(key: string): bigint {
  // Simple implementation - in production use a proper murmur3 library
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  // Return 64-bit as bigint
  const lo = BigInt(h1 >>> 0);
  const hi = BigInt(h2 >>> 0);
  return (hi << 32n) | lo;
}

/**
 * Compute SimHash (64-bit)
 */
export function simhash64(tokens: string[]): bigint {
  const v = new Int32Array(64);
  
  for (const token of tokens) {
    const h = murmur3_128(token);
    
    for (let i = 0; i < 64; i++) {
      const bit = (h >> BigInt(i)) & 1n;
      v[i] += bit === 1n ? 1 : -1;
    }
  }
  
  let out = 0n;
  for (let i = 0; i < 64; i++) {
    if (v[i] > 0) {
      out |= 1n << BigInt(i);
    }
  }
  
  return out;
}

/**
 * Compute Hamming distance between two 64-bit hashes
 */
export function hamming64(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  
  while (x !== 0n) {
    x &= x - 1n;
    count++;
  }
  
  return count;
}

// ============================================================================
// JSON Canonicalization
// ============================================================================

/**
 * Canonical JSON for hashing
 */
export function jsonCanonical(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

// ============================================================================
// Main Normalization Function
// ============================================================================

export interface DiscordMessageEvent {
  guildId: string;
  channelId: string;
  messageId: string;
  authorId: string;
  authorIsBot: boolean;
  content: string;
  embeds: DiscordEmbed[];
  attachments: DiscordAttachment[];
}

/**
 * Normalize a Discord message according to the MVP spec
 */
export function normalizeDiscordMessage(
  event: DiscordMessageEvent,
  policy: NormalizePolicy
): NormalizedDiscordMessage {
  // Step A: Canonical whitespace + unicode
  let text = unicodeNfkc(event.content);
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.split('\n').map(line => line.trim()).join('\n');
  text = text.trim();
  
  // Step B: Remove volatile tokens
  for (const [pattern, replacement] of policy.volatileRewrites) {
    try {
      const regex = new RegExp(pattern, 'gi');
      text = text.replace(regex, replacement);
    } catch {
      // Skip invalid regex patterns
    }
  }
  
  // Step C: Mentions canonicalization
  text = text.replace(/<@!?(\d+)>/g, '<@user>');
  text = text.replace(/<@\u0026(\d+)>/g, '<@role>');
  text = text.replace(/<#(\d+)>/g, '<#channel>');
  // @everyone and @here are kept literal
  
  // Step D: URL canonicalization
  const urls = extractUrls(text);
  for (const url of urls) {
    const canonical = canonicalizeUrl(url, policy);
    text = text.replace(url, canonical);
  }
  
  // Step E: Compute signatures
  const attachmentSig = computeAttachmentSig(event.attachments);
  const embedSig = computeEmbedSig(event.embeds);
  
  // Compute exact-dupe key
  const dupKeyInput = [
    event.authorIsBot ? 'bot' : 'human',
    event.channelId,
    text,
    attachmentSig,
    embedSig
  ];
  const exactHash = createHash('sha256').update(jsonCanonical(dupKeyInput)).digest('hex');
  
  // Compute SimHash for near-dup detection
  const tokens = tokenize(text);
  const simhash = simhash64(tokens);
  
   return {
     normalizedText: text,
     signature: {
       authorKind: event.authorIsBot ? 'bot' : 'human',
       channelId: event.channelId,
       normalizedText: text,
       attachmentSig,
       embedSig
     },
     features: {
       tokens,
       simhash: simhash.toString(),  // Convert BigInt to string for JSON serialization
       hasUrl: urls.length > 0,
       mentionCount: (event.content.match(/<@/g) || []).length
     },
     exactHash
   };
}
