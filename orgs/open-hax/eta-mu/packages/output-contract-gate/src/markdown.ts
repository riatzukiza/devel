import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

import type { ExtractedDocument, ExtractedSection, MarkdownNode, MarkdownRoot } from './types.js';

const hasChildren = (node: MarkdownNode | undefined): node is MarkdownNode & { readonly children: readonly MarkdownNode[] } =>
  Boolean(node && Array.isArray(node.children));

export const nodeText = (node: MarkdownNode | undefined): string => {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (hasChildren(node)) return node.children.map((child) => nodeText(child)).join('');
  return '';
};

export const parseMarkdownAst = (markdown: string): MarkdownRoot =>
  unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownRoot;

/**
 * Detect paragraphs that consist solely of a bold/strong phrase on its own line,
 * which agents commonly use in place of `## Heading` markdown headers.
 * Converts them to proper h2 heading nodes in the AST so the validator can
 * match them against the contract's section definitions.
 *
 * Patterns detected:
 *   **Signal**          → ## Signal
 *   **Signal**          → ## Signal  (with trailing whitespace)
 *   __Signal__          → ## Signal
 *   **Some Heading:**   → ## Some Heading  (trailing colon stripped)
 */
const KNOWN_SECTION_NAMES = new Set([
  'signal', 'evidence', 'frames', 'countermoves', 'next',
]);

const normalizeBoldHeadings = (ast: MarkdownRoot): void => {
  const children = ast.children as MarkdownNode[];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type !== 'paragraph' || !hasChildren(node)) continue;
    if (node.children.length !== 1 && node.children.length !== 2) continue;

    const first = node.children[0];
    if (first.type !== 'strong' || !hasChildren(first)) continue;

    // Skip if the strong node has more than one child (e.g., **Signal** and more)
    if (first.children.length !== 1) continue;
    const textChild = first.children[0];
    if (textChild.type !== 'text') continue;

    let headingText = (textChild.value as string).trim();

    // If there's a second child that's just whitespace, ignore it
    if (node.children.length === 2) {
      const second = node.children[1];
      if (second.type !== 'text' || (second.value as string).trim() !== '') continue;
    }

    // Strip trailing colon (agents sometimes write **Signal:**)
    if (headingText.endsWith(':')) {
      headingText = headingText.slice(0, -1).trim();
    }

    // Convert to h2 heading ONLY if the text matches a known contract section name.
    // We do NOT use a generic "looks like heading" heuristic because it causes
    // false positives: bold subheadings like **Core Architecture:** inside sections
    // would be misinterpreted as section headers, breaking section order validation.
    const lowerText = headingText.toLowerCase();
    const isKnownSection = KNOWN_SECTION_NAMES.has(lowerText);

    if (isKnownSection) {
      children[i] = {
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: headingText }],
      } as unknown as MarkdownNode;
    }
  }
};

export const extractMarkdownSections = (markdown: string): ExtractedDocument => {
  const ast = parseMarkdownAst(markdown);

  // Pre-pass: normalize bold-as-heading patterns before extraction
  normalizeBoldHeadings(ast);

  const prefaceNodes: MarkdownNode[] = [];
  const sections: ExtractedSection[] = [];
  let current: ExtractedSection | undefined;

  for (const node of ast.children ?? []) {
    if (node.type === 'heading' && node.depth === 2) {
      current = {
        heading: nodeText(node).trim(),
        nodes: [],
      };
      sections.push(current);
      continue;
    }

    if (current) {
      (current.nodes as MarkdownNode[]).push(node);
    } else {
      prefaceNodes.push(node);
    }
  }

  return { ast, prefaceNodes, sections };
};

export const countSemanticItems = (section: ExtractedSection): number => {
  let count = 0;
  for (const node of section.nodes) {
    if (node.type === 'list' && hasChildren(node)) {
      count += node.children.length;
      continue;
    }

    if (['paragraph', 'blockquote', 'code', 'table'].includes(node.type)) {
      count += 1;
    }
  }
  return count;
};