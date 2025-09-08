#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { 
  HtmlToPdfConverter, 
  MarkdownToHtmlConverter, 
  MarkdownToPdfConverter,
  HtmlToDocxConverter,
  MarkdownToDocxConverter
} from './converters/index.js';

class ConversionHttpServer {
  private server: Server;
  private app: express.Application;
  private transport: SSEServerTransport | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'conversion-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.app = express();
    this.setupExpressApp();
    this.setupHandlers();
  }

  private setupExpressApp(): void {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.text({ limit: '50mb' }));
    
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        capabilities: ['HTML to PDF', 'HTML to DOCX', 'Markdown to HTML', 'Markdown to PDF', 'Markdown to DOCX', 'URL to PDF']
      });
    });

    // SSE endpoint for MCP communication
    this.app.get('/sse', (_req, res) => {
      this.transport = new SSEServerTransport('/message', res);
      this.server.connect(this.transport);
    });

    // Message handling endpoint
    this.app.post('/message', (req, res) => {
      if (this.transport) {
        this.transport.handlePostMessage(req, res);
      } else {
        res.status(400).json({ error: 'No SSE connection established' });
      }
    });

    // Direct conversion endpoints for testing
    this.app.post('/convert/html-to-pdf', async (req, res) => {
      try {
        const { html, options } = req.body;
        const result = await HtmlToPdfConverter.convertHtmlToPdf(html, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
        res.send(result.data);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/convert/markdown-to-html', async (req, res) => {
      try {
        const { markdown, options } = req.body;
        const result = await MarkdownToHtmlConverter.convertMarkdownToHtml(markdown, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        let html = result.data;
        if (options?.fullDocument) {
          html = MarkdownToHtmlConverter.createFullHtmlDocument(
            html,
            options?.title || 'Document'
          );
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/convert/markdown-to-pdf', async (req, res) => {
      try {
        const { markdown, options } = req.body;
        const result = await MarkdownToPdfConverter.convertMarkdownToPdf(markdown, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
        res.send(result.data);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/convert/url-to-pdf', async (req, res) => {
      try {
        const { url, options } = req.body;
        const result = await HtmlToPdfConverter.convertUrlToPdf(url, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="webpage.pdf"');
        res.send(result.data);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/convert/html-to-docx', async (req, res) => {
      try {
        const { html, options } = req.body;
        const result = await HtmlToDocxConverter.convertHtmlToDocx(html, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
        res.send(result.data);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.post('/convert/markdown-to-docx', async (req, res) => {
      try {
        const { markdown, options } = req.body;
        const result = await MarkdownToDocxConverter.convertMarkdownToDocx(markdown, options);
        
        if (!result.success || !result.data) {
          return res.status(400).json({ error: result.error });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
        res.send(result.data);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  }

  private setupHandlers(): void {
    // List available tools (same as main server)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'html_to_pdf',
            description: 'Convert HTML content to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                html: { type: 'string', description: 'HTML content to convert to PDF' },
                output_path: { type: 'string', description: 'Full path where PDF should be saved' },
                options: { 
                  type: 'object',
                  properties: {
                    format: { type: 'string', enum: ['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid'] },
                    landscape: { type: 'boolean' },
                    printBackground: { type: 'boolean' },
                    scale: { type: 'number', minimum: 0.1, maximum: 2 },
                  }
                },
              },
              required: ['html'],
            },
          },
          {
            name: 'url_to_pdf',
            description: 'Convert a web page URL to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to convert' },
                options: { type: 'object' },
              },
              required: ['url'],
            },
          },
          {
            name: 'markdown_to_html',
            description: 'Convert Markdown content to HTML format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: { type: 'string', description: 'Markdown content' },
                options: { 
                  type: 'object',
                  properties: {
                    sanitize: { type: 'boolean' },
                    fullDocument: { type: 'boolean' },
                    title: { type: 'string' },
                  }
                },
              },
              required: ['markdown'],
            },
          },
          {
            name: 'markdown_to_pdf',
            description: 'Convert Markdown content to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: { type: 'string', description: 'Markdown content' },
                options: { type: 'object' },
              },
              required: ['markdown'],
            },
          },
          {
            name: 'html_to_docx',
            description: 'Convert HTML content to DOCX format',
            inputSchema: {
              type: 'object',
              properties: {
                html: { type: 'string', description: 'HTML content to convert to DOCX' },
                options: {
                  type: 'object',
                  properties: {
                    orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                    title: { type: 'string' },
                    creator: { type: 'string' },
                  }
                },
              },
              required: ['html'],
            },
          },
          {
            name: 'markdown_to_docx',
            description: 'Convert Markdown content to DOCX format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: { type: 'string', description: 'Markdown content to convert to DOCX' },
                options: {
                  type: 'object',
                  properties: {
                    sanitize: { type: 'boolean' },
                    gfm: { type: 'boolean' },
                    breaks: { type: 'boolean' },
                    fullDocument: { type: 'boolean' },
                    orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                    title: { type: 'string' },
                    creator: { type: 'string' },
                  }
                },
              },
              required: ['markdown'],
            },
          },
        ],
      };
    });

    // Handle tool calls (return data instead of saving files for HTTP mode)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'html_to_pdf': {
            const { html, options = {} } = args as { html: string; options?: any };
            const result = await HtmlToPdfConverter.convertHtmlToPdf(html, options);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            // Return base64 encoded PDF for HTTP transport
            const base64Pdf = result.data.toString('base64');
            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated successfully (${Math.round(result.data.length / 1024)} KB)`,
                },
                {
                  type: 'text',
                  text: `Base64 PDF Data:\ndata:application/pdf;base64,${base64Pdf}`,
                },
              ],
            };
          }

          case 'url_to_pdf': {
            const { url, options = {} } = args as { url: string; options?: any };
            const result = await HtmlToPdfConverter.convertUrlToPdf(url, options);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            const base64Pdf = result.data.toString('base64');
            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated from ${url} (${Math.round(result.data.length / 1024)} KB)`,
                },
                {
                  type: 'text',
                  text: `Base64 PDF Data:\ndata:application/pdf;base64,${base64Pdf}`,
                },
              ],
            };
          }

          case 'markdown_to_html': {
            const { markdown, options = {} } = args as { markdown: string; options?: any };
            const result = await MarkdownToHtmlConverter.convertMarkdownToHtml(markdown, options);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            let html = result.data;
            if (options.fullDocument) {
              html = MarkdownToHtmlConverter.createFullHtmlDocument(
                html,
                options.title || 'Document'
              );
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `HTML generated successfully (${html.length} characters)${result.metadata?.sanitized ? ' (sanitized)' : ''}`,
                },
                {
                  type: 'text',
                  text: `HTML Content:\n${html}`,
                },
              ],
            };
          }

          case 'markdown_to_pdf': {
            const { markdown, options = {} } = args as { markdown: string; options?: any };
            const conversionOptions = {
              markdownOptions: {
                sanitize: options.sanitize || false,
                gfm: options.gfm !== false,
                breaks: options.breaks || false,
              },
              pdfOptions: {
                format: options.format || 'A4',
                landscape: options.landscape || false,
                printBackground: options.printBackground !== false,
              },
              documentOptions: {
                title: options.title || 'Document',
                fullDocument: true,
              },
            };

            const result = await MarkdownToPdfConverter.convertMarkdownToPdf(markdown, conversionOptions);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            const base64Pdf = result.data.toString('base64');
            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated from Markdown (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                },
                {
                  type: 'text',
                  text: `Base64 PDF Data:\ndata:application/pdf;base64,${base64Pdf}`,
                },
              ],
            };
          }

          case 'html_to_docx': {
            const { html, options = {} } = args as { html: string; options?: any };
            const result = await HtmlToDocxConverter.convertHtmlToDocx(html, options);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            // Return base64 encoded DOCX for HTTP transport
            const base64Docx = result.data.toString('base64');
            return {
              content: [
                {
                  type: 'text',
                  text: `DOCX generated successfully (${Math.round(result.data.length / 1024)} KB)`,
                },
                {
                  type: 'text',
                  text: `Base64 DOCX Data:\ndata:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Docx}`,
                },
              ],
            };
          }

          case 'markdown_to_docx': {
            const { markdown, options = {} } = args as { markdown: string; options?: any };
            const result = await MarkdownToDocxConverter.convertMarkdownToDocx(markdown, options);
            
            if (!result.success || !result.data) {
              return {
                content: [{ type: 'text', text: result.error || 'Conversion failed' }],
                isError: true,
              };
            }

            // Return base64 encoded DOCX for HTTP transport
            const base64Docx = result.data.toString('base64');
            return {
              content: [
                {
                  type: 'text',
                  text: `DOCX generated from markdown successfully (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                },
                {
                  type: 'text',
                  text: `Base64 DOCX Data:\ndata:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Docx}`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'config://server',
            mimeType: 'application/json',
            name: 'Server Configuration',
            description: 'Current conversion server configuration and capabilities',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'config://server':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  name: 'conversion-mcp-server',
                  version: '1.0.0',
                  transport: 'http',
                  capabilities: ['HTML to PDF', 'HTML to DOCX', 'Markdown to HTML', 'Markdown to PDF', 'Markdown to DOCX', 'URL to PDF'],
                  supportedFormats: {
                    input: ['HTML', 'Markdown', 'URL'],
                    output: ['PDF', 'HTML'],
                  },
                  endpoints: [
                    '/convert/html-to-pdf',
                    '/convert/html-to-docx',
                    '/convert/markdown-to-html',
                    '/convert/markdown-to-pdf',
                    '/convert/markdown-to-docx',
                    '/convert/url-to-pdf',
                  ],
                }, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // Error handling
    this.server.onerror = (error): void => {
      console.error('[MCP Error]', error);
    };
  }

  async run(): Promise<void> {
    const port = process.env.PORT || 3000;
    
    const httpServer = this.app.listen(port, () => {
      console.error(`Conversion MCP HTTP Server running on port ${port}`);
      console.error(`Health check: http://localhost:${port}/health`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
      console.error(`Message endpoint: http://localhost:${port}/message`);
      console.error(`Direct endpoints:`);
      console.error(`  - POST http://localhost:${port}/convert/html-to-pdf`);
      console.error(`  - POST http://localhost:${port}/convert/html-to-docx`);
      console.error(`  - POST http://localhost:${port}/convert/markdown-to-html`);
      console.error(`  - POST http://localhost:${port}/convert/markdown-to-pdf`);
      console.error(`  - POST http://localhost:${port}/convert/markdown-to-docx`);
      console.error(`  - POST http://localhost:${port}/convert/url-to-pdf`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.error('Shutting down server...');
      httpServer.close();
      if (this.transport) {
        await this.server.close();
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Start the HTTP server
const server = new ConversionHttpServer();
server.run().catch((error) => {
  console.error('Failed to start HTTP server:', error);
  process.exit(1);
});