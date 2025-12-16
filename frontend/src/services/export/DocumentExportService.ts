/**
 * Document Export Service
 * 
 * Handles exporting documents to local file system.
 * Per local_first.md section 5.2: "Export to Disk" option.
 * 
 * Platform Support:
 * - Tauri (Desktop): User chooses folder via file picker
 * - Web: Downloads to Downloads/mdreader folder
 */

import { isDesktop } from '@/utils/platform';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';

export interface ExportOptions {
  format?: 'markdown' | 'json' | 'yjs-binary';
  includeMetadata?: boolean;
}

export class DocumentExportService {
  /**
   * Export document to local file system
   * 
   * @param documentId - Document ID to export
   * @param title - Document title (used for filename)
   * @param options - Export options
   * @param editorContent - Optional: HTML content from editor (preferred over Yjs extraction)
   */
  async exportToLocalMachine(
    documentId: string,
    title: string,
    options: ExportOptions = {},
    editorContent?: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const { format = 'markdown', includeMetadata = false } = options;

      let content = '';

      // If editor content is provided, use it directly (most reliable)
      if (editorContent) {
        content = editorContent;
      } else {
        // Fallback: Try to get from Yjs
        try {
          const yjsDoc = yjsDocumentManager.getDocument(documentId, {
            enableWebSocket: false,
            isAuthenticated: false,
          });

          // TipTap uses XmlFragment for 'content', not Y.Text
          // Try to get as XmlFragment first
          try {
            const xmlFragment = yjsDoc.ydoc.getXmlFragment('content');
            content = xmlFragment.toString();
          } catch (xmlError) {
            // If XmlFragment fails, try Y.Text (for legacy documents)
            try {
              const ytext = yjsDoc.ydoc.getText('content');
              content = ytext.toString();
            } catch (textError) {
              console.warn('⚠️ Could not extract content from Yjs:', { xmlError, textError });
              throw new Error('Could not extract document content from Yjs');
            }
          }
        } catch (yjsError) {
          console.error('❌ Failed to get content from Yjs:', yjsError);
          throw new Error('Document content not available');
        }
      }

      // Generate filename (sanitize title)
      const sanitizedTitle = this.sanitizeFileName(title);
      const extension = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'yjs';
      const filename = `${sanitizedTitle}.${extension}`;

      if (isDesktop()) {
        // Tauri: Use file picker to choose save location
        return await this.exportTauri(filename, content, format, includeMetadata);
      } else {
        // Web: Download to Downloads/mdreader folder
        return await this.exportWeb(filename, content, format, includeMetadata);
      }
    } catch (error: any) {
      console.error('❌ Failed to export document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Export for Tauri (Desktop) - User chooses folder
   */
  private async exportTauri(
    filename: string,
    content: string,
    format: string,
    includeMetadata: boolean
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      // Open file picker to choose save location
      const filePath = await save({
        defaultPath: filename,
        filters: [
          {
            name: format === 'markdown' ? 'Markdown' : format === 'json' ? 'JSON' : 'Yjs Binary',
            extensions: [format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'yjs'],
          },
        ],
      });

      if (!filePath) {
        return { success: false, error: 'User cancelled file save' };
      }

      // Prepare content based on format
      let fileContent = content;
      if (format === 'json' && includeMetadata) {
        fileContent = JSON.stringify({
          content,
          exportedAt: new Date().toISOString(),
          format: 'markdown',
        }, null, 2);
      }

      // Write file
      await writeTextFile(filePath, fileContent);

      console.log('✅ Document exported to:', filePath);
      return {
        success: true,
        path: filePath,
      };
    } catch (error: any) {
      console.error('❌ Tauri export failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to save file',
      };
    }
  }

  /**
   * Export for Web - Use File System Access API if available, otherwise download
   */
  private async exportWeb(
    filename: string,
    content: string,
    format: string,
    includeMetadata: boolean
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Prepare content based on format
      // Note: content is already markdown (from htmlToMarkdown conversion)
      let fileContent = content;
      let mimeType = 'text/markdown';
      let blob: Blob;

      if (format === 'json' && includeMetadata) {
        fileContent = JSON.stringify({
          content, // Markdown content
          exportedAt: new Date().toISOString(),
          format: 'markdown',
        }, null, 2);
        mimeType = 'application/json';
      } else if (format === 'json') {
        fileContent = JSON.stringify({ content }, null, 2); // Markdown content
        mimeType = 'application/json';
      }

      blob = new Blob([fileContent], { type: mimeType });

      // Try File System Access API first (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        try {
          // @ts-ignore - File System Access API
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: format === 'markdown' ? 'Markdown File' : format === 'json' ? 'JSON File' : 'Yjs Binary',
                accept: {
                  [mimeType]: [`.${format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'yjs'}`],
                },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          console.log('✅ Document saved via File System Access API:', fileHandle.name);
          return {
            success: true,
            path: fileHandle.name,
          };
        } catch (error: any) {
          // User cancelled or API failed - fall back to download
          if (error.name === 'AbortError') {
            return { success: false, error: 'User cancelled file save' };
          }
          console.warn('⚠️ File System Access API failed, falling back to download:', error);
        }
      }

      // Fallback: Download to default Downloads folder
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Document downloaded:', filename);
      return {
        success: true,
        path: `Downloads/${filename}`, // Approximate path (browser-dependent)
      };
    } catch (error: any) {
      console.error('❌ Web export failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to save file',
      };
    }
  }

  /**
   * Sanitize filename (remove invalid characters)
   */
  private sanitizeFileName(title: string): string {
    // Remove invalid characters for filenames
    return title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }
}

// Export singleton
export const documentExportService = new DocumentExportService();

