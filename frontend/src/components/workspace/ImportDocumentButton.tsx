/**
 * ImportDocumentButton - Button and drag-drop for importing documents
 * 
 * Supports:
 * - Markdown (.md)
 * - Plain Text (.txt)
 * - Word Documents (.docx) - converted via mammoth
 * - Excel Spreadsheets (.xlsx, .xls) - converted to markdown tables
 * - HTML (.html, .htm) - converted via turndown
 * 
 * 🔴 CRITICAL POINT #10: Duplicate Detection Flow
 * - MUST check for duplicates before creating document
 * - MUST compare content hash (not just title)
 * - MUST handle both guest and authenticated modes
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Info } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { guestVersionManager } from '@/services/workspace-legacy/GuestVersionManager';
import { ImportInfoDialog } from './ImportInfoDialog';
import { toast } from 'sonner';
import { 
  convertFileToMarkdown, 
  isFileSupported, 
  getFileExtension,
  getFileTypeDescription,
  SUPPORTED_IMPORT_EXTENSIONS 
} from '@/utils/documentConverter';
import { yjsHydrationService } from '@/services/yjs/YjsHydrationService';
import { useNavigate } from 'react-router-dom';

interface ImportDocumentButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  'data-testid'?: string;
  compact?: boolean;
}

export function ImportDocumentButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '',
  'data-testid': testId,
  compact = false,
}: ImportDocumentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createDocument, updateDocument, documents, refreshDocuments } = useWorkspace();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Show info dialog on first import (check localStorage)
  const hasSeenInfo = localStorage.getItem('mdreader:import-info-seen') === 'true';

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;
    let convertedCount = 0;
    let firstImportedDocId: string | null = null;

    try {
      // Process files in parallel
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!isFileSupported(file.name)) {
          const ext = getFileExtension(file.name);
          toast.error(`Unsupported file type: ${ext || 'unknown'}`, {
            description: `Supported: ${SUPPORTED_IMPORT_EXTENSIONS.join(', ')}`
          });
          errorCount++;
          return;
        }

        // Validate file size (max 10MB for Word/Excel, 5MB for text)
        const maxSize = file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
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
          const ext = getFileExtension(file.name);
          const needsConversion = ['.docx', '.xlsx', '.xls', '.html', '.htm'].includes(ext);
          
          console.log(`📄 [Import] Processing file: ${file.name} (${ext}, size: ${file.size})`);
          
          const conversionResult = await convertFileToMarkdown(file);
          
          if (!conversionResult.success) {
            console.error(`❌ [Import] Conversion failed for ${file.name}:`, conversionResult.error);
            toast.error(`Failed to convert ${file.name}`, {
              description: conversionResult.error
            });
            errorCount++;
            return;
          }

          const content = conversionResult.content;
          
          // Validate content is not empty
          if (!content || content.trim().length === 0) {
            console.warn(`⚠️ [Import] Empty content after conversion: ${file.name}`);
            toast.warning(`File appears to be empty: ${file.name}`);
            errorCount++;
            return;
          }
          
          console.log(`✅ [Import] Converted ${file.name}: ${content.length} chars`);
          
          // Show conversion warnings if any
          if (conversionResult.warnings && conversionResult.warnings.length > 0) {
            console.warn(`Conversion warnings for ${file.name}:`, conversionResult.warnings);
          }

          // Track converted files
          if (needsConversion) {
            convertedCount++;
          }
          
          // Extract title from filename (remove extension)
          const title = file.name.replace(/\.(md|txt|docx|xlsx|xls|html|htm)$/i, '');

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
              await updateDocument(existingDoc.id, { content } as any);
              toast.success(`Updated "${title}" (new version created)`, {
                duration: 3000
              });
              successCount++;
              return;
            }
          }

          // No duplicate - create new document
          console.log(`✨ [Import] Creating new document: ${title} (content: ${content.length} chars)`);
          const newDoc = await createDocument('markdown', title, content);
          console.log(`✅ [Import] Document created: ${newDoc.id}, content length in DB: ${newDoc.content?.length || 0}`);
          
          // 🔥 CRITICAL: Hydrate Yjs document IMMEDIATELY after creation
          // This ensures content is in Yjs BEFORE editor loads
          try {
            console.log(`🔄 [Import] Hydrating document: ${newDoc.id}`);
            await yjsHydrationService.hydrateDocument(
              newDoc.id,
              content,
              undefined, // No binary state for new imports
              isAuthenticated
            );
            console.log(`✅ [Import] Document hydrated: ${newDoc.id}`);
          } catch (hydrationError) {
            console.error(`⚠️ [Import] Hydration failed (non-critical):`, hydrationError);
            // Non-critical - editor will retry hydration when loading
          }
          
          // Track first imported doc for auto-navigation
          if (!firstImportedDocId) {
            firstImportedDocId = newDoc.id;
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          errorCount++;
        }
      });

      await Promise.all(uploadPromises);

      // Small delay then refresh
      await new Promise(resolve => setTimeout(resolve, 100));
      await refreshDocuments();

      // 🔥 AUTO-NAVIGATE: Open first imported document in editor
      if (firstImportedDocId && successCount > 0) {
        console.log(`🚀 [Import] Auto-navigating to: ${firstImportedDocId}`);
        navigate(`/workspace/doc/${firstImportedDocId}/edit`);
      }

      // Show results
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

  // Build accept string for file input
  const acceptString = SUPPORTED_IMPORT_EXTENSIONS.join(',');

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
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
              {!compact && 'Importing...'}
            </>
          ) : (
            <>
              <Upload className={`h-4 w-4 ${compact ? '' : 'mr-2'}`} />
              {!compact && 'Import'}
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
