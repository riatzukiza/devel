import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownEditor } from './MarkdownEditor';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Text Editors/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/markdown-editor.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const sampleMarkdown = `# Getting Started

Welcome to the **Markdown Editor**! This is a split-pane editor with live preview.

## Features

- **Bold** and *italic* text
- \`inline code\` support
- [Links](https://github.com)
- Lists and quotes

### Code Blocks

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> This is a blockquote with some important information.

- First item
- Second item
- Third item

---

*Start editing to see the preview update in real-time!*`;

export const Default: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'split',
    previewRatio: 0.5,
    toolbar: true,
    statusBar: true,
    lineNumbers: true,
    wrap: true,
  },
};

export const EditorOnly: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'editor-only',
    toolbar: true,
    statusBar: true,
  },
};

export const PreviewOnly: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'preview-only',
  },
};

export const Tabbed: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'tabbed',
    toolbar: true,
    statusBar: true,
  },
};

export const SplitRatio30: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'split',
    previewRatio: 0.3,
  },
};

export const SplitRatio70: Story = {
  args: {
    defaultValue: sampleMarkdown,
    previewMode: 'split',
    previewRatio: 0.7,
  },
};

export const WithoutToolbar: Story = {
  args: {
    defaultValue: sampleMarkdown,
    toolbar: false,
    statusBar: true,
  },
};

export const WithoutStatusBar: Story = {
  args: {
    defaultValue: sampleMarkdown,
    toolbar: true,
    statusBar: false,
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    defaultValue: sampleMarkdown,
    lineNumbers: false,
  },
};

export const NoWordWrap: Story = {
  args: {
    defaultValue: sampleMarkdown,
    wrap: false,
  },
};

export const Empty: Story = {
  args: {
    placeholder: 'Start writing your markdown here...',
    previewMode: 'split',
  },
};

export const WithSaveHandler: Story = {
  args: {
    defaultValue: sampleMarkdown,
    onSave: (value) => console.log('Saved:', value),
  },
};

export const WithAutosave: Story = {
  args: {
    defaultValue: sampleMarkdown,
    autosave: {
      enabled: true,
      key: 'storybook-markdown-autosave',
      delay: 1000,
    },
  },
};

const longDocument = Array(100).fill(null).map((_, i) => 
  `## Section ${i + 1}\n\nThis is paragraph ${i + 1} with some content.`
).join('\n\n');

export const LongDocument: Story = {
  args: {
    defaultValue: longDocument,
    previewMode: 'split',
    toolbar: true,
    statusBar: true,
  },
};
