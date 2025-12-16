/**
 * ImportDocumentButton - Button and drag-drop for importing .md/.txt files
 * 
 * 🔴 CRITICAL POINT #10: Duplicate Detection Flow
 * - MUST check for duplicates before creating document
 * - MUST compare content hash (not just title)
 * - MUST handle both guest and authenticated modes
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, Info } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { guestVersionManager } from '@/services/workspace-legacy/GuestVersionManager';
import { ImportInfoDialog } from './ImportInfoDialog';
import { toast } from 'sonner';

interface ImportDocumentButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  'data-testid'?: string;
}

export function ImportDocumentButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '',
  'data-testid': testId
}: ImportDocumentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createDocument, updateDocument, documents, refreshDocuments } = useWorkspace();
  const { isAuthenticated } = useAuth();

  // Show info dialog on first import (check localStorage)
  const hasSeenInfo = localStorage.getItem('mdreader:import-info-seen') === 'true';

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

          // 🔴 CRITICAL POINT #11: Duplicate Detection
          // Check if document with same title exists
          const existingDoc = documents.find(d => d.title === title);

          if (existingDoc) {
            console.log(`📋 Found existing document: ${title} (${existingDoc.id})`);
            
            // GUEST MODE: Use local versioning
            if (!isAuthenticated) {
              // Check if content is identical
              const isIdentical = await guestVersionManager.contentMatchesCurrentVersion(
                existingDoc.id,
                content
              );
              
              if (isIdentical) {
                console.log(`✅ Content identical, skipping: ${title}`);
                toast.info(`"${title}" is already up to date`, {
                  duration: 2000
                });
                return; // Skip this file
              }
              
              // Content changed - create new version
              console.log(`🔄 Content changed, creating new version: ${title}`);
              const newVersion = await guestVersionManager.createVersion(
                existingDoc.id,
                content,
                'Imported from file'
              );
              
              if (newVersion) {
                // Update document content (triggers Yjs sync)
                // ⚠️ BREAKABLE POINT: updateDocument might not accept content
                // Current WorkspaceContext.updateDocument filters out content for backend
                // For guest mode, we need to update the Yjs doc directly
                // TODO: Verify this works correctly
                await updateDocument(existingDoc.id, { 
                  updatedAt: new Date()
                } as any);
                
                toast.success(`Created version ${newVersion} of "${title}"`, {
                  duration: 3000
                });
                successCount++;
              } else {
                console.error(`❌ Failed to create version for: ${title}`);
                errorCount++;
              }
              return;
            }
            
            // AUTHENTICATED MODE: Use backend versioning
            else {
              console.log(`🔐 Authenticated mode: updating via backend: ${title}`);
              // Backend automatically creates version on content update
              // ⚠️ BREAKABLE POINT: Backend must have version creation logic
              await updateDocument(existingDoc.id, { content } as any);
              toast.success(`Updated "${title}" (new version created)`, {
                duration: 3000
              });
              successCount++;
              return;
            }
          }

          // No duplicate - create new document
          console.log(`✨ Creating new document: ${title}`);
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
    // Show info dialog on first import
    if (!hasSeenInfo && !isAuthenticated) {
      setShowInfoDialog(true);
      localStorage.setItem('mdreader:import-info-seen', 'true');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDialog(true);
  };

  const handleInfoDialogClose = () => {
    setShowInfoDialog(false);
    // After closing info, open file picker
    if (!hasSeenInfo) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }
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
      
      <div className="flex items-center gap-1">
        <Button
          variant={variant}
          size={size}
          onClick={handleButtonClick}
          disabled={isUploading}
          className={className}
          data-testid={testId}
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
        
        {/* Info button - only show in guest mode (web mode) */}
        {!isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleInfoClick}
            className="h-8 w-8 p-0"
            title="How does import work?"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Info Dialog */}
      <ImportInfoDialog 
        open={showInfoDialog} 
        onClose={handleInfoDialogClose}
      />
    </>
  );
}

