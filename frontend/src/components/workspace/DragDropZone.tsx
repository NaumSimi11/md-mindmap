/**
 * DragDropZone - Overlay for drag-and-drop file uploads
 */

import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

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

      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          // Only accept .md and .txt files
          if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
            return;
          }

          // Max 5MB per file
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`File too large: ${file.name} (max 5MB)`);
            errorCount++;
            return;
          }

          try {
            const content = await file.text();
            const title = file.name.replace(/\.(md|txt)$/, '');
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
          toast.success(
            `Imported ${successCount} document${successCount > 1 ? 's' : ''}`
          );
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? 's' : ''}`);
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
              <p className="text-muted-foreground">Please wait</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Drop files to import</h2>
              <p className="text-muted-foreground">Supports .md and .txt files</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

