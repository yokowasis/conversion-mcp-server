#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showHelp() {
  console.log(`
Conversion MCP Server - Convert HTML/Markdown to PDF and other formats

Usage:
  npx conversion-mcp-server [command] [options]

Commands:
  stdio       Start the MCP server with stdio transport (default)
  http        Start the HTTP server
  convert     Convert files between formats
  help        Show this help message

Convert Commands:
  convert md-to-html <input.md> <output.html>     Convert Markdown to HTML
  convert md-to-pdf <input.md> <output.pdf>       Convert Markdown to PDF
  convert html-to-pdf <input.html> <output.pdf>   Convert HTML to PDF
  convert md-to-docx <input.md> <output.docx>     Convert Markdown to DOCX
  convert html-to-docx <input.html> <output.docx> Convert HTML to DOCX

Options:
  --port, -p    Port for HTTP server (default: 3000)
  --help, -h    Show help
  --full-doc    Create full HTML document with CSS (for md-to-html)
  --title       Set document title

Examples:
  # Server modes
  npx conversion-mcp-server                    # Start stdio MCP server
  npx conversion-mcp-server http               # Start HTTP server on port 3000
  npx conversion-mcp-server http --port 8080   # Start HTTP server on port 8080

  # Direct file conversion
  npx conversion-mcp-server convert md-to-html readme.md readme.html
  npx conversion-mcp-server convert md-to-html readme.md readme.html --full-doc --title "My Document"
  npx conversion-mcp-server convert md-to-pdf report.md report.pdf
  npx conversion-mcp-server convert html-to-pdf page.html page.pdf
  npx conversion-mcp-server convert md-to-docx notes.md notes.docx

The stdio mode is used by MCP clients (like Claude Desktop) for direct communication.
The HTTP mode provides a web server with REST endpoints and SSE transport.
  `);
}

function startServer(mode, options = {}) {
  const distDir = join(__dirname, '..', 'dist');
  let scriptPath;
  let env = { ...process.env };

  if (mode === 'http') {
    scriptPath = join(distDir, 'http-server.js');
    if (options.port) {
      env.PORT = options.port.toString();
    }
  } else {
    // Default to stdio mode
    scriptPath = join(distDir, 'index.js');
  }

  const server = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: env
  });

  server.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.error('Error: Server files not found. Please run "npm run build" first.');
      process.exit(1);
    } else {
      console.error('Error starting server:', error.message);
      process.exit(1);
    }
  });

  server.on('close', (code) => {
    process.exit(code);
  });

  // Forward signals to child process
  process.on('SIGINT', () => server.kill('SIGINT'));
  process.on('SIGTERM', () => server.kill('SIGTERM'));
}

async function convertFile(conversionType, inputFile, outputFile, options = {}) {
  try {
    // Check if input file exists
    if (!existsSync(inputFile)) {
      console.error(`Error: Input file "${inputFile}" does not exist.`);
      process.exit(1);
    }

    // Import converters dynamically
    const distDir = join(__dirname, '..', 'dist', 'converters');
    
    let converter, convertFunction;
    
    switch (conversionType) {
      case 'md-to-html': {
        const { MarkdownToHtmlConverter } = await import(join(distDir, 'markdownToHtml.js'));
        converter = MarkdownToHtmlConverter;
        convertFunction = 'convertMarkdownFileToHtml';
        break;
      }
      case 'md-to-pdf': {
        const { MarkdownToPdfConverter } = await import(join(distDir, 'markdownToPdf.js'));
        converter = MarkdownToPdfConverter;
        convertFunction = 'convertMarkdownToPdf';
        break;
      }
      case 'html-to-pdf': {
        const { HtmlToPdfConverter } = await import(join(distDir, 'htmlToPdf.js'));
        converter = HtmlToPdfConverter;
        convertFunction = 'convertHtmlToPdf';
        break;
      }
      case 'md-to-docx': {
        const { MarkdownToDocxConverter } = await import(join(distDir, 'markdownToDocx.js'));
        converter = MarkdownToDocxConverter;
        convertFunction = 'convertMarkdownToDocx';
        break;
      }
      case 'html-to-docx': {
        const { HtmlToDocxConverter } = await import(join(distDir, 'htmlToDocx.js'));
        converter = HtmlToDocxConverter;
        convertFunction = 'convertHtmlToDocx';
        break;
      }
      default:
        console.error(`Error: Unknown conversion type "${conversionType}"`);
        process.exit(1);
    }

    console.log(`Converting ${inputFile} to ${outputFile}...`);

    if (conversionType === 'md-to-html') {
      // Special handling for markdown to HTML
      const markdown = await fs.readFile(inputFile, 'utf-8');
      const result = await converter.convertMarkdownToHtml(markdown, {
        gfm: true,
        breaks: false,
        sanitize: false
      });

      if (!result.success) {
        console.error(`Conversion failed: ${result.error}`);
        process.exit(1);
      }

      let htmlOutput = result.data;

      // Create full document if requested
      if (options.fullDoc) {
        const title = options.title || 'Converted Document';
        htmlOutput = converter.createFullHtmlDocument(htmlOutput, title);
      }

      await fs.writeFile(outputFile, htmlOutput, 'utf-8');
    } else {
      // Handle other conversion types
      let conversionOptions = {};
      
      if (options.title) {
        conversionOptions.title = options.title;
      }

      let result;
      if (conversionType.startsWith('md-')) {
        const markdown = await fs.readFile(inputFile, 'utf-8');
        result = await converter[convertFunction](markdown, outputFile, conversionOptions);
      } else {
        const html = await fs.readFile(inputFile, 'utf-8');
        result = await converter[convertFunction](html, outputFile, conversionOptions);
      }

      if (!result.success) {
        console.error(`Conversion failed: ${result.error}`);
        process.exit(1);
      }
    }

    console.log(`✅ Successfully converted to ${outputFile}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Please run "npm run build" first to compile the converters.');
    }
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'stdio') {
    // Default: stdio mode
    startServer('stdio');
    return;
  }

  const command = args[0];
  const options = {};

  // Parse global options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      options.port = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      return;
    } else if (arg === '--full-doc') {
      options.fullDoc = true;
    } else if (arg === '--title') {
      options.title = args[++i];
    }
  }

  switch (command) {
    case 'http':
      startServer('http', options);
      break;
    case 'convert':
      if (args.length < 4) {
        console.error('Error: Convert command requires conversion type, input file, and output file.');
        console.error('Usage: convert <type> <input> <output>');
        console.error('Run "npx conversion-mcp-server help" for more information.');
        process.exit(1);
      }
      
      const conversionType = args[1];
      const inputFile = args[2];
      const outputFile = args[3];
      
      convertFile(conversionType, inputFile, outputFile, options)
        .catch((error) => {
          console.error(`Conversion failed: ${error.message}`);
          process.exit(1);
        });
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "npx conversion-mcp-server help" for usage information.');
      process.exit(1);
  }
}

main();