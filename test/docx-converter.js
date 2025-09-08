#!/usr/bin/env node

// Standalone DOCX conversion script for testing
import { HtmlToDocxConverter, MarkdownToDocxConverter } from '../dist/converters/index.js';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage:');
    console.log('  node docx-converter.js html_to_docx "<html>" output.docx');
    console.log('  node docx-converter.js markdown_to_docx "<markdown>" output.docx');
    console.log('  node docx-converter.js html_to_docx_file input.html output.docx');
    console.log('  node docx-converter.js markdown_to_docx_file input.md output.docx');
    process.exit(1);
  }

  const [command, input, output] = args;

  try {
    let result;

    switch (command) {
      case 'html_to_docx':
        console.log('Converting HTML to DOCX...');
        result = await HtmlToDocxConverter.convertHtmlToDocx(input, {
          title: 'HTML Document',
          orientation: 'portrait'
        });
        break;

      case 'markdown_to_docx':
        console.log('Converting Markdown to DOCX...');
        result = await MarkdownToDocxConverter.convertMarkdownToDocx(input, {
          title: 'Markdown Document',
          orientation: 'portrait',
          gfm: true,
          fullDocument: true
        });
        break;

      case 'html_to_docx_file':
        console.log('Converting HTML file to DOCX...');
        result = await HtmlToDocxConverter.convertHtmlFileToDocx(input, {
          title: path.basename(input, '.html'),
          orientation: 'portrait'
        });
        break;

      case 'markdown_to_docx_file':
        console.log('Converting Markdown file to DOCX...');
        result = await MarkdownToDocxConverter.convertMarkdownFileToDocx(input, {
          title: path.basename(input, path.extname(input)),
          orientation: 'portrait',
          gfm: true,
          fullDocument: true
        });
        break;

      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }

    if (!result.success || !result.data) {
      console.error('Conversion failed:', result.error);
      process.exit(1);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(output);
    await fs.mkdir(outputDir, { recursive: true });

    // Save the DOCX file
    await fs.writeFile(output, result.data);

    console.log(`✅ DOCX generated successfully: ${output} (${Math.round(result.data.length / 1024)} KB)`);
    
    if (result.metadata) {
      if (result.metadata.originalLength) {
        console.log(`   Original length: ${result.metadata.originalLength} chars`);
      }
      if (result.metadata.htmlLength) {
        console.log(`   HTML length: ${result.metadata.htmlLength} chars`);
      }
      if (result.metadata.sanitized !== undefined) {
        console.log(`   Sanitized: ${result.metadata.sanitized ? 'Yes' : 'No'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();