# Web Content Processing Research

**Date**: 2026-02-01  
**Research Focus**: PDF-to-image conversion, image extraction from web pages, content type detection, and HTML-to-markdown conversion in Node.js/JavaScript

---

## 1. PDF to Image Conversion

### Production-Ready npm Packages

#### 1.1 pdf-to-img (Recommended)

**Evidence**: [GitHub Repository](https://github.com/k-yle/pdf-to-img)

**Features**:
- Converts PDFs to images (PNG, JPEG, etc.)
- Async-iterable API with CLI support
- Supports scaling, password protection, and specific page selection
- Node.js v20+ support
- 27 dependents, high reputation (Benchmark Score: 88)

**Installation**:
```bash
npm install pdf-to-img
```

**Usage Examples**:

**Basic Conversion**:
```javascript
import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";

async function convertPdf() {
  const document = await pdf("example.pdf", { scale: 3 });
  
  let counter = 1;
  for await (const image of document) {
    await fs.writeFile(`page${counter}.png`, image);
    counter++;
  }
}
```

**High Resolution Rendering**:
```javascript
import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";

async function renderHighResolution() {
  const document = await pdf("diagram.pdf", { scale: 5.0 });
  
  let pageNum = 1;
  for await (const image of document) {
    await fs.writeFile(`highres-page${pageNum}.png`, image);
    pageNum++;
  }
}
```

**Password-Protected PDF**:
```javascript
import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";

async function convertProtectedPdf() {
  try {
    const document = await pdf("protected.pdf", {
      password: "secret123",
      scale: 2
    });

    let pageNum = 1;
    for await (const image of document) {
      await fs.writeFile(`secure-page${pageNum}.png`, image);
      pageNum++;
    }
  } catch (error) {
    if (error.message.includes("password")) {
      console.error("Invalid password");
    }
  }
}
```

**Convert Specific Pages**:
```javascript
import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";

async function convertSpecificPages() {
  const document = await pdf("document.pdf", { scale: 3 });
  
  // Get page 12 specifically
  const page12Buffer = await document.getPage(12);
  await fs.writeFile("page12.png", page12Buffer);
}
```

**CLI Usage**:
```bash
npm install -g pdf-to-img

# Basic conversion
pdf2img inputFile.pdf

# High resolution with custom output
pdf2img -s 5 -o ./output document.pdf

# Password protected
pdf2img -p "secret123" protected.pdf

# Specific pages only
pdf2img -g 1,3,5 document.pdf

# Combined options
pdf2img -s 4 -p "secret123" -o ./output -g 1,2,3 protected.pdf
```

**Real-World Usage**: [midday-ai/midday](https://github.com/midday-ai/midday/blob/main/apps/dashboard/src/app/api/files/preview/route.ts#L1), [RomanHauksson](https://github.com/RomanHauksson/academic-project-astro-template/blob/main/src/lib/render-pdf.ts#L1)

#### 1.2 Alternative Packages

**pdf2pic** - Requires GraphicsMagick and Ghostscript, more setup but mature.

**@ikilabs/pdf-to-img** - TypeScript wrapper with combined image output (all pages stacked vertically).

---

## 2. Extracting Images from Web Pages

### 2.1 Using Puppeteer (Primary Recommendation)

**Evidence**: [Puppeteer Documentation](https://pptr.dev/)

**Features**:
- Headless Chrome/Firefox automation
- Extract images from both static and dynamic pages
- Download images directly
- Capture screenshots of elements or full pages
- 2,409 code snippets, 90K+ GitHub stars

**Installation**:
```bash
npm install puppeteer
```

**Usage Examples**:

**Extract All Image URLs**:
```javascript
import puppeteer from 'puppeteer';

async function extractImages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const images = await page.$$eval('img', (imgs) => 
    imgs.map(img => img.src)
  );
  
  await browser.close();
  return images;
}
```

**Extract Images with Lazy Loading Support**:
```javascript
import puppeteer from 'puppeteer';

async function extractAllImages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Scroll to load lazy images
  await page.evaluate(() => {
    window.scrollBy(0, document.body.scrollHeight);
  });
  
  // Wait for images to load
  await page.waitForFunction(() => 
    Array.from(document.images).every(img => img.complete)
  );
  
  const allImages = await page.$$eval('img', (imgs) =>
    imgs.map(img => ({
      src: img.src,
      srcset: img.srcset,
      dataSrc: img.getAttribute('data-src') || img.getAttribute('data-srcset'),
      alt: img.alt,
      width: img.width,
      height: img.height
    }))
  );
  
  await browser.close();
  return allImages;
}
```

**Download Images**:
```javascript
import puppeteer from 'puppeteer';
import { writeFile } from 'node:fs/promises';

async function downloadImages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const images = await page.$$eval('img', (imgs) => 
    imgs.map(img => img.src).filter(src => src.startsWith('http'))
  );
  
  for (const [index, imageUrl] of images.entries()) {
    const response = await page.goto(imageUrl);
    const buffer = await response.buffer();
    
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    await writeFile(`image-${index}.${extension}`, buffer);
  }
  
  await browser.close();
}
```

**Capture Screenshot of Page**:
```javascript
import puppeteer from 'puppeteer';

async function screenshotPage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Full page screenshot
  const screenshot = await page.screenshot({
    path: 'page.png',
    fullPage: true
  });
  
  await browser.close();
  return screenshot;
}
```

**Capture Screenshot of Specific Element**:
```javascript
import puppeteer from 'puppeteer';

async function screenshotElement(url, selector) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const element = await page.$(selector);
  const screenshot = await element.screenshot({ path: 'element.png' });
  
  await browser.close();
  return screenshot;
}
```

**Screenshot with Custom Dimensions**:
```javascript
import puppeteer from 'puppeteer';

async function customScreenshot(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const screenshot = await page.screenshot({
    path: 'custom.png',
    type: 'jpeg',
    quality: 90,
    clip: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    }
  });
  
  await browser.close();
  return screenshot;
}
```

**Real-World Usage**: [Apify Crawlee Examples](https://github.com/apify/crawlee/blob/master/docs/examples/skip-navigation.ts#L16)

### 2.2 Using Playwright (Alternative)

**Evidence**: [Playwright Documentation](https://playwright.dev/)

**Features**:
- Cross-browser support (Chrome, Firefox, WebKit)
- Async/await API
- Excellent for testing and scraping

**Installation**:
```bash
npm install playwright
npx playwright install
```

**Usage Example**:
```javascript
import { chromium } from 'playwright';

async function extractImagesWithPlaywright(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const images = await page.$$eval('img', (imgs) =>
    imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight
    }))
  );
  
  await browser.close();
  return images;
}
```

**Real-World Usage**: [Microsoft Playwright Tests](https://github.com/microsoft/playwright/blob/main/tests/page/page-screenshot.spec.ts#L28)

---

## 3. Content Type Detection

### 3.1 Detecting URL Content Type with Fetch API

**Evidence**: [RocketChat Implementation](https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/app/lib/server/functions/setUserAvatar.ts#L149)

**Pattern**: Check Content-Type header before processing content

**Basic Content Type Detection**:
```javascript
async function getContentType(url) {
  const response = await fetch(url, { method: 'HEAD' });
  const contentType = response.headers.get('content-type');
  return contentType;
}
```

**Comprehensive Content Type Classifier**:
```javascript
export type ContentType = 'image' | 'html' | 'pdf' | 'json' | 'text' | 'binary' | 'unknown';

export interface ContentInfo {
  type: ContentType;
  mimeType: string;
  extension?: string;
}

export async function detectContentType(url: string): Promise<ContentInfo> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    
    // Parse MIME type
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    
    // Determine content type
    if (mimeType.startsWith('image/')) {
      const extension = mimeType.split('/').pop() || 'png';
      return { type: 'image', mimeType, extension };
    }
    
    if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') {
      return { type: 'html', mimeType };
    }
    
    if (mimeType === 'application/pdf') {
      return { type: 'pdf', mimeType };
    }
    
    if (mimeType === 'application/json') {
      return { type: 'json', mimeType };
    }
    
    if (mimeType.startsWith('text/')) {
      return { type: 'text', mimeType };
    }
    
    if (mimeType.startsWith('application/octet-stream') || 
        mimeType.startsWith('application/zip') ||
        mimeType.startsWith('application/x-')) {
      return { type: 'binary', mimeType };
    }
    
    return { type: 'unknown', mimeType };
  } catch (error) {
    console.error('Failed to detect content type:', error);
    return { type: 'unknown', mimeType: '' };
  }
}
```

**Image Validation with Content Type Check**:
```javascript
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return false;
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.startsWith('image/')) {
      console.warn(`URL is not an image: ${contentType}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate image URL:', error);
    return false;
  }
}
```

**Real-World Examples**:

**RocketChat Avatar Validation**:
```typescript
// From: https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/app/lib/server/functions/setUserAvatar.ts#L149
const response = await fetch(dataURI);

if (!/image\/.+/.test(response.headers.get('content-type') || '')) {
  console.warn('Not a valid content-type from provided avatar url');
  throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL`);
}

return {
  buffer: Buffer.from(await response.arrayBuffer()),
  type: response.headers.get('content-type') || '',
};
```

**Supabase Response Handling**:
```typescript
// From: https://github.com/supabase/supabase/blob/master/apps/www/lib/customerio.ts#L83
if (response.headers.get('content-type')?.includes('application/json')) {
  return response.json();
}

return {} as T;
```

**Platform Link Preview**:
```typescript
// From: https://github.com/hcengineering/platform/blob/develop/pods/link-preview/src/parse.ts#L440
const contentType = response.headers.get('content-type');
if (contentType === null || !contentType.startsWith('image/')) {
  console.warn('URL is not an image', { contentType, url });
  return undefined;
}
```

**Ghost API Response Handler**:
```typescript
// From: https://github.com/TryGhost/Ghost/blob/main/apps/admin-x-framework/src/utils/api/handle-response.ts#L8
if (!response.headers.get('content-type')?.includes('json')) {
  throw new APIError(response, await response.text());
}

const data = await response.json() as ErrorResponse;
```

### 3.2 URL Extension Fallback (Secondary Method)

**Evidence**: [Pattern commonly used when headers are unavailable](https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/app/lib/server/functions/setUserAvatar.ts)

```javascript
function detectByExtension(url: string): ContentType {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const htmlExtensions = ['html', 'htm', 'xhtml'];
  const pdfExtensions = ['pdf'];
  const jsonExtensions = ['json'];
  
  if (imageExtensions.includes(extension || '')) {
    return 'image';
  }
  
  if (htmlExtensions.includes(extension || '')) {
    return 'html';
  }
  
  if (pdfExtensions.includes(extension || '')) {
    return 'pdf';
  }
  
  if (jsonExtensions.includes(extension || '')) {
    return 'json';
  }
  
  return 'unknown';
}
```

### 3.3 Best Practices

1. **Always use HEAD requests first** to avoid downloading large files unnecessarily
2. **Check Content-Type header** - it's more reliable than URL extensions
3. **Handle errors gracefully** - some URLs may be invalid or inaccessible
4. **Use regex validation** for specific MIME types (e.g., `image\/.+`)
5. **Implement fallback logic** - if headers fail, try extension detection

---

## 4. HTML to Markdown Conversion

### 4.1 Turndown (Primary Recommendation)

**Evidence**: [Turndown Repository](https://github.com/mixmark-io/turndown)

**Features**:
- Converts HTML to Markdown with JavaScript
- Works in both Node.js and browser environments
- CommonMark compliant
- Highly configurable with plugins
- 10.7K GitHub stars, 2.2M weekly downloads

**Installation**:
```bash
npm install turndown
```

**Usage Examples**:

**Basic Conversion**:
```javascript
import TurndownService from 'turndown';

const turndownService = new TurndownService();
const markdown = turndownService.turndown('<h1>Hello world!</h1>');
console.log(markdown); // # Hello world!
```

**Custom Configuration**:
```javascript
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*', 
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
  preformattedCode: false
});

const html = `
  <h3>Sample Code</h3>
  <pre><code class="language-javascript">function hello() {
    console.log('world');
}</code></pre>
  <p>This is <strong>bold</strong> and <em>italic</em> text.</p>
`;

const markdown = turndownService.turndown(html);
```

**Custom Rules**:
```javascript
import TurndownService from 'turndown';

const turndownService = new TurndownService();

// Add strikethrough support
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: function (content) {
    return '~~' + content + '~~';
  }
});

// Add highlighted code support
turndownService.addRule('highlightedCode', {
  filter: function (node, options) {
    return (
      node.nodeName === 'CODE' &&
      node.getAttribute('class') === 'highlight'
    );
  },
  replacement: function (content) {
    return '==' + content + '==';
  }
});

const html = '<p>This text is <del>deleted</del> and <code class="highlight">important</code>.</p>';
const markdown = turndownService.turndown(html);
console.log(markdown);
// Output: This text is ~~deleted~~ and ==important==.
```

**GitHub Flavored Markdown (GFM) Plugin**:
```javascript
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const turndownService = new TurndownService();
turndownService.use(gfm);

const html = `
  <table>
    <thead>
      <tr><th>Name</th><th>Age</th></tr>
    </thead>
    <tbody>
      <tr><td>Alice</td><td>30</td></tr>
      <tr><td>Bob</td><td>25</td></tr>
    </tbody>
  </table>
  <p>This is <del>deleted</del> text.</p>
`;

const markdown = turndownService.turndown(html);
```

**Real-World Usage**:

**Cal.com Integration**:
```typescript
// From: https://github.com/calcom/cal.com/blob/main/packages/lib/turndownService.ts#L1
import TurndownService from "turndown";

const turndownService = new TurndownService();

function turndown(html: string | TurndownService.Node): string {
  let result = turndownService.turndown(html);
  result = result.replaceAll("[<p><br></p>]", "");

  if (result === "<p><br></p>") {
    result = "";
  }

  return result;
}

turndownService.addRule("shiftEnter", {
  filter: function (node) {
    return node.nodeName === "BR" && !!isShiftEnter(node);
  },
  replacement: function () {
    return "<br>";
  },
});
```

**Microsoft Azure Data Studio**:
```typescript
// From: https://github.com/microsoft/azuredatastudio/blob/master/src/sql/workbench/contrib/notebook/browser/htmlMarkdownConverter.ts#L37
import TurndownService = require('turndown');

this.turndownService = new TurndownService({ 
  'emDelimiter': '_', 
  'bulletListMarker': '-', 
  'headingStyle': 'atx',
  blankReplacement: blankReplacement 
});

public convert(html: string): string {
  return this.turndownService.turndown(html, { gfm: true });
}
```

**Jina AI Reader**:
```typescript
// From: https://github.com/jina-ai/reader/blob/main/src/services/snapshot-formatter.ts#L48
const gfmPlugin = require('turndown-plugin-gfm');
const highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;

export function highlightedCodeBlock(turndownService: TurndownService) {
    turndownService.addRule('highlightedCodeBlock', {
      filter: (node) => {
        return (
          node.nodeName === 'DIV' &&
          node.firstChild?.nodeName === 'PRE' &&
          highlightRegExp.test(node.className)
        );
      },
      replacement(content) {
        return `\`\`\`js\n${content}\n\`\`\``;
      }
    });
}
```

**OpenCTI Platform**:
```typescript
// From: https://github.com/OpenCTI-Platform/opencti/blob/master/opencti-platform/opencti-graphql/src/manager/ingestionManager.ts#L174
const rssItemV1Convert = (turndownService: TurndownService, feed: RssElement, entry: RssItem): DataItem => {
  const { updated } = feed;
  const link = entry.link?.href?.trim() ?? '';
  const title = entry.title?._ || link || 'Untitled';

  return {
    title,
    description: turndownService.turndown(entry.summary?._ ?? ''),
    link: link || undefined,
    content: turndownService.turndown(entry.content?._ ?? ''),
  };
};
```

### 4.2 Alternative: node-html-markdown

**Features**:
- High performance (optimized for large HTML)
- TypeScript support built-in
- 157 dependents

**Installation**:
```bash
npm install node-html-markdown
```

**Usage**:
```javascript
import { HtmlToMarkdown } from 'node-html-markdown';

const converter = new HtmlToMarkdown();
const markdown = converter.convert('<h1>Hello</h1>');
```

---

## 5. Integration Examples

### 5.1 Complete URL Processing Pipeline

```javascript
import { pdf } from 'pdf-to-img';
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import { detectContentType, ContentInfo } from './content-type';

export async function processUrl(url: string): Promise<string | Buffer> {
  // Step 1: Detect content type
  const contentInfo = await detectContentType(url);
  
  switch (contentInfo.type) {
    case 'image':
      // Download image
      const response = await fetch(url);
      return await response.buffer();
    
    case 'pdf':
      // Convert PDF to images
      const pdfResponse = await fetch(url);
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      
      const document = await pdf(pdfBuffer, { scale: 2 });
      const images: Buffer[] = [];
      
      for await (const image of document) {
        images.push(image);
      }
      
      return images[0]; // Return first page as example
    
    case 'html':
      // Convert HTML to markdown
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const html = await page.content();
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);
      
      await browser.close();
      return markdown;
    
    default:
      throw new Error(`Unsupported content type: ${contentInfo.type}`);
  }
}
```

### 5.2 Web Page to Markdown with Images

```javascript
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';

export async function pageToMarkdownWithImages(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Extract all images
  const images = await page.$$eval('img', (imgs) =>
    imgs.map(img => ({
      src: img.src,
      alt: img.alt || '',
      width: img.naturalWidth,
      height: img.naturalHeight
    }))
  );
  
  // Get HTML content
  const html = await page.content();
  
  // Convert to markdown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  const markdown = turndownService.turndown(html);
  
  await browser.close();
  
  return {
    markdown,
    images,
    url
  };
}
```

---

## 6. Best Practices Summary

### 6.1 PDF to Image Conversion
- Use **pdf-to-img** for Node.js environments
- Set appropriate **scale** (2-4) for quality vs file size balance
- Handle **password-protected PDFs** gracefully
- Use **async iteration** for memory efficiency with large PDFs

### 6.2 Image Extraction from Web Pages
- **Puppeteer** is the most mature solution
- Handle **lazy loading** by scrolling or waiting for images
- Use **networkidle2** wait condition for dynamic content
- Consider **Playwright** for cross-browser needs

### 6.3 Content Type Detection
- Always use **HEAD requests** first
- Trust **Content-Type headers** over URL extensions
- Implement **fallback** to extension detection
- Validate responses with **status checks**

### 6.4 HTML to Markdown Conversion
- **Turndown** is the standard choice
- Use **GFM plugin** for tables/strikethrough
- Add **custom rules** for special elements
- Configure **output style** to match requirements

---

## 7. References

### Official Documentation
- [pdf-to-img](https://www.npmjs.com/package/pdf-to-img) - NPM package
- [Puppeteer API](https://pptr.dev/) - Headless browser automation
- [Turndown](https://mixmark-io.github.io/turndown/) - HTML to Markdown converter
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - HTTP requests

### Real-World Implementations
- [RocketChat Avatar Validation](https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/app/lib/server/functions/setUserAvatar.ts#L149)
- [Midday PDF Processing](https://github.com/midday-ai/midday/blob/main/apps/dashboard/src/app/api/files/preview/route.ts#L1)
- [Apify Image Extraction](https://github.com/apify/crawlee/blob/master/docs/examples/skip-navigation.ts#L16)
- [Cal.com Turndown Integration](https://github.com/calcom/cal.com/blob/main/packages/lib/turndownService.ts#L1)

### Articles & Tutorials
- [Puppeteer Image Download Guide](https://www.webshare.io/academy-article/puppeteer-download-images)
- [Collect Images with Puppeteer](https://picperf.io/posts/collect-images-with-puppeteer)
- [Verify Image URL Without Regex](https://www.zhenghao.io/posts/verify-image-url)
- [Convert HTML to Markdown](https://davidwalsh.name/convert-html-markdown)

---

## 8. Definition of Done

- [x] Research PDF-to-image conversion libraries
- [x] Identify production-ready npm packages with evidence
- [x] Find image extraction techniques from web pages
- [x] Document content type detection patterns
- [x] Research HTML-to-markdown conversion tools
- [x] Provide code examples with permalinks
- [x] Include real-world usage examples
- [x] Create comprehensive spec document

---

**Change Log**:
- 2026-02-01: Initial research completed with all four topics covered
