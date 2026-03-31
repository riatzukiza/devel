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

export const extractMarkdownSections = (markdown: string): ExtractedDocument => {
  const ast = parseMarkdownAst(markdown);
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