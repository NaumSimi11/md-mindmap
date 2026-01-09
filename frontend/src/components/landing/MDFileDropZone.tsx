import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MDFileDropZoneProps {
  onFileAnalyzed: (result: FileAnalysisResult) => void;
  isAnalyzing?: boolean;
}

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  content: string;
  analysis: {
    wordCount: number;
    headings: { level: number; text: string }[];
    mermaidDiagrams: number;
    codeBlocks: number;
    links: number;
    hasActionItems: boolean;
  };
}

export function MDFileDropZone({ onFileAnalyzed, isAnalyzing = false }: MDFileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const validExtensions = ['.md', '.markdown', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      return 'Please upload a .md, .markdown, or .txt file';
    }

    // Check file size (max 5MB for now)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 5MB';
    }

    if (file.size === 0) {
      return 'File is empty';
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    try {
      const content = await file.text();
      
      if (!content.trim()) {
        setError('File is empty');
        return;
      }

      // Analyze the markdown content
      const analysis = analyzeMarkdown(content);

      const result: FileAnalysisResult = {
        fileName: file.name,
        fileSize: file.size,
        content,
        analysis,
      };

      onFileAnalyzed(result);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file. Please try again.');
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Only process first file
    await processFile(file);
  }, [onFileAnalyzed]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative group cursor-pointer',
          'rounded-2xl border-2 border-dashed',
          'transition-all duration-300 ease-out',
          'backdrop-blur-xl',
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
            : 'border-slate-600/50 bg-slate-800/40 hover:bg-slate-800/60 hover:border-cyan-500/50',
          isAnalyzing && 'pointer-events-none opacity-60',
          'shadow-lg hover:shadow-xl hover:shadow-cyan-500/10'
        )}
      >
        <div className="px-8 py-12 md:px-12 md:py-16">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                'relative rounded-2xl p-4',
                'bg-gradient-to-br from-cyan-500/20 to-indigo-600/20',
                'border border-cyan-500/30',
                'transition-all duration-300 ease-out',
                'shadow-lg',
                isDragging && 'scale-110 rotate-3 shadow-cyan-500/50',
                isAnalyzing && 'animate-pulse'
              )}
            >
              {isAnalyzing ? (
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              ) : isDragging ? (
                <Sparkles className="h-8 w-8 text-cyan-400" />
              ) : (
                <Upload className="h-8 w-8 text-cyan-400 transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
              )}
              
              {/* Glow effect */}
              <div
                className={cn(
                  'absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-300',
                  'bg-gradient-to-br from-cyan-400/30 to-indigo-600/30',
                  (isDragging || isAnalyzing) && 'opacity-100'
                )}
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            {isAnalyzing ? (
              <>
                <h3 className="text-xl font-semibold text-white">
                  Analyzing your file...
                </h3>
                <p className="text-sm text-slate-300">
                  Reading markdown structure
                </p>
              </>
            ) : isDragging ? (
              <>
                <h3 className="text-xl font-semibold text-cyan-300">
                  Drop it here! ✨
                </h3>
                <p className="text-sm text-slate-300">
                  We'll analyze it instantly
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white transition-colors group-hover:text-cyan-300">
                  Drop your .md file here
                </h3>
                <p className="text-sm text-slate-300">
                  or click to browse
                </p>
                <p className="text-xs text-slate-400 pt-2">
                  Supports: <span className="text-cyan-400">.md</span>, <span className="text-cyan-400">.markdown</span>, <span className="text-cyan-400">.txt</span> • Max 5MB
                </p>
              </>
            )}
          </div>

          {/* Sample File Hint */}
          {!isAnalyzing && !isDragging && (
            <div className="mt-6 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Load sample file
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors underline"
              >
                Don't have a file? Try a sample
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Animated border gradient on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
            'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20',
            'pointer-events-none',
            'group-hover:opacity-100'
          )}
          style={{ padding: '2px', margin: '-2px' }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-red-300 text-center">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Quick Info */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          <span>Instant analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>AI-powered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span>Private & secure</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to analyze markdown content
function analyzeMarkdown(content: string) {
  const lines = content.split('\n');
  
  // Count words
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  // Extract headings
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  
  lines.forEach(line => {
    const match = line.match(headingRegex);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  });

  // Count Mermaid diagrams
  const mermaidMatches = content.match(/```mermaid[\s\S]*?```/g);
  const mermaidDiagrams = mermaidMatches ? mermaidMatches.length : 0;

  // Count code blocks (excluding mermaid)
  const codeMatches = content.match(/```[\s\S]*?```/g);
  const totalCodeBlocks = codeMatches ? codeMatches.length : 0;
  const codeBlocks = totalCodeBlocks - mermaidDiagrams;

  // Count links
  const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  const links = linkMatches ? linkMatches.length : 0;

  // Check for action items (- [ ], - [x], TODO, FIXME)
  const actionItemPatterns = [
    /- \[ \]/g,
    /- \[x\]/gi,
    /TODO:/gi,
    /FIXME:/gi,
  ];
  const hasActionItems = actionItemPatterns.some(pattern => pattern.test(content));

  return {
    wordCount,
    headings,
    mermaidDiagrams,
    codeBlocks,
    links,
    hasActionItems,
  };
}

