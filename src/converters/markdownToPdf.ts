import { z } from 'zod';
import { HtmlToPdfConverter } from './htmlToPdf.js';
import { MarkdownToHtmlConverter } from './markdownToHtml.js';

const MarkdownToPdfOptionsSchema = z.object({
  markdownOptions: z.object({
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
  }).optional(),
  pdfOptions: z.object({
    format: z.enum(['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid']).optional(),
    margin: z.object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional(),
    }).optional(),
    printBackground: z.boolean().optional(),
    landscape: z.boolean().optional(),
    scale: z.number().min(0.1).max(2).optional(),
    displayHeaderFooter: z.boolean().optional(),
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    preferCSSPageSize: z.boolean().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
  documentOptions: z.object({
    title: z.string().optional(),
    cssStyles: z.string().optional(),
    fullDocument: z.boolean().optional(),
  }).optional(),
}).optional();

export type MarkdownToPdfOptions = z.infer<typeof MarkdownToPdfOptionsSchema>;

interface ConversionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  metadata?: {
    markdownLength: number;
    htmlLength: number;
    pdfSize: number;
    sanitized: boolean;
  };
}

export class MarkdownToPdfConverter {
  static async convertMarkdownToPdf(
    markdown: string,
    options?: MarkdownToPdfOptions
  ): Promise<ConversionResult> {
    if (!markdown || typeof markdown !== 'string') {
      return {
        success: false,
        error: 'Invalid markdown input: Markdown must be a non-empty string',
      };
    }

    try {
      // Validate options
      const validatedOptions = MarkdownToPdfOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      const opts = validatedOptions.data || {};

      // Step 1: Convert Markdown to HTML
      const htmlResult = await MarkdownToHtmlConverter.convertMarkdownToHtml(
        markdown,
        opts.markdownOptions
      );

      if (!htmlResult.success || !htmlResult.data) {
        return {
          success: false,
          error: `Markdown to HTML conversion failed: ${htmlResult.error}`,
        };
      }

      let html = htmlResult.data;
      
      // Create full HTML document if requested (default: true)
      const shouldCreateFullDocument = opts.documentOptions?.fullDocument !== false;
      if (shouldCreateFullDocument) {
        html = MarkdownToHtmlConverter.createFullHtmlDocument(
          html,
          opts.documentOptions?.title || 'Document',
          opts.documentOptions?.cssStyles
        );
      }

      // Step 2: Convert HTML to PDF
      const pdfResult = await HtmlToPdfConverter.convertHtmlToPdf(
        html,
        opts.pdfOptions
      );

      if (!pdfResult.success || !pdfResult.data) {
        return {
          success: false,
          error: `HTML to PDF conversion failed: ${pdfResult.error}`,
        };
      }

      return {
        success: true,
        data: pdfResult.data,
        metadata: {
          markdownLength: markdown.length,
          htmlLength: html.length,
          pdfSize: pdfResult.data.length,
          sanitized: htmlResult.metadata?.sanitized || false,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Markdown to PDF conversion failed: ${errorMessage}`,
      };
    }
  }

  static async convertMarkdownFileToPdf(
    filePath: string,
    options?: MarkdownToPdfOptions
  ): Promise<ConversionResult> {
    try {
      const { promises: fs } = await import('fs');
      const markdown = await fs.readFile(filePath, 'utf-8');
      return await this.convertMarkdownToPdf(markdown, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to read markdown file: ${errorMessage}`,
      };
    }
  }

  static async convertMultipleMarkdownToPdf(
    markdownContents: { content: string; title?: string }[],
    options?: MarkdownToPdfOptions
  ): Promise<ConversionResult> {
    if (!Array.isArray(markdownContents) || markdownContents.length === 0) {
      return {
        success: false,
        error: 'Invalid input: markdownContents must be a non-empty array',
      };
    }

    try {
      // Combine all markdown contents into a single document
      let combinedMarkdown = '';
      let totalMarkdownLength = 0;

      for (let i = 0; i < markdownContents.length; i++) {
        const { content, title } = markdownContents[i];
        
        if (!content || typeof content !== 'string') {
          return {
            success: false,
            error: `Invalid markdown content at index ${i}: content must be a non-empty string`,
          };
        }

        totalMarkdownLength += content.length;

        // Add title if provided
        if (title) {
          combinedMarkdown += `# ${title}\n\n`;
        }

        combinedMarkdown += content;

        // Add page break between documents (except for the last one)
        if (i < markdownContents.length - 1) {
          combinedMarkdown += '\n\n<div style="page-break-after: always;"></div>\n\n';
        }
      }

      // Convert combined markdown to PDF
      const result = await this.convertMarkdownToPdf(combinedMarkdown, options);
      
      if (result.success && result.metadata) {
        result.metadata.markdownLength = totalMarkdownLength;
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Multiple markdown to PDF conversion failed: ${errorMessage}`,
      };
    }
  }
}