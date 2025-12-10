/**
 * ImportDocumentButton - Button and drag-drop for importing .md/.txt files
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

interface ImportDocumentButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ImportDocumentButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: ImportDocumentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createDocument, refreshDocuments } = useWorkspace();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process files in parallel
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
          console.warn(`Skipping unsupported file: ${file.name}`);
          errorCount++;
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File too large: ${file.name} (max 5MB)`);
          errorCount++;
          return;
        }

        try {
          // Read file content
          const content = await file.text();
          
          // Extract title from filename (remove extension)
          const title = file.name.replace(/\.(md|txt)$/, '');

          // Create document
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

      // Show results
      if (successCount > 0) {
        toast.success(
          `Imported ${successCount} document${successCount > 1 ? 's' : ''}`
        );
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to import documents');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isUploading}
      />
      
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Import .md
          </>
        )}
      </Button>
    </>
  );
}

