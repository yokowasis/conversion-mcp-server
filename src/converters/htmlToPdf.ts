import puppeteer, { PDFOptions } from 'puppeteer';
import { z } from 'zod';

const HtmlToPdfOptionsSchema = z.object({
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
}).optional();

export type HtmlToPdfOptions = z.infer<typeof HtmlToPdfOptionsSchema>;

interface ConversionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  metadata?: {
    size: number;
    pages?: number;
  };
}

export class HtmlToPdfConverter {
  private static readonly DEFAULT_OPTIONS: PDFOptions = {
    format: 'A4',
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
    printBackground: true,
    displayHeaderFooter: false,
    preferCSSPageSize: false,
  };

  private static readonly LAUNCH_OPTIONS = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  };

  static async convertHtmlToPdf(
    html: string,
    options?: HtmlToPdfOptions
  ): Promise<ConversionResult> {
    if (!html || typeof html !== 'string') {
      return {
        success: false,
        error: 'Invalid HTML input: HTML must be a non-empty string',
      };
    }

    let browser = null;
    try {
      // Validate options
      const validatedOptions = HtmlToPdfOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      // Merge options with defaults
      const pdfOptions: PDFOptions = {
        ...this.DEFAULT_OPTIONS,
        ...validatedOptions.data,
      };

      // Launch browser
      browser = await puppeteer.launch(this.LAUNCH_OPTIONS);
      const page = await browser.newPage();

      // Set content and wait for network idle
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return {
        success: true,
        data: Buffer.from(pdfBuffer),
        metadata: {
          size: pdfBuffer.length,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `PDF generation failed: ${errorMessage}`,
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Failed to close browser:', closeError);
        }
      }
    }
  }

  static async convertHtmlFileToPdf(
    filePath: string,
    options?: HtmlToPdfOptions
  ): Promise<ConversionResult> {
    try {
      const { promises: fs } = await import('fs');
      const html = await fs.readFile(filePath, 'utf-8');
      return await this.convertHtmlToPdf(html, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to read HTML file: ${errorMessage}`,
      };
    }
  }

  static async convertUrlToPdf(
    url: string,
    options?: HtmlToPdfOptions
  ): Promise<ConversionResult> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'Invalid URL input: URL must be a non-empty string',
      };
    }

    let browser = null;
    try {
      // Validate options
      const validatedOptions = HtmlToPdfOptionsSchema.safeParse(options);
      if (!validatedOptions.success) {
        return {
          success: false,
          error: `Invalid options: ${validatedOptions.error.message}`,
        };
      }

      // Merge options with defaults
      const pdfOptions: PDFOptions = {
        ...this.DEFAULT_OPTIONS,
        ...validatedOptions.data,
      };

      // Launch browser
      browser = await puppeteer.launch(this.LAUNCH_OPTIONS);
      const page = await browser.newPage();

      // Navigate to URL and wait for network idle
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return {
        success: true,
        data: Buffer.from(pdfBuffer),
        metadata: {
          size: pdfBuffer.length,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `PDF generation from URL failed: ${errorMessage}`,
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Failed to close browser:', closeError);
        }
      }
    }
  }
}