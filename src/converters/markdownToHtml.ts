import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

const MarkdownToHtmlOptionsSchema = z.object({
  sanitize: z.boolean().optional(),
  breaks: z.boolean().optional(),
  gfm: z.boolean().optional(),
  mangle: z.boolean().optional(),
  pedantic: z.boolean().optional(),
  sanitizerOptions: z.object({
    allowedTags: z.array(z.string()).optional(),
    allowedAttributes: z.record(z.array(z.string())).optional(),
    allowedSchemes: z.array(z.string()).optional(),
    allowedClasses: z.record(z.array(z.string())).optional(),
  }).optional(),
}).optional();

export type MarkdownToHtmlOptions = z.infer<typeof MarkdownToHtmlOptionsSchema>;

interface ConversionResult {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: {
    originalLength: number;
    htmlLength: number;
    sanitized: boolean;
  };
}

export class MarkdownToHtmlConverter {
  private static readonly DEFAULT_SANITIZER_OPTIONS = {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's', 'b', 'i',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'blockquote': ['cite'],
      'th': ['align', 'colspan', 'rowspan'],
      'td': ['align', 'colspan', 'rowspan'],
      'div': ['class', 'id'],
      'span': ['class', 'id'],
      'pre': ['class'],
      'code': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedClasses: {
      'pre': ['language-*'],
      'code': ['language-*'],
    },
  };

  static async convertMarkdownToHtml(
    markdown: string,
    options?: MarkdownToHtmlOptions
  ): Promise<ConversionResult> {
    if (!markdown || typeof markdown !== 'string') {
      return {
        success: false,
        error: 'Invalid markdown input: Markdown must be a non-empty string',
      };
    }

    try {
      // Validate options
      const validatedOptions = MarkdownToHtmlOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      const opts = validatedOptions.data || {};

      // Configure marked
      marked.setOptions({
        breaks: opts.breaks || false,
        gfm: opts.gfm !== false,
        pedantic: opts.pedantic || false,
      });

      // Convert markdown to HTML
      let html = await marked.parse(markdown);

      // Sanitize HTML if requested
      let sanitized = false;
      if (opts.sanitize) {
        const sanitizerOptions = {
          ...this.DEFAULT_SANITIZER_OPTIONS,
          ...opts.sanitizerOptions,
        };
        
        html = sanitizeHtml(html, sanitizerOptions);
        sanitized = true;
      }

      return {
        success: true,
        data: html,
        metadata: {
          originalLength: markdown.length,
          htmlLength: html.length,
          sanitized,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Markdown conversion failed: ${errorMessage}`,
      };
    }
  }

  static async convertMarkdownFileToHtml(
    filePath: string,
    options?: MarkdownToHtmlOptions
  ): Promise<ConversionResult> {
    try {
      const { promises: fs } = await import('fs');
      const markdown = await fs.readFile(filePath, 'utf-8');
      return await this.convertMarkdownToHtml(markdown, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to read markdown file: ${errorMessage}`,
      };
    }
  }

  static createFullHtmlDocument(
    htmlContent: string,
    title: string = 'Document',
    cssStyles?: string
  ): string {
    const defaultStyles = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      
      pre {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
      }
      
      code {
        background: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
      
      blockquote {
        border-left: 4px solid #ddd;
        margin: 0;
        padding-left: 20px;
        color: #666;
      }
      
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      a {
        color: #0066cc;
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${defaultStyles}
    ${cssStyles || ''}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  }
}