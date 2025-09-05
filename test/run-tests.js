#!/usr/bin/env node

import { HtmlToPdfConverter, MarkdownToHtmlConverter, MarkdownToPdfConverter } from '../dist/converters/index.js';
import { promises as fs } from 'fs';
import path from 'path';

async function runTests() {
  console.log('🧪 Running Conversion Tests...\n');

  // Test 1: Markdown to HTML
  console.log('1. Testing Markdown to HTML conversion...');
  try {
    const markdown = `# Test Document

This is a **bold** statement and this is *italic*.

## Features

- HTML to PDF conversion
- Markdown to HTML conversion  
- Markdown to PDF conversion
- URL to PDF conversion

### Code Example

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

> This is a blockquote with **bold** text.
`;

    const htmlResult = await MarkdownToHtmlConverter.convertMarkdownToHtml(markdown, {
      sanitize: false,
      gfm: true,
      breaks: false,
    });

    if (htmlResult.success) {
      console.log('✅ Markdown to HTML: Success');
      console.log(`   HTML length: ${htmlResult.data?.length} characters`);
    } else {
      console.log('❌ Markdown to HTML: Failed');
      console.log(`   Error: ${htmlResult.error}`);
    }
  } catch (error) {
    console.log('❌ Markdown to HTML: Exception');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 2: HTML to PDF
  console.log('\n2. Testing HTML to PDF conversion...');
  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Document</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .highlight { background-color: yellow; }
  </style>
</head>
<body>
  <h1>Test Document</h1>
  <p>This is a test HTML document for PDF conversion.</p>
  <p class="highlight">This text should be highlighted.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</body>
</html>
`;

    const pdfResult = await HtmlToPdfConverter.convertHtmlToPdf(html, {
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    });

    if (pdfResult.success && pdfResult.data) {
      console.log('✅ HTML to PDF: Success');
      console.log(`   PDF size: ${Math.round(pdfResult.data.length / 1024)} KB`);

      // Save test PDF
      const testPdfPath = path.join(process.cwd(), 'test', 'test-html.pdf');
      await fs.writeFile(testPdfPath, pdfResult.data);
      console.log(`   Test PDF saved: ${testPdfPath}`);
    } else {
      console.log('❌ HTML to PDF: Failed');
      console.log(`   Error: ${pdfResult.error}`);
    }
  } catch (error) {
    console.log('❌ HTML to PDF: Exception');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 3: Markdown to PDF  
  console.log('\n3. Testing Markdown to PDF conversion...');
  try {
    const markdown = `# Test Report

## Executive Summary

This is a **comprehensive test** of the Markdown to PDF conversion functionality.

## Key Features Tested

1. **Headers** of various levels
2. **Bold** and *italic* text formatting  
3. Lists (both ordered and unordered)
4. Code blocks and inline \`code\`
5. Blockquotes
6. Tables

### Sample Table

| Feature | Status | Notes |
|---------|--------|-------|
| HTML to PDF | ✅ | Working |
| Markdown to HTML | ✅ | Working |  
| Markdown to PDF | 🧪 | Testing |

### Code Sample

\`\`\`typescript
interface ConversionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}
\`\`\`

> **Note**: This is a test document generated automatically by our test suite.

## Conclusion

The conversion system appears to be working correctly across all supported formats.
`;

    const pdfResult = await MarkdownToPdfConverter.convertMarkdownToPdf(markdown, {
      markdownOptions: {
        sanitize: false,
        gfm: true,
        breaks: false,
      },
      pdfOptions: {
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', right: '1.5cm', bottom: '2cm', left: '1.5cm' },
      },
      documentOptions: {
        title: 'Conversion Test Report',
        fullDocument: true,
      },
    });

    if (pdfResult.success && pdfResult.data) {
      console.log('✅ Markdown to PDF: Success');
      console.log(`   PDF size: ${Math.round(pdfResult.data.length / 1024)} KB`);
      console.log(`   Markdown length: ${pdfResult.metadata?.markdownLength} characters`);
      console.log(`   HTML length: ${pdfResult.metadata?.htmlLength} characters`);

      // Save test PDF
      const testPdfPath = path.join(process.cwd(), 'test', 'test-markdown.pdf');
      await fs.writeFile(testPdfPath, pdfResult.data);
      console.log(`   Test PDF saved: ${testPdfPath}`);
    } else {
      console.log('❌ Markdown to PDF: Failed');
      console.log(`   Error: ${pdfResult.error}`);
    }
  } catch (error) {
    console.log('❌ Markdown to PDF: Exception');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 4: Full HTML Document Generation
  console.log('\n4. Testing full HTML document generation...');
  try {
    const markdown = `# Sample Document

This is a test of the full HTML document generation feature.

## Features

- Custom CSS styling
- Proper HTML structure
- Responsive design`;

    const htmlResult = await MarkdownToHtmlConverter.convertMarkdownToHtml(markdown);
    
    if (htmlResult.success && htmlResult.data) {
      const fullHtmlDoc = MarkdownToHtmlConverter.createFullHtmlDocument(
        htmlResult.data,
        'Sample Document',
        'body { background-color: #f5f5f5; } h1 { color: #0066cc; }'
      );

      const testHtmlPath = path.join(process.cwd(), 'test', 'test-full-document.html');
      await fs.writeFile(testHtmlPath, fullHtmlDoc, 'utf-8');

      console.log('✅ Full HTML Document: Success');
      console.log(`   HTML document length: ${fullHtmlDoc.length} characters`);
      console.log(`   Test HTML saved: ${testHtmlPath}`);
    } else {
      console.log('❌ Full HTML Document: Failed');
      console.log(`   Error: ${htmlResult.error}`);
    }
  } catch (error) {
    console.log('❌ Full HTML Document: Exception');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎉 All tests completed!');
  console.log('\n📁 Generated test files are saved in the ./test/ directory');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});