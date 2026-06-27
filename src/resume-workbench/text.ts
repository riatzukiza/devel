const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","in","is","it","of","on","or","that","the","to","was","were","will","with"
]);

export const normalizeText = (input: string): string => input
  .toLowerCase()
  .replace(/https?:\/\/\S+/g, " ")
  .replace(/[^a-z0-9+#./\-\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const tokenize = (input: string): readonly string[] => normalizeText(input)
  .split(" ")
  .map((token) => token.trim())
  .filter((token) => token.length > 1 && !STOPWORDS.has(token));

export const uniqueTokens = (input: string): readonly string[] => Array.from(new Set(tokenize(input)));

export const cosineSimilarity = (left: ReadonlyMap<string, number>, right: ReadonlyMap<string, number>): number => {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const value of left.values()) {
    leftNorm += value * value;
  }
  for (const value of right.values()) {
    rightNorm += value * value;
  }
  for (const [term, leftValue] of left.entries()) {
    const rightValue = right.get(term) ?? 0;
    dot += leftValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

export const termFrequency = (input: string): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const token of tokenize(input)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
};
