/**
 * AI Enhance Modal - Hybrid approach with 3 tabs
 * Helps users enhance existing diagrams with AI
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Zap, MessageSquare, AlertCircle, CheckCircle2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { aiService } from '@/services/ai/AIService';
import mermaid from 'mermaid';

interface AIEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  diagramType: string;
  onApply: (enhancedCode: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIEnhanceModal: React.FC<AIEnhanceModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  diagramType,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState('quick');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedCode, setEnhancedCode] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [enhancedZoom, setEnhancedZoom] = useState(1);
  
  const currentPreviewRef = useRef<HTMLDivElement>(null);
  const enhancedPreviewRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render current diagram - with delay to ensure DOM is ready
  useEffect(() => {
    console.group('🔄 MODAL LIFECYCLE: Current Diagram Effect');
    console.log('Trigger params:', { 
      isOpen, 
      hasCode: !!currentCode, 
      codeLength: currentCode?.length,
      activeTab,
      hasRef: !!currentPreviewRef.current,
      currentZoom
    });
    
    if (isOpen && currentCode) {
      console.log('✅ Modal is OPEN with code, scheduling render in 100ms...');
      // Small delay to ensure DOM is mounted
      const timer = setTimeout(() => {
        console.log('⏰ Timer fired after 100ms, checking ref...');
        if (currentPreviewRef.current) {
          console.log('✅ Ref exists! Rendering current diagram with zoom:', currentZoom);
          renderDiagram(currentCode, currentPreviewRef.current, 'current', currentZoom);
        } else {
          console.warn('❌ Ref not ready after 100ms delay!');
        }
      }, 100);
      console.groupEnd();
      return () => {
        console.log('🧹 Cleanup: Clearing render timer');
        clearTimeout(timer);
      };
    } else {
      console.log('⏸️ Effect skipped:', {
        reason: !isOpen ? 'Modal closed' : 'No code',
        isOpen,
        hasCode: !!currentCode
      });
      console.groupEnd();
    }
  }, [isOpen, currentCode, activeTab]);

  // Render enhanced diagram
  useEffect(() => {
    if (enhancedCode && enhancedPreviewRef.current) {
      console.log('✅ Rendering enhanced diagram with zoom:', enhancedZoom);
      renderDiagram(enhancedCode, enhancedPreviewRef.current, 'enhanced', enhancedZoom);
    }
  }, [enhancedCode]);

  // Generate smart suggestions on open
  useEffect(() => {
    if (isOpen && currentCode) {
      generateSuggestions();
    }
  }, [isOpen, currentCode]);

  const renderDiagram = async (code: string, container: HTMLElement, prefix: string, initialZoom: number = 1) => {
    console.group(`🎨 RENDER DIAGRAM: ${prefix.toUpperCase()}`);
    console.log('📋 Parameters:', { 
      prefix,
      hasContainer: !!container, 
      codeLength: code?.length,
      initialZoom,
      containerClass: container?.className
    });
    
    if (!container) {
      console.warn('❌ Container not ready for', prefix);
      console.groupEnd();
      return;
    }
    
    // Log container state BEFORE render
    const containerRect = container.getBoundingClientRect();
    console.log('📦 Container BEFORE render:', {
      width: containerRect.width,
      height: containerRect.height,
      top: containerRect.top,
      left: containerRect.left
    });
    
    try {
      const id = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      console.log(`🔷 Rendering mermaid with ID: ${id}`);
      
      const { svg } = await mermaid.render(id, code);
      console.log(`✅ Mermaid rendered successfully!`, { 
        svgLength: svg.length,
        svgPreview: svg.substring(0, 100) + '...'
      });
      
      container.innerHTML = svg;
      console.log(`✅ SVG inserted into DOM`);
      
      // Style SVG for SMART responsiveness with FIT-TO-VIEW
      const svgElement = container.querySelector('svg');
      if (svgElement) {
        // Get original dimensions (robust): prefer viewBox → width/height → bbox → container
        const parseNumber = (val: string | null): number | undefined => {
          if (!val) return undefined;
          if (val.includes('%')) return undefined; // percentages are ambiguous
          const n = parseFloat(val);
          return Number.isFinite(n) ? n : undefined;
        };

        let originalWidth = parseNumber(svgElement.getAttribute('width'));
        let originalHeight = parseNumber(svgElement.getAttribute('height'));

        const vb = svgElement.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/\s+/);
          if (parts.length === 4) {
            const vbW = parseFloat(parts[2]);
            const vbH = parseFloat(parts[3]);
            if (Number.isFinite(vbW) && Number.isFinite(vbH)) {
              originalWidth = vbW;
              originalHeight = vbH;
            }
          }
        }

        // If still missing, try bbox (after insertion it's measurable)
        if (!originalWidth || !originalHeight) {
          try {
            // @ts-ignore - getBBox exists on SVGSVGElement
            const bbox = svgElement.getBBox?.();
            if (bbox && bbox.width && bbox.height) {
              originalWidth = originalWidth || bbox.width;
              originalHeight = originalHeight || bbox.height;
            }
          } catch {}
        }

        // Fallback to container size or sensible defaults
        if (!originalWidth || !originalHeight) {
          const containerSize = container.getBoundingClientRect();
          originalWidth = originalWidth || containerSize.width || 800;
          originalHeight = originalHeight || containerSize.height || 600;
        }

        console.log('📏 SVG Original Dimensions (final):', { originalWidth, originalHeight });
        
        // Set viewBox for proper scaling
        if (!svgElement.getAttribute('viewBox')) {
          svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
          console.log('✅ ViewBox set:', `0 0 ${originalWidth} ${originalHeight}`);
        }
        
        // Get container dimensions AFTER SVG inserted
        const containerRectAfter = container.getBoundingClientRect();
        const containerWidth = containerRectAfter.width - 32; // Account for padding
        const containerHeight = containerRectAfter.height - 32;
        
        console.log('📦 Container AFTER SVG inserted:', {
          width: containerRectAfter.width,
          height: containerRectAfter.height,
          usableWidth: containerWidth,
          usableHeight: containerHeight
        });
        
        // Calculate scale to fit
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const autoScale = Math.min(scaleX, scaleY); // base fit (allow up-scaling via user zoom)
        
        console.log('🔢 Scale Calculation:', {
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          autoScale: autoScale.toFixed(3),
          formula: `min(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}, 1.0) = ${autoScale.toFixed(2)}`
        });
        
        // Remove fixed dimensions
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        console.log('✅ Fixed width/height attributes removed');
        
        // Calculate final scale (fit × user zoom)
        const finalScale = autoScale * initialZoom;
        
        console.log('🎯 Final Scale Calculation:', {
          autoScale: autoScale.toFixed(3),
          userZoom: initialZoom.toFixed(2),
          finalScale: finalScale.toFixed(3),
          formula: `${autoScale.toFixed(2)} × ${initialZoom.toFixed(2)} = ${finalScale.toFixed(2)}`,
          percentage: `${Math.round(finalScale * 100)}%`
        });
        
        // Use CSS transform for zoom (doesn't affect layout!)
        svgElement.style.width = `${originalWidth}px`;
        svgElement.style.height = `${originalHeight}px`;
        svgElement.style.transform = `scale(${finalScale})`;
        svgElement.style.transformOrigin = 'center center';
        svgElement.style.maxWidth = 'none';
        svgElement.style.maxHeight = 'none';
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgElement.style.transition = 'transform 0.2s ease';
        
        console.log('✅ SVG Styles Applied:', {
          width: svgElement.style.width,
          height: svgElement.style.height,
          transform: svgElement.style.transform,
          transformOrigin: svgElement.style.transformOrigin,
          transition: svgElement.style.transition
        });
        
        // Log final container state
        const finalContainerRect = container.getBoundingClientRect();
        console.log('📦 Container FINAL state:', {
          width: finalContainerRect.width,
          height: finalContainerRect.height,
          didGrow: finalContainerRect.width > containerRect.width || finalContainerRect.height > containerRect.height,
          widthDiff: finalContainerRect.width - containerRect.width,
          heightDiff: finalContainerRect.height - containerRect.height
        });
        
        console.log('🎉 RENDER COMPLETE!');
      } else {
        console.error('❌ SVG element not found in container!');
      }
    } catch (error) {
      console.error('💥 RENDER ERROR:', error);
      container.innerHTML = `
        <div class="text-red-500 text-xs p-4">
          <p class="font-semibold mb-1">⚠️ Render Error</p>
          <p class="text-muted-foreground">${error instanceof Error ? error.message : 'Failed to render'}</p>
        </div>
      `;
    }
    
    console.groupEnd();
  };

  const generateSuggestions = async () => {
    // Analyze diagram and suggest improvements
    const isMindmap = diagramType.toLowerCase().includes('mindmap');
    const isFlowchart = diagramType.toLowerCase().includes('flow');
    const isSequence = diagramType.toLowerCase().includes('sequence');
    
    const suggestions: string[] = [];
    
    if (isMindmap) {
      if (currentCode.split('\n').length < 10) suggestions.push('Add more detail to branches');
      suggestions.push('Add sub-topics to main nodes');
    } else if (isFlowchart) {
      if (!currentCode.includes('style')) suggestions.push('Add colors for better clarity');
      if (!currentCode.match(/\|.*\|/)) suggestions.push('Add error handling paths');
    } else if (isSequence) {
      if (!currentCode.includes('Note')) suggestions.push('Add explanatory notes');
      if (!currentCode.includes('-->>')) suggestions.push('Add return messages');
    }
    
    setSuggestions(suggestions);
  };

  const enhanceDiagram = async (instruction: string) => {
    setError(null);
    setIsEnhancing(true);

    try {
      const systemPrompt = `You are a Mermaid diagram expert. Enhance this ${diagramType} diagram based on the user's instruction.

Current diagram code:
${currentCode}

Rules:
- Return ONLY the enhanced Mermaid code, no explanations or markdown fences
- Maintain the original structure unless the instruction requires changes
- Ensure proper Mermaid syntax
- Make targeted improvements based on the instruction`;

      const result = await aiService.generateContent(instruction, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 800,
      });

      // Clean the response
      let cleanCode = result.trim();
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```(?:mermaid)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      setEnhancedCode(cleanCode);
      
      // If in chat mode, add to messages
      if (activeTab === 'chat') {
        setChatMessages(prev => [
          ...prev,
          { role: 'user', content: instruction },
          { role: 'assistant', content: '✅ Enhanced diagram generated!' },
        ]);
        setChatInput('');
      }
    } catch (err: any) {
      console.error('Enhancement error:', err);
      
      if (err.message?.includes('Rate limit')) {
        setError('Rate limit exceeded. Please wait a moment.');
      } else if (err.message?.includes('API key')) {
        setError('AI service not configured. Please check your API key.');
      } else {
        setError(err.message || 'Failed to enhance diagram. Please try again.');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let instruction = '';
    
    switch (action) {
      case 'detail':
        instruction = `Make this ${diagramType} more detailed. Add more specific labels, intermediate steps, and clarifying information while maintaining the core structure.`;
        break;
      case 'simplify':
        instruction = `Simplify this ${diagramType}. Remove unnecessary complexity, consolidate similar elements, and make it more concise while keeping the essential information.`;
        break;
      case 'colors':
        instruction = `Add meaningful colors and styling to this ${diagramType}. Use color coding to differentiate types of elements (e.g., green for success, red for errors, blue for processes). Add style definitions.`;
        break;
      case 'layout':
        instruction = `Improve the layout of this ${diagramType}. Optimize node positioning, flow direction, and spacing for better visual clarity and readability.`;
        break;
      case 'errors':
        instruction = `Fix any syntax errors in this ${diagramType} and ensure it's valid Mermaid code. Also improve any unclear or ambiguous parts.`;
        break;
      case 'notes':
        instruction = `Add descriptive notes and annotations to this ${diagramType}. Explain complex parts, add context, and make it self-documenting.`;
        break;
    }
    
    enhanceDiagram(instruction);
  };

  const handleCustomEnhance = () => {
    if (!customPrompt.trim()) return;
    enhanceDiagram(customPrompt);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    
    // If first message, use as base instruction
    // If subsequent message, build on previous enhancement
    const context = enhancedCode ? 
      `Based on this enhanced version:\n${enhancedCode}\n\nNow: ${chatInput}` :
      chatInput;
    
    enhanceDiagram(context);
  };

  const handleApply = () => {
    if (enhancedCode) {
      onApply(enhancedCode);
      onClose();
    }
  };

  const handleReset = () => {
    setEnhancedCode('');
    setError(null);
    setCustomPrompt('');
    setChatMessages([]);
    setChatInput('');
  };

  // Zoom controls for current preview
  const handleCurrentZoomIn = () => {
    console.log('🔍 ZOOM IN: Current Preview');
    console.log('  Old zoom:', currentZoom);
    // Larger, more satisfying step: 50%
    const newZoom = Math.min(currentZoom + 0.5, 5);
    console.log('  New zoom:', newZoom, `(${Math.round(newZoom * 100)}%)`);
    console.log('  Capped at max:', newZoom === 3 ? 'YES' : 'NO');
    setCurrentZoom(newZoom);
    if (currentPreviewRef.current && currentCode) {
      console.log('  ✅ Re-rendering with new zoom...');
      renderDiagram(currentCode, currentPreviewRef.current, 'current', newZoom);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!currentPreviewRef.current, hasCode: !!currentCode });
    }
  };

  const handleCurrentZoomOut = () => {
    console.log('🔍 ZOOM OUT: Current Preview');
    console.log('  Old zoom:', currentZoom);
    // Larger step and lower floor
    const newZoom = Math.max(currentZoom - 0.5, 0.1);
    console.log('  New zoom:', newZoom, `(${Math.round(newZoom * 100)}%)`);
    console.log('  Floored at min:', newZoom === 0.25 ? 'YES' : 'NO');
    setCurrentZoom(newZoom);
    if (currentPreviewRef.current && currentCode) {
      console.log('  ✅ Re-rendering with new zoom...');
      renderDiagram(currentCode, currentPreviewRef.current, 'current', newZoom);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!currentPreviewRef.current, hasCode: !!currentCode });
    }
  };

  const handleCurrentFitToView = () => {
    console.log('🔍 FIT-TO-VIEW: Current Preview');
    console.log('  Old zoom:', currentZoom);
    console.log('  Resetting to:', 1.0, '(100%)');
    setCurrentZoom(1);
    if (currentPreviewRef.current && currentCode) {
      console.log('  ✅ Re-rendering with reset zoom...');
      renderDiagram(currentCode, currentPreviewRef.current, 'current', 1);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!currentPreviewRef.current, hasCode: !!currentCode });
    }
  };

  // Zoom controls for enhanced preview
  const handleEnhancedZoomIn = () => {
    console.log('🔍 ZOOM IN: Enhanced Preview');
    console.log('  Old zoom:', enhancedZoom);
    const newZoom = Math.min(enhancedZoom + 0.5, 5);
    console.log('  New zoom:', newZoom, `(${Math.round(newZoom * 100)}%)`);
    console.log('  Capped at max:', newZoom === 3 ? 'YES' : 'NO');
    setEnhancedZoom(newZoom);
    if (enhancedPreviewRef.current && enhancedCode) {
      console.log('  ✅ Re-rendering with new zoom...');
      renderDiagram(enhancedCode, enhancedPreviewRef.current, 'enhanced', newZoom);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!enhancedPreviewRef.current, hasCode: !!enhancedCode });
    }
  };

  const handleEnhancedZoomOut = () => {
    console.log('🔍 ZOOM OUT: Enhanced Preview');
    console.log('  Old zoom:', enhancedZoom);
    const newZoom = Math.max(enhancedZoom - 0.5, 0.1);
    console.log('  New zoom:', newZoom, `(${Math.round(newZoom * 100)}%)`);
    console.log('  Floored at min:', newZoom === 0.25 ? 'YES' : 'NO');
    setEnhancedZoom(newZoom);
    if (enhancedPreviewRef.current && enhancedCode) {
      console.log('  ✅ Re-rendering with new zoom...');
      renderDiagram(enhancedCode, enhancedPreviewRef.current, 'enhanced', newZoom);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!enhancedPreviewRef.current, hasCode: !!enhancedCode });
    }
  };

  const handleEnhancedFitToView = () => {
    console.log('🔍 FIT-TO-VIEW: Enhanced Preview');
    console.log('  Old zoom:', enhancedZoom);
    console.log('  Resetting to:', 1.0, '(100%)');
    setEnhancedZoom(1);
    if (enhancedPreviewRef.current && enhancedCode) {
      console.log('  ✅ Re-rendering with reset zoom...');
      renderDiagram(enhancedCode, enhancedPreviewRef.current, 'enhanced', 1);
    } else {
      console.warn('  ❌ Cannot re-render:', { hasRef: !!enhancedPreviewRef.current, hasCode: !!enhancedCode });
    }
  };

  // Log modal state changes
  useEffect(() => {
    if (isOpen) {
      console.group('🚀 MODAL OPENED');
      console.log('Props:', {
        diagramType,
        hasCurrentCode: !!currentCode,
        codeLength: currentCode?.length,
        currentZoom,
        enhancedZoom
      });
      console.groupEnd();
    } else {
      console.log('❌ MODAL CLOSED');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔀 Dialog state changing:', { from: isOpen, to: open });
      onClose();
    }}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 w-[95vw] overflow-hidden" aria-describedby="ai-enhance-description">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle>AI Enhance Diagram</DialogTitle>
          </div>
          <p id="ai-enhance-description" className="text-sm text-muted-foreground mt-1">
            Improve your {diagramType} with AI assistance
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Custom
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Make inner content scroll, not the whole dialog */}
            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Error Display */}
              {error && (
                <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Enhancement Failed
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && !enhancedCode && (
                <div className="mx-6 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                    💡 Suggested Improvements:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* QUICK TAB */}
              <TabsContent value="quick" className="p-6 space-y-4 mt-0">
                {/* Quick Actions - AT TOP */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <Button onClick={() => handleQuickAction('detail')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Make Detailed</Button>
                    <Button onClick={() => handleQuickAction('simplify')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Simplify</Button>
                    <Button onClick={() => handleQuickAction('colors')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Add Colors</Button>
                    <Button onClick={() => handleQuickAction('layout')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Layout</Button>
                    <Button onClick={() => handleQuickAction('errors')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Fix Errors</Button>
                    <Button onClick={() => handleQuickAction('notes')} disabled={isEnhancing} variant="outline" className="h-8 px-2 text-[11px] font-medium justify-center whitespace-nowrap">Add Notes</Button>
                  </div>
                </div>

                {/* Side-by-side Preview - WITH ZOOM CONTROLS */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Current */}
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold">Current</h3>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentZoomOut}>
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                          {Math.round(currentZoom * 100)}%
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentZoomIn}>
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentFitToView} title="Fit to view">
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-[300px] bg-background overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <div ref={currentPreviewRef} className="flex items-center justify-center max-w-full max-h-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced */}
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-primary/10 px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold">Enhanced Preview</h3>
                      {enhancedCode && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomOut}>
                            <ZoomOut className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                            {Math.round(enhancedZoom * 100)}%
                          </span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomIn}>
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedFitToView} title="Fit to view">
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="relative h-[300px] bg-background overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <div ref={enhancedPreviewRef} className="flex items-center justify-center max-w-full max-h-full">
                            {!enhancedCode && (
                              <p className="text-sm text-muted-foreground">
                                Select a quick action to see preview
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* CUSTOM TAB */}
              <TabsContent value="custom" className="p-6 space-y-6 mt-0 pb-24">
                {/* Side-by-side Preview - WITH ZOOM CONTROLS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold">Current</h3>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentZoomOut}>
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                          {Math.round(currentZoom * 100)}%
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentZoomIn}>
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCurrentFitToView} title="Fit to view">
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-[300px] bg-background overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <div ref={currentPreviewRef} className="flex items-center justify-center max-w-full max-h-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-primary/10 px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold">Enhanced Preview</h3>
                      {enhancedCode && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomOut}>
                            <ZoomOut className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                            {Math.round(enhancedZoom * 100)}%
                          </span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomIn}>
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedFitToView} title="Fit to view">
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="relative h-[300px] bg-background overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <div ref={enhancedPreviewRef} className="flex items-center justify-center max-w-full max-h-full">
                            {!enhancedCode && (
                              <p className="text-sm text-muted-foreground">
                                Describe your enhancement below
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Instructions - chat-like composer */}
                <div className="sticky bottom-0 bg-background/95 supports-[backdrop-filter]:backdrop-blur border-t pt-3 pb-3 z-10">
                  <label className="block text-sm font-medium mb-2">
                    Describe what you want to enhance:
                  </label>
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Example: Add error handling paths, include validation steps, make node labels more descriptive..."
                      className="flex-1 min-h-[80px] resize-none"
                      disabled={isEnhancing}
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCustomEnhance();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2 w-[160px] flex-shrink-0">
                      <Button
                        onClick={handleCustomEnhance}
                        disabled={!customPrompt.trim() || isEnhancing}
                        className="w-full"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          'Generate'
                        )}
                      </Button>
                      {enhancedCode && (
                        <Button onClick={handleReset} variant="outline" className="w-full">
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Example prompts removed to simplify UI */}
              </TabsContent>

              {/* CHAT TAB */}
              <TabsContent value="chat" className="p-6 space-y-4 mt-0">
                {/* Chat Messages */}
                <div className="border rounded-lg bg-muted/30 min-h-[400px] max-h-[400px] overflow-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Start a conversation to refine your diagram</p>
                        <p className="text-xs mt-1">Example: "Make it more detailed"</p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Current Enhanced Preview - WITH ZOOM CONTROLS */}
                {enhancedCode && (
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-primary/10 px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold">Current Version</h3>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomOut}>
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                          {Math.round(enhancedZoom * 100)}%
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedZoomIn}>
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEnhancedFitToView} title="Fit to view">
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-[300px] bg-background overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <div ref={enhancedPreviewRef} className="flex items-center justify-center max-w-full max-h-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Describe what you want to change..."
                    className="flex-1 resize-none"
                    rows={2}
                    disabled={isEnhancing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || isEnhancing}
                    className="self-end"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isEnhancing && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enhancing diagram...</span>
              </>
            )}
            {enhancedCode && !isEnhancing && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Enhancement ready!</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!enhancedCode || isEnhancing}
              className="min-w-[140px]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Enhancement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

