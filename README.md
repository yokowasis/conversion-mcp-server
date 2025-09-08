# Conversion MCP Server

A powerful Model Context Protocol (MCP) server for converting documents between different formats, built with TypeScript and designed for Claude Desktop and other MCP clients.

## 🎯 Features

- 🔄 **HTML to PDF**: Convert HTML content or web pages to PDF format
- 📝 **Markdown to HTML**: Transform Markdown content to HTML with full styling
- 📄 **Markdown to PDF**: Direct conversion from Markdown to PDF with custom styling
- 📋 **HTML to DOCX**: Convert HTML content to Microsoft Word format
- 📑 **Markdown to DOCX**: Transform Markdown directly to DOCX with formatting
- 🌐 **URL to PDF/DOCX**: Convert any web page URL directly to PDF or DOCX
- 📁 **File Conversions**: Batch process HTML and Markdown files to multiple formats
- 🛡️ **Security**: Built-in HTML sanitization for untrusted content
- ⚡ **Fast**: Uses latest Puppeteer (v24.19.0), Marked (v16.2.1), and html-docx-js
- 🎨 **Customizable**: Full control over PDF/DOCX options, margins, formats, and styling
- 📦 **TypeScript**: Complete type safety and modern JavaScript features
- 🚀 **Production Ready**: Optimized for headless environments and CI/CD

## 🔧 Available Tools

### `html_to_pdf`
Convert HTML content to PDF format with customizable options.

**Input:**
- `html` (string): HTML content to convert
- `output_path` (string): Full path where PDF should be saved
- `options` (object, optional): PDF generation options
  - `format`: Paper format (A4, A3, Letter, etc.)
  - `landscape`: Portrait or landscape orientation
  - `printBackground`: Include background graphics
  - `scale`: Webpage rendering scale (0.1-2)
  - `margin`: Custom margins (top, right, bottom, left)

**Example:**
```json
{
  "html": "<h1>Hello World</h1><p>This is a test document.</p>",
  "output_path": "/Users/username/Documents/output.pdf",
  "options": {
    "format": "A4",
    "landscape": false,
    "printBackground": true,
    "margin": {
      "top": "2cm",
      "right": "1cm",
      "bottom": "2cm",
      "left": "1cm"
    }
  }
}
```

### `url_to_pdf`
Convert any web page URL directly to PDF format.

**Input:**
- `url` (string): URL of the web page to convert
- `output_path` (string): Full path where PDF should be saved
- `options` (object, optional): Same PDF options as html_to_pdf

**Example:**
```json
{
  "url": "https://example.com",
  "output_path": "/Users/username/Documents/webpage.pdf",
  "options": {
    "format": "A4",
    "printBackground": true
  }
}
```

### `markdown_to_html`
Convert Markdown content to HTML format with optional sanitization.

**Input:**
- `markdown` (string): Markdown content to convert
- `output_path` (string, optional): Path to save HTML file (if not provided, returns HTML content)
- `options` (object, optional): Conversion options
  - `sanitize`: Remove potentially dangerous HTML (default: false)
  - `fullDocument`: Create complete HTML document with CSS (default: false)
  - `title`: Document title for full documents
  - `gfm`: Use GitHub Flavored Markdown (default: true)
  - `breaks`: Convert single line breaks to `<br>` (default: false)

**Example:**
```json
{
  "markdown": "# Hello World\n\nThis is **bold** text.",
  "output_path": "/Users/username/Documents/output.html",
  "options": {
    "fullDocument": true,
    "title": "My Document",
    "sanitize": false,
    "gfm": true
  }
}
```

### `markdown_to_pdf`
Convert Markdown content directly to PDF format.

**Input:**
- `markdown` (string): Markdown content to convert
- `output_path` (string): Full path where PDF should be saved
- `options` (object, optional): Combined Markdown and PDF options
  - `title`: Document title
  - `sanitize`: Sanitize HTML output (default: false)
  - `format`: Paper format (default: A4)
  - `landscape`: Orientation (default: false)
  - `printBackground`: Include backgrounds (default: true)
  - `gfm`: Use GitHub Flavored Markdown (default: true)
  - `breaks`: Convert line breaks (default: false)

**Example:**
```json
{
  "markdown": "# My Report\n\n## Introduction\n\nThis is a **sample** report with *emphasis*.",
  "output_path": "/Users/username/Documents/report.pdf",
  "options": {
    "title": "Monthly Report",
    "format": "A4",
    "landscape": false,
    "sanitize": false
  }
}
```

### `html_to_docx`
Convert HTML content to DOCX format with customizable options.

**Input:**
- `html` (string): HTML content to convert
- `output_path` (string): Full path where DOCX should be saved
- `options` (object, optional): DOCX generation options
  - `orientation`: Page orientation (portrait, landscape)
  - `margins`: Custom margins in twips (1440 = 1 inch)
    - `top`, `right`, `bottom`, `left`: Page margins
    - `header`, `footer`, `gutter`: Additional margin options
  - `title`: Document title
  - `subject`: Document subject
  - `creator`: Document creator/author
  - `keywords`: Document keywords
  - `description`: Document description

**Example:**
```json
{
  "html": "<h1>Hello World</h1><p>This is a test document with <strong>bold</strong> text.</p>",
  "output_path": "/Users/username/Documents/output.docx",
  "options": {
    "orientation": "portrait",
    "title": "My Document",
    "creator": "John Doe",
    "margins": {
      "top": 1440,
      "right": 1440,
      "bottom": 1440,
      "left": 1440
    }
  }
}
```

### `markdown_to_docx`
Convert Markdown content directly to DOCX format.

**Input:**
- `markdown` (string): Markdown content to convert
- `output_path` (string): Full path where DOCX should be saved
- `options` (object, optional): Combined Markdown and DOCX options
  - `title`: Document title
  - `orientation`: Page orientation (portrait, landscape)
  - `margins`: Custom margins in twips
  - `gfm`: Use GitHub Flavored Markdown (default: true)
  - `breaks`: Convert single line breaks to `<br>` (default: false)
  - `sanitize`: Sanitize HTML output (default: false)
  - `fullDocument`: Create full HTML document with CSS (default: true)
  - `subject`: Document subject
  - `creator`: Document creator/author
  - `keywords`: Document keywords
  - `description`: Document description

**Example:**
```json
{
  "markdown": "# My Report\n\n## Summary\n\nThis is a **sample** report with *emphasis*.\n\n- Item 1\n- Item 2\n- Item 3",
  "output_path": "/Users/username/Documents/report.docx",
  "options": {
    "title": "Monthly Report",
    "creator": "Jane Smith",
    "orientation": "portrait",
    "gfm": true,
    "fullDocument": true
  }
}
```

### `file_to_pdf`
Convert HTML or Markdown files to PDF format.

**Input:**
- `input_path` (string): Path to input file (.html, .htm, .md, .markdown)
- `output_path` (string): Full path where PDF should be saved
- `options` (object, optional): Format-specific conversion options

**Example:**
```json
{
  "input_path": "/Users/username/Documents/input.md",
  "output_path": "/Users/username/Documents/output.pdf",
  "options": {
    "title": "Converted Document",
    "format": "A4",
    "printBackground": true
  }
}
```

### `file_to_docx`
Convert HTML or Markdown files to DOCX format.

**Input:**
- `input_path` (string): Path to input file (.html, .htm, .md, .markdown)
- `output_path` (string): Full path where DOCX should be saved
- `options` (object, optional): Format-specific conversion options
  - `title`: Document title (auto-generated from filename if not provided)
  - `orientation`: Page orientation (portrait, landscape)
  - `margins`: Custom margins in twips
  - `sanitize`: Sanitize HTML output (default: false)
  - `creator`: Document creator/author

**Example:**
```json
{
  "input_path": "/Users/username/Documents/input.md",
  "output_path": "/Users/username/Documents/output.docx",
  "options": {
    "title": "Converted Document",
    "orientation": "portrait",
    "creator": "Document Converter"
  }
}
```

## 📋 Prerequisites

- Node.js v18.0.0 or higher
- npm or yarn package manager
- MCP client (e.g., Claude Desktop)

## 🚀 Quick Start

### Option 1: NPX (Recommended)

Run directly without installation:

```bash
# Test the server
npx conversion-mcp-server help

# Show help information
npx conversion-mcp-server --help
```

#### For Claude Desktop Integration:

1. **Find your Claude Desktop config file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add server configuration:**
   ```json
   {
     "mcpServers": {
       "conversion-server": {
         "command": "npx",
         "args": ["conversion-mcp-server"]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Option 2: Manual Installation

Clone and build locally:

```bash
git clone https://github.com/yokowasis/conversion-mcp-server.git
cd conversion-mcp-server
npm install
npm run build
```

For Claude Desktop with local installation:
```json
{
  "mcpServers": {
    "conversion-server": {
      "command": "node",
      "args": ["/path/to/your/conversion-mcp-server/dist/index.js"]
    }
  }
}
```

## 🖥️ Server Modes

### stdio Mode (Default)
For MCP client integration:
```bash
npx conversion-mcp-server          # Default stdio mode
```

### HTTP Mode
For web-based integrations and testing:
```bash
npx conversion-mcp-server http               # HTTP server on port 3000
npx conversion-mcp-server http --port 8080   # HTTP server on port 8080
```

## 💡 Usage Examples

Once integrated with Claude Desktop, you can:

```
"Convert this HTML to PDF: <h1>Hello World</h1><p>This is a test.</p>"

"Convert this HTML to DOCX: <h1>Hello World</h1><p>This is a test.</p>"

"Convert this Markdown to PDF and save it to ~/Documents/report.pdf:
# My Report
## Summary
This is a **sample** report."

"Convert this Markdown to DOCX and save it to ~/Documents/report.docx:
# My Report
## Summary
This is a **sample** report with *emphasis*."

"Convert the webpage https://example.com to PDF format"

"Convert the webpage https://example.com to DOCX format"

"Convert my markdown file at ~/Documents/notes.md to a PDF"

"Convert my markdown file at ~/Documents/notes.md to a DOCX"
```

## 📁 Project Structure

```
conversion-mcp-server/
├── src/
│   ├── converters/
│   │   ├── htmlToPdf.ts          # HTML to PDF conversion
│   │   ├── htmlToDocx.ts         # HTML to DOCX conversion
│   │   ├── markdownToHtml.ts     # Markdown to HTML conversion
│   │   ├── markdownToPdf.ts      # Markdown to PDF conversion
│   │   ├── markdownToDocx.ts     # Markdown to DOCX conversion
│   │   └── index.ts              # Converter exports
│   ├── index.ts                  # Main MCP server
│   └── http-server.ts            # HTTP server mode
├── dist/                         # Compiled JavaScript
├── test/                         # Test files and examples
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Development Scripts

- `npm run build` - Build for production
- `npm run dev` - Start development server
- `npm run dev:http` - Start HTTP development server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run clean` - Clean build directory
- `npm run watch` - Watch mode for development

## ⚙️ How It Works

### HTML to PDF
1. **HTML Processing**: Validates and processes HTML content
2. **Browser Launch**: Launches headless Puppeteer browser
3. **Content Rendering**: Loads HTML content with network idle wait
4. **PDF Generation**: Generates PDF with specified options
5. **File Output**: Saves PDF to specified location

### HTML to DOCX
1. **HTML Processing**: Validates and processes HTML content
2. **Metadata Integration**: Adds document properties (title, author, etc.)
3. **DOCX Generation**: Uses html-docx-js library for conversion
4. **Buffer Handling**: Handles Blob/Buffer conversion for Node.js
5. **File Output**: Saves DOCX to specified location

### Markdown to HTML
1. **Markdown Parsing**: Uses Marked library to parse Markdown
2. **HTML Generation**: Converts to clean HTML with GFM support
3. **Sanitization**: Optional HTML sanitization for security
4. **Styling**: Optional full document generation with CSS

### Markdown to PDF
1. **Two-Step Process**: Markdown → HTML → PDF
2. **Integrated Styling**: Automatic CSS styling for readability
3. **Document Structure**: Full HTML document generation
4. **PDF Optimization**: Optimized for print layouts

### Markdown to DOCX
1. **Three-Step Process**: Markdown → HTML → DOCX
2. **Style Integration**: Automatic CSS styling and document formatting
3. **Document Structure**: Full HTML document with metadata
4. **DOCX Optimization**: Optimized for Microsoft Word compatibility

## 🔒 Security Features

- **HTML Sanitization**: Removes dangerous scripts and content
- **Input Validation**: Comprehensive input validation using Zod
- **File System Safety**: Path validation and directory checks
- **Browser Isolation**: Each conversion runs in isolated browser instance
- **Error Handling**: Graceful error handling with detailed messages

## 🎨 Customization Options

### PDF Options
- **Formats**: A4, A3, A2, A1, A0, Legal, Letter, Tabloid
- **Orientation**: Portrait or Landscape
- **Margins**: Custom margins in cm, mm, or inches
- **Scale**: 0.1x to 2x webpage rendering scale
- **Background**: Option to include/exclude background graphics
- **Headers/Footers**: Custom header and footer templates

### DOCX Options
- **Orientation**: Portrait or Landscape
- **Margins**: Custom margins in twips (1440 twips = 1 inch)
  - Page margins: top, right, bottom, left
  - Additional: header, footer, gutter margins
- **Document Properties**: Title, subject, creator, keywords, description
- **Content Processing**: HTML sanitization and styling options

### Markdown Options
- **GitHub Flavored Markdown**: Full GFM support
- **Line Breaks**: Convert single line breaks to `<br>`
- **Sanitization**: Remove potentially dangerous HTML
- **Custom CSS**: Add custom styles to generated documents

## 🚨 Troubleshooting

### Common Issues

1. **"Puppeteer browser not found"**
   - Run `npm install puppeteer` to download Chrome
   - Or install system Chrome/Chromium

2. **"Directory does not exist" errors**
   - Ensure output directories exist before conversion
   - Use absolute paths for reliability

3. **Large file failures**
   - Increase Node.js memory limit: `--max-old-space-size=4096`
   - Use streaming for very large documents

4. **Claude Desktop not recognizing server**
   - Check config file path and JSON syntax
   - Ensure correct command and args in configuration
   - Restart Claude Desktop after config changes

### Performance Tips

- Use headless mode for better performance (default)
- Set appropriate timeouts for large documents
- Consider batch processing for multiple files
- Use sanitization only when necessary

## 🌍 Supported Formats

### Input Formats
- **HTML**: Full HTML documents or fragments
- **Markdown**: Standard Markdown and GitHub Flavored Markdown
- **URLs**: Any accessible web page
- **Files**: .html, .htm, .md, .markdown files

### Output Formats
- **PDF**: High-quality PDF documents
- **DOCX**: Microsoft Word compatible documents
- **HTML**: Clean, styled HTML documents

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run lint && npm run build`
5. Submit a Pull Request

## 🔗 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [Puppeteer Documentation](https://pptr.dev/)
- [Marked Documentation](https://marked.js.org/)

---

**Ready to convert documents?** 🚀

Configure Claude Desktop and start converting HTML/Markdown to PDF and DOCX!