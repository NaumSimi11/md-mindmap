/**
 * FilePreviewModal - Universal preview for context files
 * Supports Excel, Word, CSV, Text, Markdown, PDF with row selection and insert
 */

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  FileCheck,
  Copy,
  Sparkles,
  ArrowDownToLine,
  Search,
  X,
} from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
    type: 'pdf' | 'docx' | 'md' | 'xlsx' | 'txt' | 'other';
    content?: string;
    rawData?: {
      sheets: Array<{
        name: string;
        data: any[][];
        rowCount: number;
      }>;
      fileName: string;
      parsedAt: string;
    };
  };
  onInsert?: (content: string) => void;
  onUseAsContext?: () => void;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
  onInsert,
  onUseAsContext,
}: FilePreviewModalProps) {
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [formatType, setFormatType] = useState<'markdown' | 'original'>('markdown');
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number; end: number } | null>(null);

  // Check if we have Excel data
  const hasExcelData = file.type === 'xlsx' && file.rawData?.sheets;
  const currentSheet = hasExcelData ? file.rawData?.sheets[selectedSheet] : null;

  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleSelectAll = () => {
    if (!currentSheet) return;
    
    if (selectedRows.size === currentSheet.data.length - 1) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all (skip header row 0)
      const allRows = new Set<number>();
      for (let i = 1; i < currentSheet.data.length; i++) {
        allRows.add(i);
      }
      setSelectedRows(allRows);
    }
  };

  const handleInsertFullText = () => {
    if (!file.content) {
      toast.error('No content to insert');
      return;
    }
    
    if (onInsert) {
      onInsert(file.content);
      toast.success(`${file.name} inserted into document 🔥`);
      // Auto-close dialog after successful insertion
      onOpenChange(false);
    }
  };

  const handleInsertSelectedText = () => {
    if (!file.content) {
      toast.error('No content to insert');
      return;
    }

    if (!selectedTextRange) {
      toast.error('No text selected');
      return;
    }

    const selectedText = file.content.substring(selectedTextRange.start, selectedTextRange.end);
    
    if (onInsert) {
      onInsert(selectedText);
      const lines = selectedText.split('\n').length;
      toast.success(`Inserted ${lines} line${lines > 1 ? 's' : ''} 🔥`);
      // Auto-close dialog after successful insertion
      onOpenChange(false);
    }
  };

  const handleTextSelection = (e: React.SyntheticEvent<HTMLPreElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const preNode = e.currentTarget;
      const preText = preNode.textContent || '';
      
      // Calculate character positions in the full text
      const beforeRange = range.cloneRange();
      beforeRange.selectNodeContents(preNode);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const start = beforeRange.toString().length;
      const end = start + selection.toString().length;
      
      setSelectedTextRange({ start, end });
    } else {
      setSelectedTextRange(null);
    }
  };

  // PDF rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Render PDF preview using PDF.js
  const renderPDFContent = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            📕 <strong>PDF Preview</strong> {totalPages > 0 && `- Page ${currentPage} of ${totalPages}`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-6 px-2 text-xs"
              >
                ← Prev
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-6 px-2 text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </div>

        {pdfLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        )}

        {pdfError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-6xl">📕</div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-red-600 dark:text-red-400 text-center max-w-md">
              {pdfError}
            </p>
            {file.path && (
              <Button
                onClick={() => {
                  if (window.electron?.openExternal) {
                    window.electron.openExternal(file.path!);
                  } else {
                    toast.info('PDF opening not supported in web browser');
                  }
                }}
                variant="outline"
                size="sm"
              >
                Open in PDF Viewer
              </Button>
            )}
          </div>
        )}

        {!pdfLoading && !pdfError && (
          <ScrollArea className="flex-1">
            <div className="p-4 flex justify-center">
              <canvas ref={canvasRef} className="border border-border shadow-lg" />
            </div>
          </ScrollArea>
        )}

        {file.content && (
          <div className="border-t border-border p-2">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View extracted text
              </summary>
              <pre className="mt-2 p-2 bg-muted/30 rounded text-xs max-h-40 overflow-auto">
                {file.content.substring(0, 500)}...
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  // Load and render PDF when file path is available
  useEffect(() => {
    if (file.type !== 'pdf' || !file.path || !open) return;

    const loadPDF = async () => {
      setPdfLoading(true);
      setPdfError(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Load PDF
        const loadingTask = pdfjsLib.getDocument(file.path);
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        
        // Render first page
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        setPdfLoading(false);
      } catch (error: any) {
        console.error('PDF loading error:', error);
        setPdfError(`Failed to load PDF: ${error.message}`);
        setPdfLoading(false);
      }
    };

    loadPDF();
  }, [file.type, file.path, open, currentPage]);
  

  const handleInsertSelected = () => {
    if (!currentSheet || selectedRows.size === 0) {
      toast.error('No rows selected');
      return;
    }

    const headers = currentSheet.data[0] as string[];
    const selectedRowData = Array.from(selectedRows)
      .sort((a, b) => a - b)
      .map(idx => currentSheet.data[idx]);

    let formattedContent = '';

    if (formatType === 'markdown') {
      // Markdown table format
      formattedContent = '| ' + headers.join(' | ') + ' |\n';
      formattedContent += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      selectedRowData.forEach(row => {
        formattedContent += '| ' + (row as any[]).join(' | ') + ' |\n';
      });
    } else {
      // Original format - PROPER HTML TABLE! 🔥
      formattedContent = '<table><thead><tr>';
      
      // Header row
      headers.forEach(header => {
        formattedContent += `<th>${header || ''}</th>`;
      });
      formattedContent += '</tr></thead><tbody>';
      
      // Data rows
      selectedRowData.forEach(row => {
        formattedContent += '<tr>';
        (row as any[]).forEach(cell => {
          formattedContent += `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`;
        });
        formattedContent += '</tr>';
      });
      
      formattedContent += '</tbody></table>';
    }

    if (onInsert) {
      onInsert(formattedContent);
      toast.success(`Inserted ${selectedRows.size} rows as ${formatType === 'markdown' ? 'Markdown' : 'HTML Table'} 🔥`);
      // Auto-close dialog after successful insertion
      onOpenChange(false);
    }
  };

  const handleCopySelected = () => {
    if (!currentSheet || selectedRows.size === 0) {
      toast.error('No rows selected');
      return;
    }

    const headers = currentSheet.data[0] as string[];
    const selectedRowData = Array.from(selectedRows)
      .sort((a, b) => a - b)
      .map(idx => currentSheet.data[idx]);

    let formattedContent = '';

    if (formatType === 'markdown') {
      // Markdown table format
      formattedContent = '| ' + headers.join(' | ') + ' |\n';
      formattedContent += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      selectedRowData.forEach(row => {
        formattedContent += '| ' + (row as any[]).join(' | ') + ' |\n';
      });
    } else {
      // Original format - PROPER HTML TABLE! 🔥
      formattedContent = '<table><thead><tr>';
      
      // Header row
      headers.forEach(header => {
        formattedContent += `<th>${header || ''}</th>`;
      });
      formattedContent += '</tr></thead><tbody>';
      
      // Data rows
      selectedRowData.forEach(row => {
        formattedContent += '<tr>';
        (row as any[]).forEach(cell => {
          formattedContent += `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`;
        });
        formattedContent += '</tr>';
      });
      
      formattedContent += '</tbody></table>';
    }

    navigator.clipboard.writeText(formattedContent);
    toast.success(`Copied ${selectedRows.size} rows as ${formatType === 'markdown' ? 'Markdown' : 'HTML Table'} 🔥`);
  };

  // Render Excel table
  const renderExcelTable = () => {
    if (!currentSheet) return null;

    const headers = currentSheet.data[0] as string[];
    const dataRows = currentSheet.data.slice(1);

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === dataRows.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground">
              {selectedRows.size} of {dataRows.length} selected
            </span>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 border-b border-border">
              <tr>
                <th className="w-10 px-2 py-2 text-left">
                  <span className="sr-only">Select</span>
                </th>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => {
                const actualRowIndex = rowIndex + 1; // +1 because we sliced header
                const rowData = row as any[];
                const matchesSearch = !searchQuery || 
                  rowData.some(cell => 
                    String(cell).toLowerCase().includes(searchQuery.toLowerCase())
                  );

                if (!matchesSearch) return null;

                return (
                  <tr
                    key={rowIndex}
                    className={`border-b border-border hover:bg-muted/50 ${
                      selectedRows.has(actualRowIndex) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="w-10 px-2 py-2">
                      <Checkbox
                        checked={selectedRows.has(actualRowIndex)}
                        onCheckedChange={() => toggleRowSelection(actualRowIndex)}
                      />
                    </td>
                    {rowData.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2">
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    );
  };

  // Render text content
  const renderTextContent = () => {
    if (!file.content) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No content available for preview</p>
        </div>
      );
    }

    const lines = file.content.split('\n').length;
    const chars = file.content.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>{lines} lines • {chars} characters</span>
          {selectedTextRange && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-primary font-medium">
                ✂️ {selectedTextRange.end - selectedTextRange.start} characters selected
              </span>
              <button
                onClick={() => {
                  setSelectedTextRange(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
          <pre 
            className="text-sm font-mono whitespace-pre-wrap select-text cursor-text"
            onMouseUp={handleTextSelection}
            style={{ userSelect: 'text' }}
          >
            {file.content}
          </pre>
        </ScrollArea>
        <div className="text-xs text-muted-foreground text-center px-2">
          💡 Tip: Select any text and click "Insert Selected" to insert only that portion
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            {file.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            {hasExcelData && (
              <>
                <Select
                  value={String(selectedSheet)}
                  onValueChange={(val) => {
                    setSelectedSheet(Number(val));
                    setSelectedRows(new Set()); // Clear selection when switching sheets
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {file.rawData?.sheets.map((sheet, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {sheet.name} ({sheet.rowCount} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={formatType}
                  onValueChange={(val) => setFormatType(val as 'markdown' | 'original')}
                >
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">📝 Markdown Table</SelectItem>
                    <SelectItem value="original">🔥 HTML Table</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {file.type === 'pdf' ? renderPDFContent() : hasExcelData ? renderExcelTable() : renderTextContent()}
        </div>

        <DialogFooter className="flex-row gap-2 justify-between">
          <div className="flex gap-2">
            {hasExcelData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySelected}
                disabled={selectedRows.size === 0}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Selected
              </Button>
            )}
            {onUseAsContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUseAsContext();
                  toast.success(`${file.name} added to AI context`);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use as AI Context
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {hasExcelData ? (
              <Button
                size="sm"
                onClick={handleInsertSelected}
                disabled={selectedRows.size === 0}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Insert into Document ({selectedRows.size})
              </Button>
            ) : (
              <>
                {selectedTextRange && (
                  <Button
                    size="sm"
                    onClick={handleInsertSelectedText}
                    className="gradient-primary border-0 text-white"
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Insert Selected
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={selectedTextRange ? "outline" : "default"}
                  onClick={handleInsertFullText}
                  disabled={!file.content}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Insert All
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

