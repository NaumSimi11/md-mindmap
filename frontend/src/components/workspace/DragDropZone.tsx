/**
 * DragDropZone - Overlay for drag-and-drop file uploads
 * 
 * Supports:
 * - Markdown (.md)
 * - Plain Text (.txt)
 * - Word Documents (.docx) - converted via mammoth
 * - Excel Spreadsheets (.xlsx, .xls) - converted to markdown tables
 * - HTML (.html, .htm) - converted via turndown
 */

import { useState, useEffect } from 'react';
import { Upload, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { 
  convertFileToMarkdown, 
  isFileSupported, 
  getFileExtension,
  SUPPORTED_IMPORT_EXTENSIONS 
} from '@/utils/documentConverter';

export function DragDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { createDocument, refreshDocuments } = useWorkspace();

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      
      // Only show overlay if dragging files
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      let successCount = 0;
      let errorCount = 0;
      let convertedCount = 0;
      let skippedCount = 0;

      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          // Check if file type is supported
          if (!isFileSupported(file.name)) {
            skippedCount++;
            return;
          }

          // Max file size based on type
          const ext = getFileExtension(file.name);
          const maxSize = ['.docx', '.xlsx', '.xls'].includes(ext)
            ? 10 * 1024 * 1024  // 10MB for documents
            : 5 * 1024 * 1024;   // 5MB for text files

          if (file.size > maxSize) {
            toast.error(`File too large: ${file.name}`, {
              description: `Max size: ${maxSize / (1024 * 1024)}MB`
            });
            errorCount++;
            return;
          }

          try {
            // Convert file to markdown
            const needsConversion = ['.docx', '.xlsx', '.xls', '.html', '.htm'].includes(ext);
            
            console.log(`📄 [DragDrop] Processing file: ${file.name} (${ext}, size: ${file.size})`);
            
            const conversionResult = await convertFileToMarkdown(file);
            
            if (!conversionResult.success) {
              console.error(`❌ [DragDrop] Conversion failed for ${file.name}:`, conversionResult.error);
              toast.error(`Failed to convert ${file.name}`, {
                description: conversionResult.error
              });
              errorCount++;
              return;
            }

            const content = conversionResult.content;
            
            // Validate content is not empty
            if (!content || content.trim().length === 0) {
              console.warn(`⚠️ [DragDrop] Empty content after conversion: ${file.name}`);
              toast.warning(`File appears to be empty: ${file.name}`);
              errorCount++;
              return;
            }
            
            console.log(`✅ [DragDrop] Converted ${file.name}: ${content.length} chars`);
            
            // Track converted files
            if (needsConversion) {
              convertedCount++;
            }

            // Extract title from filename (remove extension)
            const title = file.name.replace(/\.(md|txt|docx|xlsx|xls|html|htm)$/i, '');
            
            await createDocument('markdown', title, content);
            successCount++;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            errorCount++;
          }
        });

        await Promise.all(uploadPromises);

        // Small delay then refresh
        await new Promise(resolve => setTimeout(resolve, 50));
        await refreshDocuments();

        if (successCount > 0) {
          const convertedMsg = convertedCount > 0 
            ? ` (${convertedCount} converted to Markdown)` 
            : '';
          toast.success(
            `Imported ${successCount} document${successCount > 1 ? 's' : ''}${convertedMsg}`
          );
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? 's' : ''}`);
        }
        if (skippedCount > 0 && successCount === 0 && errorCount === 0) {
          toast.warning(`Skipped ${skippedCount} unsupported file${skippedCount > 1 ? 's' : ''}`, {
            description: `Supported: ${SUPPORTED_IMPORT_EXTENSIONS.join(', ')}`
          });
        }
      } catch (error) {
        console.error('Drop error:', error);
        toast.error('Failed to import documents');
      } finally {
        setIsUploading(false);
      }
    };

    // Add listeners
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [createDocument, refreshDocuments]);

  if (!isDragging && !isUploading) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Drop Zone */}
      <div className="absolute inset-8 border-4 border-dashed border-primary rounded-2xl flex items-center justify-center animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          
          {isUploading ? (
            <>
              <h2 className="text-2xl font-bold">Importing documents...</h2>
              <p className="text-muted-foreground">Converting and creating documents</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Drop files to import</h2>
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">.md .txt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileType className="h-4 w-4" />
                  <span className="text-sm">.docx</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm">.xlsx</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Word & Excel files are automatically converted to Markdown
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
