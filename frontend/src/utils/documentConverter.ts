/**
 * Document Converter Utilities
 * 
 * Converts various document formats to Markdown:
 * - Word (.docx) using mammoth
 * - Excel (.xlsx) using xlsx (converts to markdown tables)
 * - HTML using turndown
 */

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { turndownService } from './markdownConversion';

export interface ConversionResult {
  success: boolean;
  content: string;
  error?: string;
  warnings?: string[];
}

/**
 * Get supported file extensions for import
 */
export const SUPPORTED_IMPORT_EXTENSIONS = ['.md', '.txt', '.docx', '.xlsx', '.xls', '.html', '.htm'];

/**
 * Check if a file is supported for import
 */
export function isFileSupported(filename: string): boolean {
  const ext = filename.toLowerCase();
  return SUPPORTED_IMPORT_EXTENSIONS.some(supported => ext.endsWith(supported));
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
}

/**
 * Convert Word document (.docx) to Markdown
 */
export async function convertDocxToMarkdown(file: File): Promise<ConversionResult> {
  try {
    console.log(`📝 [Converter] Starting DOCX conversion: ${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📝 [Converter] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
    
    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    console.log(`📝 [Converter] Mammoth HTML output: ${result.value?.length || 0} chars`);
    
    if (!result.value || result.value.trim().length === 0) {
      console.warn(`⚠️ [Converter] DOCX appears empty: ${file.name}`);
      return {
        success: false,
        content: '',
        error: 'Document appears to be empty',
      };
    }

    // Convert HTML to Markdown using turndown
    const markdown = turndownService.turndown(result.value);
    console.log(`📝 [Converter] Turndown markdown output: ${markdown.length} chars`);
    
    // Collect warnings
    const warnings = result.messages
      .filter(msg => msg.type === 'warning')
      .map(msg => msg.message);
    
    if (warnings.length > 0) {
      console.log(`⚠️ [Converter] Warnings:`, warnings);
    }

    return {
      success: true,
      content: markdown,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('❌ [Converter] DOCX conversion error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to convert Word document',
    };
  }
}

/**
 * Convert Excel spreadsheet (.xlsx, .xls) to Markdown tables
 */
export async function convertExcelToMarkdown(file: File): Promise<ConversionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        content: '',
        error: 'Spreadsheet has no sheets',
      };
    }

    const markdownParts: string[] = [];
    const warnings: string[] = [];

    // Convert each sheet to a markdown table
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get data as 2D array
      const data: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' 
      });
      
      if (data.length === 0) {
        warnings.push(`Sheet "${sheetName}" is empty`);
        continue;
      }

      // Add sheet title if multiple sheets
      if (workbook.SheetNames.length > 1) {
        markdownParts.push(`## ${sheetName}\n`);
      }

      // Build markdown table
      const tableRows: string[] = [];
      
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        // Convert all cells to strings, escape pipes
        const cells = row.map(cell => 
          String(cell ?? '').replace(/\|/g, '\\|').trim()
        );
        
        tableRows.push(`| ${cells.join(' | ')} |`);
        
        // Add header separator after first row
        if (rowIndex === 0) {
          const separator = cells.map(() => '---').join(' | ');
          tableRows.push(`| ${separator} |`);
        }
      }

      markdownParts.push(tableRows.join('\n'));
      markdownParts.push(''); // Empty line after table
    }

    const markdown = markdownParts.join('\n');
    
    if (markdown.trim().length === 0) {
      return {
        success: false,
        content: '',
        error: 'No data found in spreadsheet',
      };
    }

    return {
      success: true,
      content: markdown,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Excel conversion error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to convert Excel spreadsheet',
    };
  }
}

/**
 * Convert HTML to Markdown
 */
export function convertHtmlToMarkdown(html: string): ConversionResult {
  try {
    if (!html || html.trim().length === 0) {
      return {
        success: false,
        content: '',
        error: 'HTML content is empty',
      };
    }

    const markdown = turndownService.turndown(html);
    
    return {
      success: true,
      content: markdown,
    };
  } catch (error) {
    console.error('HTML conversion error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to convert HTML',
    };
  }
}

/**
 * Convert any supported file to Markdown
 */
export async function convertFileToMarkdown(file: File): Promise<ConversionResult> {
  const extension = getFileExtension(file.name);
  console.log(`📄 [Converter] convertFileToMarkdown called for: ${file.name} (ext: ${extension})`);
  
  switch (extension) {
    case '.docx':
      return convertDocxToMarkdown(file);
    
    case '.xlsx':
    case '.xls':
      return convertExcelToMarkdown(file);
    
    case '.html':
    case '.htm':
      const htmlContent = await file.text();
      console.log(`📄 [Converter] HTML file read: ${htmlContent.length} chars`);
      return convertHtmlToMarkdown(htmlContent);
    
    case '.md':
    case '.txt':
      // Plain text files - read directly
      const textContent = await file.text();
      console.log(`📄 [Converter] Text file read: ${textContent.length} chars`);
      return {
        success: true,
        content: textContent,
      };
    
    default:
      console.warn(`⚠️ [Converter] Unsupported extension: ${extension}`);
      return {
        success: false,
        content: '',
        error: `Unsupported file type: ${extension}`,
      };
  }
}

/**
 * Get human-readable file type description
 */
export function getFileTypeDescription(extension: string): string {
  const descriptions: Record<string, string> = {
    '.docx': 'Word Document',
    '.xlsx': 'Excel Spreadsheet',
    '.xls': 'Excel Spreadsheet (Legacy)',
    '.md': 'Markdown',
    '.txt': 'Plain Text',
    '.html': 'HTML Document',
    '.htm': 'HTML Document',
  };
  
  return descriptions[extension.toLowerCase()] || 'Unknown';
}

