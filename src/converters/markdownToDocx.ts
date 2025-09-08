import { MarkdownToHtmlConverter, MarkdownToHtmlOptions } from './markdownToHtml.js';
import { HtmlToDocxConverter, HtmlToDocxOptions } from './htmlToDocx.js';
import { z } from 'zod';

const MarkdownToDocxOptionsSchema = z.object({
  // Markdown options
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
  
  // DOCX options
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
  
  // Additional options
  fullDocument: z.boolean().optional(),
  cssStyles: z.string().optional(),
}).optional();

export type MarkdownToDocxOptions = z.infer<typeof MarkdownToDocxOptionsSchema>;

interface ConversionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  metadata?: {
    size: number;
    originalLength: number;
    htmlLength: number;
    sanitized: boolean;
  };
}

export class MarkdownToDocxConverter {
  static async convertMarkdownToDocx(
    markdown: string,
    options?: MarkdownToDocxOptions
  ): Promise<ConversionResult> {
    if (!markdown || typeof markdown !== 'string') {
      return {
        success: false,
        error: 'Invalid markdown input: Markdown must be a non-empty string',
      };
    }

    try {
      // Validate options
      const validatedOptions = MarkdownToDocxOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      const opts = validatedOptions.data || {};

      // Extract markdown conversion options
      const markdownOptions: MarkdownToHtmlOptions = {
        sanitize: opts.sanitize,
        breaks: opts.breaks,
        gfm: opts.gfm,
        mangle: opts.mangle,
        pedantic: opts.pedantic,
        sanitizerOptions: opts.sanitizerOptions,
      };

      // Convert markdown to HTML
      const htmlResult = await MarkdownToHtmlConverter.convertMarkdownToHtml(
        markdown,
        markdownOptions
      );

      if (!htmlResult.success || !htmlResult.data) {
        return {
          success: false,
          error: htmlResult.error || 'Failed to convert markdown to HTML',
        };
      }

      // Prepare HTML for DOCX conversion
      let html = htmlResult.data;
      const title = opts.title || 'Document';

      // Create full HTML document if requested or if needed for DOCX
      if (opts.fullDocument !== false) {
        html = MarkdownToHtmlConverter.createFullHtmlDocument(
          html,
          title,
          opts.cssStyles
        );
      }

      // Extract DOCX conversion options
      const docxOptions: HtmlToDocxOptions = {
        orientation: opts.orientation,
        margins: opts.margins,
        title: opts.title,
        subject: opts.subject,
        creator: opts.creator,
        keywords: opts.keywords,
        description: opts.description,
      };

      // Convert HTML to DOCX
      const docxResult = await HtmlToDocxConverter.convertHtmlToDocx(html, docxOptions);

      if (!docxResult.success || !docxResult.data) {
        return {
          success: false,
          error: docxResult.error || 'Failed to convert HTML to DOCX',
        };
      }

      return {
        success: true,
        data: docxResult.data,
        metadata: {
          size: docxResult.data.length,
          originalLength: htmlResult.metadata?.originalLength || markdown.length,
          htmlLength: htmlResult.metadata?.htmlLength || html.length,
          sanitized: htmlResult.metadata?.sanitized || false,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Markdown to DOCX conversion failed: ${errorMessage}`,
      };
    }
  }

  static async convertMarkdownFileToDocx(
    filePath: string,
    options?: MarkdownToDocxOptions
  ): Promise<ConversionResult> {
    try {
      const { promises: fs } = await import('fs');
      const markdown = await fs.readFile(filePath, 'utf-8');
      return await this.convertMarkdownToDocx(markdown, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to read markdown file: ${errorMessage}`,
      };
    }
  }
}