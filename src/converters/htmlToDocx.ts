import { asBlob } from 'html-docx-js';
import { z } from 'zod';

const HtmlToDocxOptionsSchema = z.object({
  orientation: z.enum(['portrait', 'landscape']).optional(),
  margins: z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
    header: z.number().optional(),
    footer: z.number().optional(),
    gutter: z.number().optional(),
  }).optional(),
  title: z.string().optional(),
  subject: z.string().optional(),
  creator: z.string().optional(),
  keywords: z.string().optional(),
  description: z.string().optional(),
}).optional();

export type HtmlToDocxOptions = z.infer<typeof HtmlToDocxOptionsSchema>;

interface ConversionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  metadata?: {
    size: number;
  };
}

export class HtmlToDocxConverter {
  private static readonly DEFAULT_OPTIONS = {
    orientation: 'portrait' as const,
    margins: {
      top: 1440, // 1 inch in twips (1440 twips = 1 inch)
      right: 1440,
      bottom: 1440,
      left: 1440,
    },
  };

  static async convertHtmlToDocx(
    html: string,
    options?: HtmlToDocxOptions
  ): Promise<ConversionResult> {
    if (!html || typeof html !== 'string') {
      return {
        success: false,
        error: 'Invalid HTML input: HTML must be a non-empty string',
      };
    }

    try {
      // Validate options
      const validatedOptions = HtmlToDocxOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      // Merge options with defaults
      const docxOptions = {
        ...this.DEFAULT_OPTIONS,
        ...validatedOptions.data,
      };

      // Prepare HTML with document metadata if provided
      let processedHtml = html;
      if (docxOptions.title || docxOptions.subject || docxOptions.creator) {
        const headContent = [];
        if (docxOptions.title) headContent.push(`<title>${docxOptions.title}</title>`);
        if (docxOptions.subject) headContent.push(`<meta name="subject" content="${docxOptions.subject}">`);
        if (docxOptions.creator) headContent.push(`<meta name="creator" content="${docxOptions.creator}">`);
        if (docxOptions.keywords) headContent.push(`<meta name="keywords" content="${docxOptions.keywords}">`);
        if (docxOptions.description) headContent.push(`<meta name="description" content="${docxOptions.description}">`);

        // If HTML doesn't have html/head tags, wrap it
        if (!html.includes('<html') && !html.includes('<head')) {
          processedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              ${headContent.join('\n              ')}
            </head>
            <body>
              ${html}
            </body>
            </html>
          `;
        } else if (html.includes('<head>')) {
          // Insert metadata into existing head
          processedHtml = html.replace('<head>', `<head>\n              ${headContent.join('\n              ')}`);
        }
      }

      // Convert HTML to DOCX using the library's options format
      const libOptions: {
        orientation?: 'portrait' | 'landscape';
        margins?: {
          top?: number;
          right?: number;
          bottom?: number;
          left?: number;
          header?: number;
          footer?: number;
          gutter?: number;
        };
      } = {};

      if (docxOptions.orientation) {
        libOptions.orientation = docxOptions.orientation;
      }
      if (docxOptions.margins) {
        libOptions.margins = docxOptions.margins;
      }

      // Convert HTML to DOCX
      const docxResult = asBlob(processedHtml, libOptions);
      
      // Handle both Blob (browser) and Buffer (Node.js) scenarios
      let docxBuffer: Buffer;
      if (docxResult instanceof Buffer) {
        docxBuffer = docxResult;
      } else if (docxResult instanceof Blob) {
        // Convert Blob to Buffer for Node.js
        const arrayBuffer = await docxResult.arrayBuffer();
        docxBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Unexpected return type from html-docx-js');
      }

      return {
        success: true,
        data: Buffer.from(docxBuffer),
        metadata: {
          size: docxBuffer.length,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `DOCX generation failed: ${errorMessage}`,
      };
    }
  }

  static async convertHtmlFileToDocx(
    filePath: string,
    options?: HtmlToDocxOptions
  ): Promise<ConversionResult> {
    try {
      const { promises: fs } = await import('fs');
      const html = await fs.readFile(filePath, 'utf-8');
      return await this.convertHtmlToDocx(html, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to read HTML file: ${errorMessage}`,
      };
    }
  }

  static async convertUrlToDocx(
    url: string,
    options?: HtmlToDocxOptions
  ): Promise<ConversionResult> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'Invalid URL input: URL must be a non-empty string',
      };
    }

    try {
      // Fetch HTML content from URL
      const response = await fetch(url);
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        };
      }

      const html = await response.text();
      return await this.convertHtmlToDocx(html, options);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `DOCX generation from URL failed: ${errorMessage}`,
      };
    }
  }
}