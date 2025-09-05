#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showHelp() {
  console.log(`
Conversion MCP Server - Convert HTML/Markdown to PDF and other formats

Usage:
  npx conversion-mcp-server [command] [options]

Commands:
  stdio     Start the MCP server with stdio transport (default)
  http      Start the HTTP server
  help      Show this help message

Options:
  --port, -p    Port for HTTP server (default: 3000)
  --help, -h    Show help

Examples:
  npx conversion-mcp-server                    # Start stdio MCP server
  npx conversion-mcp-server stdio              # Start stdio MCP server (explicit)
  npx conversion-mcp-server http               # Start HTTP server on port 3000
  npx conversion-mcp-server http --port 8080   # Start HTTP server on port 8080

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

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'stdio') {
    // Default: stdio mode
    startServer('stdio');
    return;
  }

  const command = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      options.port = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      return;
    }
  }

  switch (command) {
    case 'http':
      startServer('http', options);
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