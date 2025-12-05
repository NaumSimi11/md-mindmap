/**
 * ContextDocuments - Manage reference documents for current document
 * 
 * Features:
 * - Add folders to organize context
 * - Add files (PDFs, Word docs, other markdown, etc.)
 * - Use as AI context later
 * - Organize by category (Marketing, Research, etc.)
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';
import {
  Plus,
  Folder,
  FileText,
  File,
  MoreVertical,
  Trash2,
  Upload,
  FolderPlus,
  Eye,
  Copy,
  Sparkles,
  ArrowDownToLine,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { usePlatform } from '@/contexts/PlatformContext';
import { toast } from 'sonner';
import { FilePreviewModal } from './FilePreviewModal';

interface ContextFolder {
  id: string;
  name: string;
  icon: string;
  files: ContextFile[];
}

interface ContextFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'md' | 'xlsx' | 'txt' | 'other';
  size?: string;
  addedAt: Date;
  content?: string; // Cached content for quick access (markdown/text for AI)
  rawData?: any; // Structured data for Excel/Word (for preview/selection)
  path?: string; // File path for desktop mode
}

interface ContextDocumentsProps {
  folders?: ContextFolder[];
  onFoldersChange?: (folders: ContextFolder[]) => void;
  onInsertContent?: (content: string) => void;
}

export function ContextDocuments({
  folders: propFolders = [],
  onFoldersChange,
  onInsertContent,
}: ContextDocumentsProps = {}) {
  const { isDesktop } = usePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadFolder, setCurrentUploadFolder] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: ContextFile, folder: ContextFolder } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingProgress, setParsingProgress] = useState('');

  // Use props if provided, otherwise use default state
  const [localFolders, setLocalFolders] = useState<ContextFolder[]>([]);

  const folders = onFoldersChange ? propFolders : localFolders;
  const setFolders = onFoldersChange || setLocalFolders;

  const handleAddFolder = () => {
    const name = prompt('Folder name:');
    if (name) {
      const newFolder: ContextFolder = {
        id: Date.now().toString(),
        name,
        icon: '📁',
        files: [],
      };
      setFolders([...folders, newFolder]);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Delete this folder and all its files?')) {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  const handleAddFile = async (folderId: string) => {
    setCurrentUploadFolder(folderId);

    if (isDesktop) {
      // Desktop: Use Tauri file picker
      try {
        // @ts-ignore - Tauri types
        const { open } = await import('@tauri-apps/plugin-dialog');

        const selected = await open({
          multiple: true,
          filters: [{
            name: 'Documents',
            extensions: ['pdf', 'doc', 'docx', 'md', 'txt', 'xlsx', 'xls', 'pptx', 'png', 'jpg', 'jpeg']
          }]
        });

        if (selected) {
          const files = Array.isArray(selected) ? selected : [selected];
          for (const filePath of files) {
            await addFileToFolder(folderId, filePath);
          }
          toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        console.error('File selection error:', error);
        toast.error('Failed to select files');
      }
    } else {
      // Web: Use HTML file input
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUploadFolder) return;

    const newFiles: ContextFile[] = [];
    const toastId = toast.loading(`Processing ${files.length} files...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const processedFile = await processWebFile(file, currentUploadFolder);
        newFiles.push(processedFile);
      } catch (error) {
        console.error(`Failed to process ${file.name}`, error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setFolders(folders.map(folder => {
        if (folder.id === currentUploadFolder) {
          return {
            ...folder,
            files: [...folder.files, ...newFiles],
          };
        }
        return folder;
      }));
      toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }

    // Reset input
    event.target.value = '';
  };

  const addFileToFolder = async (folderId: string, filePath: string) => {
    // Desktop: Store file path reference
    const fileName = filePath.split('/').pop() || 'unknown';
    const extension = fileName.split('.').pop()?.toLowerCase() || 'other';

    const newFile: ContextFile = {
      id: `${folderId}-${Date.now()}-${Math.random()}`,
      name: fileName,
      type: getFileType(extension),
      size: 'Unknown', // On desktop, we just reference the file
      addedAt: new Date(),
    };

    setFolders(folders.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          files: [...folder.files, newFile],
        };
      }
      return folder;
    }));
  };

  const processWebFile = async (file: File, folderId: string): Promise<ContextFile> => {
    // Web: Store file metadata and read content for text files
    const extension = file.name.split('.').pop()?.toLowerCase() || 'other';
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileType = getFileType(extension);

    // Read file content based on type
    let content: string | undefined;
    let rawData: any | undefined;

    try {
      if (fileType === 'txt' || fileType === 'md') {
        // Parse text files
        content = await readFileAsText(file);
      } else if (fileType === 'xlsx') {
        // Parse Excel files
        setIsParsingFile(true);
        setParsingProgress(`Parsing ${file.name}...`);

        const parsed = await parseExcelFile(file);
        content = parsed.content; // Markdown for AI
        rawData = parsed.rawData; // Structured data for preview

        setIsParsingFile(false);
        setParsingProgress('');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }

    return {
      id: `${folderId}-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: fileType,
      size: `${sizeInMB} MB`,
      addedAt: new Date(),
      content, // Markdown/text for AI
      rawData, // Structured data for preview/selection
    };
  };

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Helper to parse Excel files
  const parseExcelFile = (file: File): Promise<{ content: string; rawData: any }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          setParsingProgress('Reading file...');
          const data = e.target?.result;

          setParsingProgress('Parsing Excel...');
          const workbook = XLSX.read(data, { type: 'binary' });

          // Parse all sheets
          const sheets = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            return {
              name: sheetName,
              data: jsonData,
              rowCount: jsonData.length,
            };
          });

          setParsingProgress('Converting to markdown...');
          // Convert first sheet to markdown for AI context
          let markdownContent = '';
          if (sheets.length > 0) {
            const firstSheet = sheets[0];
            markdownContent = `# ${file.name}\n\n## Sheet: ${firstSheet.name}\n\n`;

            // Convert to markdown table (limit to reasonable size)
            const dataRows = firstSheet.data as any[][];
            if (dataRows.length > 0) {
              const maxRows = Math.min(100, dataRows.length); // Limit for markdown
              const headers = dataRows[0] as string[];

              // Create markdown table
              markdownContent += '| ' + headers.join(' | ') + ' |\n';
              markdownContent += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

              for (let i = 1; i < maxRows; i++) {
                const row = dataRows[i] as any[];
                markdownContent += '| ' + row.join(' | ') + ' |\n';
              }

              if (dataRows.length > maxRows) {
                markdownContent += `\n_... and ${dataRows.length - maxRows} more rows_\n`;
              }
            }
          }

          setParsingProgress('Done!');
          resolve({
            content: markdownContent,
            rawData: {
              sheets,
              fileName: file.name,
              parsedAt: new Date().toISOString(),
            }
          });
        } catch (error) {
          console.error('Excel parsing error:', error);
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const getFileType = (extension: string): ContextFile['type'] => {
    const typeMap: Record<string, ContextFile['type']> = {
      'pdf': 'pdf',
      'doc': 'docx',
      'docx': 'docx',
      'md': 'md',
      'markdown': 'md',
      'txt': 'txt',
      'xls': 'xlsx',
      'xlsx': 'xlsx',
    };
    return typeMap[extension] || 'other';
  };

  const handleDeleteFile = (folderId: string, fileId: string) => {
    setFolders(folders.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          files: folder.files.filter(f => f.id !== fileId),
        };
      }
      return folder;
    }));
  };

  const handlePreviewFile = (file: ContextFile, folder: ContextFolder) => {
    setPreviewFile({ file, folder });
  };

  const handleInsertFile = (file: ContextFile) => {
    if (file.content) {
      // Copy to clipboard
      navigator.clipboard.writeText(file.content);
      toast.success(`Content copied!  Paste (Cmd+V) to insert`);
    } else if (file.type === 'md' || file.type === 'txt') {
      toast.info('Loading file content...');
      // TODO: Load file content
    } else {
      toast.error('Can only insert text/markdown files directly');
    }
  };

  const handleCopyPath = (file: ContextFile) => {
    if (file.path) {
      navigator.clipboard.writeText(file.path);
      toast.success('File path copied!');
    } else {
      navigator.clipboard.writeText(file.name);
      toast.success('File name copied!');
    }
  };

  const handleUseAsAIContext = (file: ContextFile) => {
    // TODO: Integrate with AI modal to use this file as context
    toast.success(`${file.name} will be used as AI context`, {
      description: 'Open AI Assistant to use this reference',
    });
  };

  const getFileIcon = (type: ContextFile['type']) => {
    switch (type) {
      case 'pdf':
        return '📕';
      case 'docx':
        return '📘';
      case 'md':
        return '📝';
      case 'xlsx':
        return '📊';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input for web mode */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.md,.txt,.xlsx,.xls,.pptx,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Info Section */}
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Context Documents</strong> help you organize reference materials for this document.
          {isDesktop ? ' Click "Add File" to browse files.' : ' Upload files to reference later.'}
        </p>
      </div>

      {/* Folders List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3" style={{ width: '100%', maxWidth: '288px' }}>
          {folders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No Context Folders</p>
              <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                Create folders to organize your reference materials
              </p>
              <Button size="sm" onClick={handleAddFolder}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </div>
          ) : (
            folders.map(folder => (
              <div key={folder.id} className="border border-border rounded-lg overflow-hidden" style={{ width: '100%', maxWidth: '264px' }}>
                {/* Folder Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border gap-2 max-w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    <span className="text-lg flex-shrink-0">{folder.icon}</span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {folder.files.length} file{folder.files.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  {/* Folder Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddFile(folder.id)}
                      title="Add File"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAddFile(folder.id)}>
                          <Upload className="h-3 w-3 mr-2" />
                          Add File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Files in Folder */}
                <div className="divide-y divide-border max-w-full overflow-hidden">
                  {folder.files.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground mb-2">No files yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddFile(folder.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add File
                      </Button>
                    </div>
                  ) : (
                    folder.files.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 group"
                        style={{ maxWidth: '100%', overflow: 'hidden' }}
                      >
                        <span className="text-base flex-shrink-0">{getFileIcon(file.type)}</span>
                        <div style={{ flex: '1', minWidth: '0', overflow: 'hidden' }}>
                          <button
                            className="w-full text-left"
                            onClick={() => handlePreviewFile(file, folder)}
                            title={file.name}
                            style={{ display: 'block' }}
                          >
                            <p 
                              className="text-xs font-medium hover:text-primary"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                wordBreak: 'break-all'
                              }}
                            >
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </button>
                        </div>

                        {/* File Actions Dropdown - Always visible */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewFile(file, folder)}>
                              <Eye className="h-3 w-3 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            {(file.type === 'md' || file.type === 'txt') && (
                              <DropdownMenuItem onClick={() => handleInsertFile(file)}>
                                <ArrowDownToLine className="h-3 w-3 mr-2" />
                                Copy Content
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleCopyPath(file)}>
                              <Copy className="h-3 w-3 mr-2" />
                              Copy Path
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUseAsAIContext(file)}>
                              <Sparkles className="h-3 w-3 mr-2" />
                              Use as AI Context
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteFile(folder.id, file.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Folder Button */}
      {folders.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddFolder}
            className="w-full"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Context Folder
          </Button>
        </div>
      )}

      {/* File Preview Modal - New Universal Modal */}
      {previewFile && (
        <FilePreviewModal
          open={!!previewFile}
          onOpenChange={() => setPreviewFile(null)}
          file={previewFile.file}
          onInsert={(content) => {
            if (onInsertContent) {
              // Direct insertion into editor
              onInsertContent(content);
            } else {
              // Fallback: Copy to clipboard
              navigator.clipboard.writeText(content);
              toast.success('Content copied! Press Cmd+V to paste');
            }
          }}
          onUseAsContext={() => handleUseAsAIContext(previewFile.file)}
        />
      )}
    </div>
  );
}
