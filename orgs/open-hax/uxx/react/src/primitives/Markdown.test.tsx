import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders paragraphs after fenced code blocks', () => {
    const { container } = render(
      <Markdown
        content={`# Title

Paragraph before.

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

Paragraph after.`}
      />,
    );

    expect(screen.getByText('Paragraph after.')).toBeInTheDocument();
    expect(container.textContent).toContain('const x = 1;');
  });

  it('renders fenced code blocks immediately after a paragraph without requiring a blank line', () => {
    const { container } = render(
      <Markdown
        content={`Paragraph before.
\`\`\`javascript
const x = 1;
\`\`\`
Paragraph after.`}
      />,
    );

    expect(container.querySelector('[data-component="code-block"]')).not.toBeNull();
    expect(container.textContent).toContain('const x = 1;');
    expect(screen.getByText('Paragraph after.')).toBeInTheDocument();
  });

  it('renders ordered lists and tables', () => {
    const { container } = render(
      <Markdown
        content={`1. First
2. Second

| Name | Value |
| ---- | ----- |
| Alpha | 1 |
| Beta | 2 |`}
      />,
    );

    expect(container.querySelector('ol')).not.toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders inline images as images instead of links', () => {
    render(<Markdown content={'Look ![diagram](https://example.com/diagram.png) here.'} />);

    const image = screen.getByRole('img', { name: 'diagram' });
    expect(image).toHaveAttribute('src', 'https://example.com/diagram.png');
    expect(screen.queryByRole('link', { name: 'diagram' })).not.toBeInTheDocument();
  });

  it('honors linkTarget and onLinkClick', () => {
    const onLinkClick = vi.fn();

    render(
      <Markdown
        content={'[Docs](https://example.com/docs)'}
        linkTarget="_self"
        onLinkClick={onLinkClick}
      />,
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_self');
    expect(link).not.toHaveAttribute('rel');

    fireEvent.click(link);

    expect(onLinkClick).toHaveBeenCalledTimes(1);
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com/docs', expect.any(Object));
  });

  it('renders nested emphasis inside strong text using a standards-based parser', () => {
    render(<Markdown content={'This is **bold*with*asterisks** text.'} />);

    expect(
      screen.getByText((_, element) => (
        element?.tagName.toLowerCase() === 'strong'
        && element.textContent === 'boldwithasterisks'
      )),
    ).toBeInTheDocument();
    expect(screen.getByText('with', { selector: 'em' })).toBeInTheDocument();
  });
});