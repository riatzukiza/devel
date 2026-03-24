// GPL-3.0-only

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEtaMuMarkdown } = require('../index.cjs');

test('parseEtaMuMarkdown extracts wikilinks, tags, headings', () => {
  const md = `---
uuid: abc-123
tags: [Alpha, beta]
---

# Title

See [[Other Note|alias]] and [[Third#Heading]].

Inline #TagOne and #tag_two.

#hashtags: #FromLine #line_two

[ext](https://example.com)
`;

  const out = parseEtaMuMarkdown({ relPath: 'docs/a.md', text: md });
  assert.equal(out.uuid, 'abc-123');
  assert.equal(out.title, 'Title');
  assert.ok(out.headings.find((h) => h.level === 1 && h.title === 'Title'));
  assert.ok(out.tags.includes('alpha'));
  assert.ok(out.tags.includes('beta'));
  assert.ok(out.tags.includes('tagone'));
  assert.ok(out.tags.includes('tag_two'));
  assert.ok(out.tags.includes('fromline'));
  assert.ok(out.tags.includes('line_two'));

  const wiki = out.links.filter((l) => l.kind === 'wikilink');
  assert.equal(wiki.length, 2);
  assert.equal(wiki[0].target, 'Other Note');
  assert.equal(wiki[0].alias, 'alias');
  assert.equal(wiki[0].target_key, 'other note');

  const ext = out.links.filter((l) => l.kind === 'markdown');
  assert.equal(ext.length, 1);
  assert.equal(ext[0].url, 'https://example.com');
});
