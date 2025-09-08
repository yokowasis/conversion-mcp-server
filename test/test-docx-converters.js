import { HtmlToDocxConverter, MarkdownToDocxConverter } from '../dist/converters/index.js';
import { promises as fs } from 'fs';
import path from 'path';

async function testConverters() {
  const testDir = path.join(process.cwd(), 'test');
  
  console.log('Testing HTML to DOCX conversion...');
  
  // Test HTML to DOCX
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Document</title>
    </head>
    <body>
      <h1>Test HTML Document</h1>
      <p>This is a test paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <p>This document was converted from HTML to DOCX using html-docx-js.</p>
    </body>
    </html>
  `;
  
  const htmlResult = await HtmlToDocxConverter.convertHtmlToDocx(htmlContent, {
    title: 'HTML Test Document',
    creator: 'Test Script',
    orientation: 'portrait'
  });
  
  if (htmlResult.success && htmlResult.data) {
    const htmlOutputPath = path.join(testDir, 'test-html-to-docx.docx');
    await fs.writeFile(htmlOutputPath, htmlResult.data);
    console.log(`✅ HTML to DOCX conversion successful: ${htmlOutputPath} (${Math.round(htmlResult.data.length / 1024)} KB)`);
  } else {
    console.error('❌ HTML to DOCX conversion failed:', htmlResult.error);
  }
  
  console.log('\nTesting Markdown to DOCX conversion...');
  
  // Test Markdown to DOCX
  const markdownContent = `
# Test Markdown Document

This is a test document written in **Markdown**.

## Features

- **Bold text** and *italic text*
- Lists and bullet points
- Links: [GitHub](https://github.com)
- Code blocks:

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

## Table Example

| Name | Age | City |
|------|-----|------|
| John | 30  | NYC  |
| Jane | 25  | LA   |

This document was converted from Markdown to DOCX.
  `;
  
  const markdownResult = await MarkdownToDocxConverter.convertMarkdownToDocx(markdownContent, {
    title: 'Markdown Test Document',
    creator: 'Test Script',
    orientation: 'portrait',
    gfm: true,
    fullDocument: true
  });
  
  if (markdownResult.success && markdownResult.data) {
    const markdownOutputPath = path.join(testDir, 'test-markdown-to-docx.docx');
    await fs.writeFile(markdownOutputPath, markdownResult.data);
    console.log(`✅ Markdown to DOCX conversion successful: ${markdownOutputPath} (${Math.round(markdownResult.data.length / 1024)} KB)`);
    
    if (markdownResult.metadata) {
      console.log(`   Original markdown: ${markdownResult.metadata.originalLength} chars`);
      console.log(`   Generated HTML: ${markdownResult.metadata.htmlLength} chars`);
      console.log(`   Sanitized: ${markdownResult.metadata.sanitized ? 'Yes' : 'No'}`);
    }
  } else {
    console.error('❌ Markdown to DOCX conversion failed:', markdownResult.error);
  }
}

// Run the tests
testConverters().catch(console.error);