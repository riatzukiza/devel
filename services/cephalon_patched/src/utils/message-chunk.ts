/**
 * Discord Message Chunking Utility
 * 
 * Splits large messages into <= 4000 character chunks for Discord.
 * Attempts to split at sentence boundaries for readability.
 */

const DISCORD_MAX_LENGTH = 4000;

/**
 * Split a large message into chunks of <= 4000 characters
 */
export function chunkMessage(message: string, maxLength: number = DISCORD_MAX_LENGTH): string[] {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks: string[] = [];
  let remaining = message.trim();

  while (remaining.length > maxLength) {
    // Try to find a sentence boundary near the max length
    let splitIndex = findSentenceBoundary(remaining, maxLength);

    // If no sentence boundary found, split at word boundary
    if (splitIndex === -1) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }

    // If no space found, split at hard limit
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    const chunk = remaining.slice(0, splitIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Find the best sentence boundary for splitting
 * Looks for periods, question marks, exclamation points followed by space or newline
 */
function findSentenceBoundary(text: string, maxLength: number): number {
  // Search for sentence endings in the last portion of the text (to keep chunks balanced)
  const searchStart = Math.max(0, maxLength - 1000);
  const searchRegion = text.slice(searchStart, maxLength);

  // Try to find sentence endings: . ? ! followed by space or newline
  const sentenceEndRegex = /[.!?]\s+/g;
  let match: RegExpExecArray | null;

  let lastMatchIndex = -1;

  while ((match = sentenceEndRegex.exec(searchRegion)) !== null) {
    lastMatchIndex = match.index + match[0].length;
  }

  if (lastMatchIndex > 0) {
    return searchStart + lastMatchIndex;
  }

  return -1;
}

/**
 * Split a message into chunks and add continuation indicators
 */
export function chunkMessageWithContinuation(
  message: string, 
  maxLength: number = DISCORD_MAX_LENGTH,
  continuationPrefix: string = "... (cont)"
): string[] {
  const chunks = chunkMessage(message, maxLength - continuationPrefix.length);

  return chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }
    if (index === chunks.length - 1) {
      return `${continuationPrefix.replace('(cont)', '')} ${chunk}`;
    }
    return `${continuationPrefix} ${chunk}`;
  });
}

/**
 * Format a message with prefix and suffix while respecting Discord limits
 */
export function formatWithPrefixSuffix(
  content: string,
  prefix: string = "",
  suffix: string = "",
  maxLength: number = DISCORD_MAX_LENGTH
): string[] {
  const availableSpace = maxLength - prefix.length - suffix.length;
  
  if (availableSpace <= 0) {
    // Prefix/suffix too long, just chunk the content
    return chunkMessage(content, maxLength);
  }

  // Check if the whole thing fits
  const fullMessage = `${prefix}${content}${suffix}`;
  if (fullMessage.length <= maxLength) {
    return [fullMessage];
  }

  // Need to chunk - apply prefix to first, suffix to last
  const contentChunks = chunkMessage(content, availableSpace);

  if (contentChunks.length === 1) {
    return [`${prefix}${contentChunks[0]}${suffix}`];
  }

  return [
    `${prefix}${contentChunks[0]}`,
    ...contentChunks.slice(1, -1).map(c => `... ${c}`),
    `${contentChunks[contentChunks.length - 1]}${suffix}`
  ];
}

/**
 * Create a sequence of numbered chunks for long content
 */
export function createNumberedChunks(
  content: string,
  maxLength: number = DISCORD_MAX_LENGTH,
  title: string = "Part"
): string[] {
  const chunks = chunkMessage(content, maxLength - 50); // Leave room for "Part X/Y"
  
  return chunks.map((chunk, index) => {
    return `${title} ${index + 1}/${chunks.length}:\n${chunk}`;
  });
}
