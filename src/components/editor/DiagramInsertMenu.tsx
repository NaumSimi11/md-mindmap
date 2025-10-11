/**
 * Diagram Insert Menu
 * Shows all available diagram templates organized by category
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { diagramTemplates, DiagramTemplate } from './DiagramTemplates';
import { Sparkles, Info, Eye, EyeOff } from 'lucide-react';
import mermaid from 'mermaid';
import { AIAssistantModal } from './AIAssistantModal';

interface DiagramInsertMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  selectedText?: string; // NEW: Selected text from editor
}

export const DiagramInsertMenu: React.FC<DiagramInsertMenuProps> = ({
  isOpen,
  onClose,
  onInsert,
  selectedText = '',
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramTemplate | null>(null);
  const [editableCode, setEditableCode] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false); // Collapsed by default
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Initialize mermaid with LARGE default size
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      themeVariables: {
        fontSize: '18px', // Larger font
      }
    });
  }, []);
  
  // Update editable code when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setEditableCode(selectedTemplate.code);
    }
  }, [selectedTemplate]);
  
  // Render mermaid preview
  useEffect(() => {
    if (showPreview && editableCode.trim() && previewRef.current) {
      const renderDiagram = async () => {
        try {
          // Clear previous content
          if (previewRef.current) {
            previewRef.current.innerHTML = '';
          }
          
          const id = `mermaid-preview-${Date.now()}`;
          const { svg } = await mermaid.render(id, editableCode);
          
          if (previewRef.current) {
            // Wrap SVG in a container for better sizing
            previewRef.current.innerHTML = `
              <div class="w-full h-full flex items-center justify-center">
                ${svg}
              </div>
            `;
            
            // Style the SVG to FIT properly in container
            const svgElement = previewRef.current.querySelector('svg');
            if (svgElement) {
              // Get original dimensions
              const originalWidth = svgElement.getAttribute('width');
              const originalHeight = svgElement.getAttribute('height');
              
              // Set viewBox for proper scaling
              if (originalWidth && originalHeight && !svgElement.getAttribute('viewBox')) {
                svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
              }
              
              // Remove fixed dimensions
              svgElement.removeAttribute('width');
              svgElement.removeAttribute('height');
              
              // Make it fill container while maintaining aspect ratio
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '100%';
              svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet'); // Fit and center
            }
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (previewRef.current) {
            previewRef.current.innerHTML = `
              <div class="text-red-500 text-xs p-4">
                <p class="font-semibold mb-1">⚠️ Syntax Error</p>
                <p class="text-muted-foreground">${error instanceof Error ? error.message : 'Invalid mermaid syntax'}</p>
              </div>
            `;
          }
        }
      };
      
      // Debounce rendering to avoid too many calls
      const timeoutId = setTimeout(renderDiagram, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [editableCode, showPreview]);


  const handleInsert = () => {
    if (editableCode.trim()) {
      onInsert(editableCode);
      onClose();
    }
  };
  
  const handleAIHelp = () => {
    setShowAIModal(true);
  };

  const handleAIGenerate = (generatedCode: string) => {
    setEditableCode(generatedCode);
    setShowPreview(true); // Auto-show preview after generation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Insert Diagram</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose from popular diagram types
          </p>
          
          {/* Selected Text Notice */}
          {selectedText && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Selected text detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI can generate diagram from: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Sidebar - ALL Templates - BIGGER! */}
          <div className="w-[20%] border-r">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-2 p-3">
                {diagramTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-md border-2 text-left transition-all hover:border-primary hover:bg-accent/50 ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-accent'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <span className="text-xs font-medium">{template.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Code + Preview Panel - STACKED VERTICALLY! */}
          <div className="w-[80%] flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Code Editor - FULL HEIGHT */}
                <div className="flex-1 flex flex-col relative">
                  {/* Code Area */}
                  <div className={`flex-1 flex flex-col p-4 gap-3 ${showPreview ? 'hidden' : 'flex'}`}>
                    <Textarea
                      value={editableCode}
                      onChange={(e) => setEditableCode(e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder="Edit mermaid diagram code..."
                    />
                    
                    {/* Bottom Buttons - ALIGNED */}
                    <div className="flex items-center gap-3">
                      {/* AI Help Button */}
                      <Button
                        onClick={handleAIHelp}
                        variant="outline"
                        className="flex-1"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Diagram Help
                      </Button>
                      
                      {/* Show Preview Button */}
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="default"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Show Preview
                      </Button>
                    </div>
                  </div>

                  {/* Preview - COVERS CODE when expanded */}
                  {showPreview && (
                    <div className="absolute inset-0 flex flex-col bg-background">
                      {/* Scrollable Preview Container */}
                      <div className="flex-1 overflow-auto">
                        <div className="min-h-full p-8 flex items-center justify-center">
                          <div 
                            ref={previewRef}
                            className="min-w-[600px] w-full flex items-center justify-center"
                          >
                            {!editableCode.trim() ? (
                              <div className="text-sm text-muted-foreground">
                                Select a template to see preview
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Rendering...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Buttons - ALIGNED (Preview Mode) */}
                      <div className="p-4 border-t flex items-center gap-3">
                        {/* AI Help Button */}
                        <Button
                          onClick={handleAIHelp}
                          variant="outline"
                          className="flex-1"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Diagram Help
                        </Button>
                        
                        {/* Show Code Button */}
                        <Button
                          onClick={() => setShowPreview(false)}
                          variant="default"
                          className="flex-1"
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Show Code
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Insert Button */}
                <div className="p-4 border-t">
                  <Button
                    onClick={handleInsert}
                    className="w-full"
                    disabled={!editableCode.trim()}
                  >
                    Insert Diagram
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a diagram template to start editing
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        context={{
          selectedText: selectedText,
          currentCode: editableCode,
          diagramType: selectedTemplate?.name || 'Diagram',
          hasExistingCode: editableCode.trim() !== (selectedTemplate?.code || '').trim() && editableCode.trim() !== ''
        }}
        onGenerate={handleAIGenerate}
      />
    </Dialog>
  );
};
