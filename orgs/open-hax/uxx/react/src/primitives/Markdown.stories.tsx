import type { Meta, StoryObj } from '@storybook/react';
import { Markdown } from './Markdown';

const meta: Meta<typeof Markdown> = {
  title: 'KMS IDE/Markdown',
  component: Markdown,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/markdown.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Markdown>;

const basicMarkdown = `# Getting Started

Welcome to the **UI Component Library**! This guide will help you get started.

## Installation

Install the package using your preferred package manager:

\`\`\`bash
pnpm add @open-hax/uxx
\`\`\`

Or with npm:

\`\`\`bash
npm install @open-hax/uxx
\`\`\`

## Quick Start

Here's a simple example to get you started:

\`\`\`typescript
import { Button, Card } from '@open-hax/uxx';

function App() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
\`\`\`

## Features

- **TypeScript** - Full type safety out of the box
- **Dark Theme** - Beautiful Monokai-inspired dark theme
- **Accessible** - WCAG 2.1 AA compliant

> This library follows a contract-driven development approach,
> ensuring consistency across React and Reagent implementations.

### Links

Check out the [documentation](https://github.com/example/ui) for more information.

---

*Last updated: 2024*
`;

const codeHeavyMarkdown = `# Code Examples

## TypeScript Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

## Clojure Example

\`\`\`clojure
(defn fetch-user [id]
  (-> (http/get (str "/api/users/" id))
      :body
      (json/parse-string true)))
\`\`\`

## Python Example

\`\`\`python
async def fetch_user(user_id: str) -> User:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"/api/users/{user_id}") as response:
            return await response.json()
\`\`\`

Inline code uses \`backticks\` like this.
`;

const listMarkdown = `# Task List

## Features to implement

- Authentication system
- User preferences
- Data export
- API rate limiting

## Priority Order

1. **Critical**: Security patches
2. **High**: Performance improvements
3. **Medium**: New features
4. **Low**: Documentation updates

## Blockquotes

> "The best code is no code at all."
> — Every developer, ever

> Note: This is a multi-line blockquote.
> It can contain additional information.
> And even more details.
`;

export const Default: Story = {
  args: {
    content: basicMarkdown,
  },
};

export const CodeHeavy: Story = {
  args: {
    content: codeHeavyMarkdown,
    lineNumbers: true,
    copyButton: true,
  },
};

export const Lists: Story = {
  args: {
    content: listMarkdown,
  },
};

export const Compact: Story = {
  args: {
    content: basicMarkdown,
    variant: 'compact',
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    content: codeHeavyMarkdown,
    lineNumbers: false,
  },
};

export const WithoutCopyButton: Story = {
  args: {
    content: codeHeavyMarkdown,
    copyButton: false,
  },
};

export const MaxLines: Story = {
  args: {
    content: codeHeavyMarkdown,
    maxLines: 10,
  },
};

const headingMarkdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Regular paragraph text under the headings.`;

export const Headings: Story = {
  args: {
    content: headingMarkdown,
  },
};

const inlineFormatting = `# Inline Formatting

This paragraph has **bold**, *italic*, and \`inline code\`.

You can also have **bold and *italic together***.

Links work like [this link to GitHub](https://github.com).

Multiple \`code snippets\` in \`one line\` work fine.`;

export const InlineFormatting: Story = {
  args: {
    content: inlineFormatting,
  },
};

export const CustomClickHandler: Story = {
  args: {
    content: basicMarkdown,
    onHeadingClick: (id, text) => console.log('Heading clicked:', id, text),
    onLinkClick: (href, e) => {
      e.preventDefault();
      console.log('Link clicked:', href);
    },
  },
};
