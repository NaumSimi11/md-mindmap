/**
 * Diagram Insert Menu
 * Shows all available diagram templates organized by category
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { diagramTemplates, DiagramTemplate } from './DiagramTemplates';
import { Sparkles, Info, Eye, EyeOff, Palette, Layout, CheckCircle2 } from 'lucide-react';
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
  const [detectedConfig, setDetectedConfig] = useState<{ theme?: string; layout?: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedLayout, setSelectedLayout] = useState<string>('dagre');
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid with LARGE default size
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base', // 'base' is often more stable than 'default' for custom styling
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false, // Let us control sizing
        htmlLabels: true,
        curve: 'basis'
      },
      themeVariables: {
        fontSize: '16px',
        fontFamily: 'inherit',
      }
    });
  }, []);

  // Detect config block in pasted/edited code
  useEffect(() => {
    const detectConfig = () => {
      // Check for config block (YAML frontmatter style)
      const configRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = editableCode.match(configRegex);

      if (match) {
        const configBlock = match[1];
        const diagramCode = match[2].trim();

        // Extract theme
        const themeMatch = configBlock.match(/theme:\s*(\w+)/);
        const theme = themeMatch ? themeMatch[1] : undefined;

        // Extract layout
        const layoutMatch = configBlock.match(/layout:\s*(\w+)/);
        const layout = layoutMatch ? layoutMatch[1] : undefined;

        if (theme || layout) {
          setDetectedConfig({ theme, layout });

          // Set selectors to detected values
          if (theme) setSelectedTheme(theme);
          if (layout) setSelectedLayout(layout);

          // Update code to remove config block
          setEditableCode(diagramCode);
        }
      } else {
        setDetectedConfig(null);
      }
    };

    if (editableCode) {
      detectConfig();
    }
  }, [editableCode]);

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

          // Apply selected theme/layout to preview
          let previewCode = editableCode;
          if (selectedTheme !== 'default' || selectedLayout !== 'dagre') {
            const initConfig: any = {};
            if (selectedTheme !== 'default') {
              initConfig.theme = selectedTheme;
            }
            if (selectedLayout !== 'dagre') {
              initConfig.flowchart = { layout: selectedLayout };
            }
            const initBlock = `%%{init: ${JSON.stringify(initConfig)}}%%`;
            previewCode = `${initBlock}\n${editableCode}`;
          }

          const id = `mermaid-preview-${Date.now()}`;
          const { svg } = await mermaid.render(id, previewCode);

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
              svgElement.style.width = 'auto';
              svgElement.style.height = 'auto';
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '100%';
              // svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet'); // Let browser handle it naturally with auto size
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
  }, [editableCode, showPreview, selectedTheme, selectedLayout]);


  const handleInsert = () => {
    if (editableCode.trim()) {
      // Build init block with selected theme/layout
      let finalCode = editableCode;

      if (selectedTheme !== 'default' || selectedLayout !== 'dagre') {
        const initConfig: any = {};

        if (selectedTheme !== 'default') {
          initConfig.theme = selectedTheme;
        }

        if (selectedLayout !== 'dagre') {
          initConfig.flowchart = { layout: selectedLayout };
        }

        const initBlock = `%%{init: ${JSON.stringify(initConfig)}}%%`;
        finalCode = `${initBlock}\n${editableCode}`;
      }

      onInsert(finalCode);
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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Insert Diagram</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose from popular diagram types or paste your own Mermaid code
          </p>

          {/* Config Detected Notice */}
          {detectedConfig && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Config block detected!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Found theme: <span className="font-mono">{detectedConfig.theme || 'default'}</span>
                  {detectedConfig.layout && (
                    <>, layout: <span className="font-mono">{detectedConfig.layout}</span></>
                  )}
                  . You can customize below.
                </p>
              </div>
            </div>
          )}

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

          {/* Theme & Layout Selectors */}
          {selectedTemplate && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {/* Theme Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Theme
                </Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="forest">Forest</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Layout Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5" />
                  Layout
                </Label>
                <Select value={selectedLayout} onValueChange={setSelectedLayout}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dagre">Dagre (Top-Down)</SelectItem>
                    <SelectItem value="elk">ELK (Hierarchical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - ALL Templates - BIGGER! */}
          <div className="w-[20%] border-r">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-2 p-3">
                {diagramTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-md border-2 text-left transition-all hover:border-primary hover:bg-accent/50 ${selectedTemplate?.id === template.id
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
                <div className="flex-1 flex flex-col border-b">
                  {/* Code Area */}
                  <div className={`flex-1 flex flex-col overflow-hidden ${showPreview ? 'hidden' : 'flex'}`}>
                    <div className="flex-1 p-4 overflow-auto">
                      <Textarea
                        value={editableCode}
                        onChange={(e) => setEditableCode(e.target.value)}
                        className="w-full h-full font-mono text-sm resize-none"
                        placeholder="Edit mermaid diagram code..."
                      />
                    </div>

                    {/* Bottom Buttons - ALIGNED */}
                    <div className="flex items-center gap-3 p-4 border-t bg-background">
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
                            className="w-full h-full flex items-center justify-center p-8 overflow-auto"
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


              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a diagram template to start editing
              </div>
            )}
          </div>
        </div>

        {/* Footer - Insert Button (Outside the flex content area) */}
        <div className="p-4 border-t bg-background">
          <Button
            onClick={handleInsert}
            className="w-full"
            disabled={!editableCode.trim() || !selectedTemplate}
          >
            Insert Diagram
          </Button>
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
