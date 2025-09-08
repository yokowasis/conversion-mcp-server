#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { 
  HtmlToPdfConverter, 
  MarkdownToHtmlConverter, 
  MarkdownToPdfConverter,
  HtmlToDocxConverter,
  MarkdownToDocxConverter
} from './converters/index.js';
import { promises as fs } from 'fs';
import path from 'path';

class ConversionMCPServer {
  private server: Server;

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

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'html_to_pdf',
            description: 'Convert HTML content to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                html: {
                  type: 'string',
                  description: 'HTML content to convert to PDF',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the PDF should be saved (e.g., /Users/username/Documents/output.pdf)',
                },
                options: {
                  type: 'object',
                  properties: {
                    format: {
                      type: 'string',
                      enum: ['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid'],
                      description: 'Paper format (default: A4)',
                    },
                    landscape: {
                      type: 'boolean',
                      description: 'Use landscape orientation (default: false)',
                    },
                    printBackground: {
                      type: 'boolean',
                      description: 'Print background graphics (default: true)',
                    },
                    scale: {
                      type: 'number',
                      minimum: 0.1,
                      maximum: 2,
                      description: 'Scale of the webpage rendering (default: 1)',
                    },
                    margin: {
                      type: 'object',
                      properties: {
                        top: { type: 'string', description: 'Top margin (e.g., "1cm")' },
                        right: { type: 'string', description: 'Right margin (e.g., "1cm")' },
                        bottom: { type: 'string', description: 'Bottom margin (e.g., "1cm")' },
                        left: { type: 'string', description: 'Left margin (e.g., "1cm")' },
                      },
                    },
                  },
                },
              },
              required: ['html', 'output_path'],
            },
          },
          {
            name: 'url_to_pdf',
            description: 'Convert a web page URL to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL of the web page to convert to PDF',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the PDF should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    format: {
                      type: 'string',
                      enum: ['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid'],
                      description: 'Paper format (default: A4)',
                    },
                    landscape: {
                      type: 'boolean',
                      description: 'Use landscape orientation (default: false)',
                    },
                    printBackground: {
                      type: 'boolean',
                      description: 'Print background graphics (default: true)',
                    },
                    scale: {
                      type: 'number',
                      minimum: 0.1,
                      maximum: 2,
                      description: 'Scale of the webpage rendering (default: 1)',
                    },
                  },
                },
              },
              required: ['url', 'output_path'],
            },
          },
          {
            name: 'markdown_to_html',
            description: 'Convert Markdown content to HTML format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: {
                  type: 'string',
                  description: 'Markdown content to convert to HTML',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the HTML file should be saved (optional)',
                },
                options: {
                  type: 'object',
                  properties: {
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output to remove potentially dangerous content (default: false)',
                    },
                    fullDocument: {
                      type: 'boolean',
                      description: 'Create a full HTML document with head, body, and CSS styles (default: false)',
                    },
                    title: {
                      type: 'string',
                      description: 'Document title for full HTML documents',
                    },
                    gfm: {
                      type: 'boolean',
                      description: 'Use GitHub Flavored Markdown (default: true)',
                    },
                    breaks: {
                      type: 'boolean',
                      description: 'Add line breaks for single line breaks (default: false)',
                    },
                  },
                },
              },
              required: ['markdown'],
            },
          },
          {
            name: 'markdown_to_pdf',
            description: 'Convert Markdown content directly to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: {
                  type: 'string',
                  description: 'Markdown content to convert to PDF',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the PDF should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Document title',
                    },
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output (default: false)',
                    },
                    format: {
                      type: 'string',
                      enum: ['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid'],
                      description: 'Paper format (default: A4)',
                    },
                    landscape: {
                      type: 'boolean',
                      description: 'Use landscape orientation (default: false)',
                    },
                    printBackground: {
                      type: 'boolean',
                      description: 'Print background graphics (default: true)',
                    },
                    gfm: {
                      type: 'boolean',
                      description: 'Use GitHub Flavored Markdown (default: true)',
                    },
                    breaks: {
                      type: 'boolean',
                      description: 'Add line breaks for single line breaks (default: false)',
                    },
                  },
                },
              },
              required: ['markdown', 'output_path'],
            },
          },
          {
            name: 'file_to_pdf',
            description: 'Convert HTML or Markdown files to PDF format',
            inputSchema: {
              type: 'object',
              properties: {
                input_path: {
                  type: 'string',
                  description: 'Full path to the input file (.html, .md, or .markdown)',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the PDF should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Document title (for Markdown files)',
                    },
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output (default: false)',
                    },
                    format: {
                      type: 'string',
                      enum: ['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid'],
                      description: 'Paper format (default: A4)',
                    },
                    landscape: {
                      type: 'boolean',
                      description: 'Use landscape orientation (default: false)',
                    },
                    printBackground: {
                      type: 'boolean',
                      description: 'Print background graphics (default: true)',
                    },
                  },
                },
              },
              required: ['input_path', 'output_path'],
            },
          },
          {
            name: 'html_to_docx',
            description: 'Convert HTML content to DOCX format',
            inputSchema: {
              type: 'object',
              properties: {
                html: {
                  type: 'string',
                  description: 'HTML content to convert to DOCX',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the DOCX should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    orientation: {
                      type: 'string',
                      enum: ['portrait', 'landscape'],
                      description: 'Page orientation (default: portrait)',
                    },
                    margins: {
                      type: 'object',
                      properties: {
                        top: { type: 'number', description: 'Top margin in twips (1440 = 1 inch)' },
                        right: { type: 'number', description: 'Right margin in twips' },
                        bottom: { type: 'number', description: 'Bottom margin in twips' },
                        left: { type: 'number', description: 'Left margin in twips' },
                        header: { type: 'number', description: 'Header margin in twips' },
                        footer: { type: 'number', description: 'Footer margin in twips' },
                        gutter: { type: 'number', description: 'Gutter margin in twips' },
                      },
                    },
                    title: {
                      type: 'string',
                      description: 'Document title',
                    },
                    subject: {
                      type: 'string',
                      description: 'Document subject',
                    },
                    creator: {
                      type: 'string',
                      description: 'Document creator/author',
                    },
                    keywords: {
                      type: 'string',
                      description: 'Document keywords',
                    },
                    description: {
                      type: 'string',
                      description: 'Document description',
                    },
                  },
                },
              },
              required: ['html', 'output_path'],
            },
          },
          {
            name: 'markdown_to_docx',
            description: 'Convert Markdown content directly to DOCX format',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: {
                  type: 'string',
                  description: 'Markdown content to convert to DOCX',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the DOCX should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output (default: false)',
                    },
                    gfm: {
                      type: 'boolean',
                      description: 'Use GitHub Flavored Markdown (default: true)',
                    },
                    breaks: {
                      type: 'boolean',
                      description: 'Add line breaks for single line breaks (default: false)',
                    },
                    fullDocument: {
                      type: 'boolean',
                      description: 'Create full HTML document with CSS (default: true)',
                    },
                    orientation: {
                      type: 'string',
                      enum: ['portrait', 'landscape'],
                      description: 'Page orientation (default: portrait)',
                    },
                    margins: {
                      type: 'object',
                      properties: {
                        top: { type: 'number', description: 'Top margin in twips (1440 = 1 inch)' },
                        right: { type: 'number', description: 'Right margin in twips' },
                        bottom: { type: 'number', description: 'Bottom margin in twips' },
                        left: { type: 'number', description: 'Left margin in twips' },
                        header: { type: 'number', description: 'Header margin in twips' },
                        footer: { type: 'number', description: 'Footer margin in twips' },
                        gutter: { type: 'number', description: 'Gutter margin in twips' },
                      },
                    },
                    title: {
                      type: 'string',
                      description: 'Document title',
                    },
                    subject: {
                      type: 'string',
                      description: 'Document subject',
                    },
                    creator: {
                      type: 'string',
                      description: 'Document creator/author',
                    },
                    keywords: {
                      type: 'string',
                      description: 'Document keywords',
                    },
                    description: {
                      type: 'string',
                      description: 'Document description',
                    },
                  },
                },
              },
              required: ['markdown', 'output_path'],
            },
          },
          {
            name: 'file_to_docx',
            description: 'Convert HTML or Markdown files to DOCX format',
            inputSchema: {
              type: 'object',
              properties: {
                input_path: {
                  type: 'string',
                  description: 'Full path to the input file (.html, .md, or .markdown)',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the DOCX should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Document title (auto-generated from filename if not provided)',
                    },
                    orientation: {
                      type: 'string',
                      enum: ['portrait', 'landscape'],
                      description: 'Page orientation (default: portrait)',
                    },
                    margins: {
                      type: 'object',
                      properties: {
                        top: { type: 'number', description: 'Top margin in twips (1440 = 1 inch)' },
                        right: { type: 'number', description: 'Right margin in twips' },
                        bottom: { type: 'number', description: 'Bottom margin in twips' },
                        left: { type: 'number', description: 'Left margin in twips' },
                        header: { type: 'number', description: 'Header margin in twips' },
                        footer: { type: 'number', description: 'Footer margin in twips' },
                        gutter: { type: 'number', description: 'Gutter margin in twips' },
                      },
                    },
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output (default: false)',
                    },
                    creator: {
                      type: 'string',
                      description: 'Document creator/author',
                    },
                    subject: {
                      type: 'string',
                      description: 'Document subject',
                    },
                  },
                },
              },
              required: ['input_path', 'output_path'],
            },
          },
          {
            name: 'file_to_html',
            description: 'Convert Markdown files to HTML format',
            inputSchema: {
              type: 'object',
              properties: {
                input_path: {
                  type: 'string',
                  description: 'Full path to the input Markdown file (.md or .markdown)',
                },
                output_path: {
                  type: 'string',
                  description: 'Full path where the HTML should be saved',
                },
                options: {
                  type: 'object',
                  properties: {
                    sanitize: {
                      type: 'boolean',
                      description: 'Sanitize HTML output (default: false)',
                    },
                    fullDocument: {
                      type: 'boolean',
                      description: 'Create full HTML document with CSS (default: false)',
                    },
                    title: {
                      type: 'string',
                      description: 'Document title for full HTML documents',
                    },
                    gfm: {
                      type: 'boolean',
                      description: 'Use GitHub Flavored Markdown (default: true)',
                    },
                    breaks: {
                      type: 'boolean',
                      description: 'Add line breaks for single line breaks (default: false)',
                    },
                  },
                },
              },
              required: ['input_path', 'output_path'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'html_to_pdf': {
            const { html, output_path, options = {} } = args as {
              html: string;
              output_path: string;
              options?: any;
            };

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Convert HTML to PDF
            const result = await HtmlToPdfConverter.convertHtmlToPdf(html, options);
            
            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert HTML to PDF',
                  },
                ],
                isError: true,
              };
            }

            // Save PDF file
            await fs.writeFile(output_path, result.data);

            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated successfully: ${output_path} (${Math.round(result.data.length / 1024)} KB)`,
                },
              ],
            };
          }

          case 'url_to_pdf': {
            const { url, output_path, options = {} } = args as {
              url: string;
              output_path: string;
              options?: any;
            };

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Convert URL to PDF
            const result = await HtmlToPdfConverter.convertUrlToPdf(url, options);
            
            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert URL to PDF',
                  },
                ],
                isError: true,
              };
            }

            // Save PDF file
            await fs.writeFile(output_path, result.data);

            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated successfully from ${url}: ${output_path} (${Math.round(result.data.length / 1024)} KB)`,
                },
              ],
            };
          }

          case 'markdown_to_html': {
            const { markdown, output_path, options = {} } = args as {
              markdown: string;
              output_path?: string;
              options?: any;
            };

            // Configure options for conversion
            const conversionOptions = {
              sanitize: options.sanitize || false,
              gfm: options.gfm !== false,
              breaks: options.breaks || false,
            };

            // Convert Markdown to HTML
            const result = await MarkdownToHtmlConverter.convertMarkdownToHtml(
              markdown,
              conversionOptions
            );

            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert Markdown to HTML',
                  },
                ],
                isError: true,
              };
            }

            let html = result.data;

            // Create full HTML document if requested
            if (options.fullDocument) {
              html = MarkdownToHtmlConverter.createFullHtmlDocument(
                html,
                options.title || 'Document'
              );
            }

            // Save HTML file if output path is provided
            if (output_path) {
              const outputDir = path.dirname(output_path);
              try {
                await fs.access(outputDir);
              } catch {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Directory does not exist: ${outputDir}`,
                    },
                  ],
                  isError: true,
                };
              }

              await fs.writeFile(output_path, html, 'utf-8');

              return {
                content: [
                  {
                    type: 'text',
                    text: `HTML generated successfully: ${output_path} (${Math.round(html.length / 1024)} KB)`,
                  },
                ],
              };
            } else {
              // Return HTML content directly
              return {
                content: [
                  {
                    type: 'text',
                    text: `HTML conversion completed successfully. Length: ${html.length} characters${result.metadata?.sanitized ? ' (sanitized)' : ''}`,
                  },
                  {
                    type: 'text',
                    text: `HTML Content:\n${html}`,
                  },
                ],
              };
            }
          }

          case 'markdown_to_pdf': {
            const { markdown, output_path, options = {} } = args as {
              markdown: string;
              output_path: string;
              options?: any;
            };

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Prepare conversion options
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
                margin: options.margin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
              },
              documentOptions: {
                title: options.title || 'Document',
                fullDocument: true,
              },
            };

            // Convert Markdown to PDF
            const result = await MarkdownToPdfConverter.convertMarkdownToPdf(
              markdown,
              conversionOptions
            );

            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert Markdown to PDF',
                  },
                ],
                isError: true,
              };
            }

            // Save PDF file
            await fs.writeFile(output_path, result.data);

            return {
              content: [
                {
                  type: 'text',
                  text: `PDF generated successfully: ${output_path} (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                },
              ],
            };
          }

          case 'file_to_pdf': {
            const { input_path, output_path, options = {} } = args as {
              input_path: string;
              output_path: string;
              options?: any;
            };

            // Check if input file exists
            try {
              await fs.access(input_path);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Input file does not exist: ${input_path}`,
                  },
                ],
                isError: true,
              };
            }

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Determine file type and convert accordingly
            const fileExtension = path.extname(input_path).toLowerCase();
            
            if (fileExtension === '.html' || fileExtension === '.htm') {
              // Convert HTML file to PDF
              const result = await HtmlToPdfConverter.convertHtmlFileToPdf(input_path, options);
              
              if (!result.success || !result.data) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: result.error || 'Failed to convert HTML file to PDF',
                    },
                  ],
                  isError: true,
                };
              }

              await fs.writeFile(output_path, result.data);

              return {
                content: [
                  {
                    type: 'text',
                    text: `PDF generated successfully from ${input_path}: ${output_path} (${Math.round(result.data.length / 1024)} KB)`,
                  },
                ],
              };

            } else if (fileExtension === '.md' || fileExtension === '.markdown') {
              // Convert Markdown file to PDF
              const conversionOptions = {
                markdownOptions: {
                  sanitize: options.sanitize || false,
                  gfm: true,
                  breaks: false,
                },
                pdfOptions: {
                  format: options.format || 'A4',
                  landscape: options.landscape || false,
                  printBackground: options.printBackground !== false,
                  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
                },
                documentOptions: {
                  title: options.title || path.basename(input_path, fileExtension),
                  fullDocument: true,
                },
              };

              const result = await MarkdownToPdfConverter.convertMarkdownFileToPdf(
                input_path,
                conversionOptions
              );

              if (!result.success || !result.data) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: result.error || 'Failed to convert Markdown file to PDF',
                    },
                  ],
                  isError: true,
                };
              }

              await fs.writeFile(output_path, result.data);

              return {
                content: [
                  {
                    type: 'text',
                    text: `PDF generated successfully from ${input_path}: ${output_path} (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                  },
                ],
              };

            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Unsupported file type: ${fileExtension}. Supported types: .html, .htm, .md, .markdown`,
                  },
                ],
                isError: true,
              };
            }
          }

          case 'html_to_docx': {
            const { html, output_path, options = {} } = args as {
              html: string;
              output_path: string;
              options?: any;
            };

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Convert HTML to DOCX
            const result = await HtmlToDocxConverter.convertHtmlToDocx(html, options);
            
            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert HTML to DOCX',
                  },
                ],
                isError: true,
              };
            }

            // Save DOCX file
            await fs.writeFile(output_path, result.data);

            return {
              content: [
                {
                  type: 'text',
                  text: `DOCX generated successfully: ${output_path} (${Math.round(result.data.length / 1024)} KB)`,
                },
              ],
            };
          }

          case 'markdown_to_docx': {
            const { markdown, output_path, options = {} } = args as {
              markdown: string;
              output_path: string;
              options?: any;
            };

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Prepare conversion options
            const conversionOptions = {
              sanitize: options.sanitize || false,
              gfm: options.gfm !== false,
              breaks: options.breaks || false,
              fullDocument: options.fullDocument !== false,
              orientation: options.orientation || 'portrait',
              margins: options.margins,
              title: options.title || 'Document',
              subject: options.subject,
              creator: options.creator,
              keywords: options.keywords,
              description: options.description,
            };

            // Convert Markdown to DOCX
            const result = await MarkdownToDocxConverter.convertMarkdownToDocx(
              markdown,
              conversionOptions
            );

            if (!result.success || !result.data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: result.error || 'Failed to convert Markdown to DOCX',
                  },
                ],
                isError: true,
              };
            }

            // Save DOCX file
            await fs.writeFile(output_path, result.data);

            return {
              content: [
                {
                  type: 'text',
                  text: `DOCX generated successfully: ${output_path} (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                },
              ],
            };
          }

          case 'file_to_docx': {
            const { input_path, output_path, options = {} } = args as {
              input_path: string;
              output_path: string;
              options?: any;
            };

            // Check if input file exists
            try {
              await fs.access(input_path);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Input file does not exist: ${input_path}`,
                  },
                ],
                isError: true,
              };
            }

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Determine file type and convert accordingly
            const fileExtension = path.extname(input_path).toLowerCase();
            
            if (fileExtension === '.html' || fileExtension === '.htm') {
              // Convert HTML file to DOCX
              const htmlContent = await fs.readFile(input_path, 'utf-8');
              const conversionOptions = {
                ...options,
                title: options.title || path.basename(input_path, fileExtension),
              };

              const result = await HtmlToDocxConverter.convertHtmlToDocx(htmlContent, conversionOptions);
              
              if (!result.success || !result.data) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: result.error || 'Failed to convert HTML file to DOCX',
                    },
                  ],
                  isError: true,
                };
              }

              await fs.writeFile(output_path, result.data);

              return {
                content: [
                  {
                    type: 'text',
                    text: `DOCX generated successfully from ${input_path}: ${output_path} (${Math.round(result.data.length / 1024)} KB)`,
                  },
                ],
              };

            } else if (fileExtension === '.md' || fileExtension === '.markdown') {
              // Convert Markdown file to DOCX
              const markdownContent = await fs.readFile(input_path, 'utf-8');
              const conversionOptions = {
                sanitize: options.sanitize || false,
                gfm: true,
                breaks: false,
                fullDocument: true,
                orientation: options.orientation || 'portrait',
                margins: options.margins,
                title: options.title || path.basename(input_path, fileExtension),
                subject: options.subject,
                creator: options.creator,
              };

              const result = await MarkdownToDocxConverter.convertMarkdownToDocx(
                markdownContent,
                conversionOptions
              );

              if (!result.success || !result.data) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: result.error || 'Failed to convert Markdown file to DOCX',
                    },
                  ],
                  isError: true,
                };
              }

              await fs.writeFile(output_path, result.data);

              return {
                content: [
                  {
                    type: 'text',
                    text: `DOCX generated successfully from ${input_path}: ${output_path} (${Math.round(result.data.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                  },
                ],
              };

            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Unsupported file type for DOCX conversion: ${fileExtension}. Supported types: .html, .htm, .md, .markdown`,
                  },
                ],
                isError: true,
              };
            }
          }

          case 'file_to_html': {
            const { input_path, output_path, options = {} } = args as {
              input_path: string;
              output_path: string;
              options?: any;
            };

            // Check if input file exists
            try {
              await fs.access(input_path);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Input file does not exist: ${input_path}`,
                  },
                ],
                isError: true,
              };
            }

            // Validate output directory
            const outputDir = path.dirname(output_path);
            try {
              await fs.access(outputDir);
            } catch {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Directory does not exist: ${outputDir}`,
                  },
                ],
                isError: true,
              };
            }

            // Check if input is a Markdown file
            const fileExtension = path.extname(input_path).toLowerCase();
            
            if (fileExtension === '.md' || fileExtension === '.markdown') {
              // Convert Markdown file to HTML
              const markdownContent = await fs.readFile(input_path, 'utf-8');
              
              // Configure options for conversion
              const conversionOptions = {
                sanitize: options.sanitize || false,
                gfm: options.gfm !== false,
                breaks: options.breaks || false,
              };

              // Convert Markdown to HTML
              const result = await MarkdownToHtmlConverter.convertMarkdownToHtml(
                markdownContent,
                conversionOptions
              );

              if (!result.success || !result.data) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: result.error || 'Failed to convert Markdown file to HTML',
                    },
                  ],
                  isError: true,
                };
              }

              let html = result.data;

              // Create full HTML document if requested
              if (options.fullDocument) {
                html = MarkdownToHtmlConverter.createFullHtmlDocument(
                  html,
                  options.title || path.basename(input_path, fileExtension)
                );
              }

              await fs.writeFile(output_path, html, 'utf-8');

              return {
                content: [
                  {
                    type: 'text',
                    text: `HTML generated successfully from ${input_path}: ${output_path} (${Math.round(html.length / 1024)} KB)${result.metadata?.sanitized ? ' (HTML was sanitized)' : ''}`,
                  },
                ],
              };

            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Unsupported file type for HTML conversion: ${fileExtension}. Supported types: .md, .markdown`,
                  },
                ],
                isError: true,
              };
            }
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[MCP Error] Tool call failed:`, errorMessage);

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
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
                  capabilities: ['HTML to PDF', 'HTML to DOCX', 'Markdown to HTML', 'Markdown to PDF', 'Markdown to DOCX', 'URL to PDF', 'File conversions'],
                  supportedFormats: {
                    input: ['HTML', 'Markdown', 'URL'],
                    output: ['PDF', 'HTML', 'DOCX'],
                  },
                  dependencies: {
                    puppeteer: 'Latest',
                    marked: 'Latest',
                    'sanitize-html': 'Latest',
                  },
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

    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      console.error('Received SIGINT, shutting down gracefully...');
      try {
        await this.server.close();
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Received SIGTERM, shutting down gracefully...');
      try {
        await this.server.close();
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Conversion MCP Server running on stdio');
    } catch (error) {
      console.error('Failed to start transport:', error);
      throw error;
    }
  }
}

// Start the server
const server = new ConversionMCPServer();
server.run().catch((error: Error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});