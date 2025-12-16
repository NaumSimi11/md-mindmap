/**
 * PresentationEditor - Main page for creating and editing presentations
 * 
 * Features:
 * - Auto-generate from Editor + Mindmap
 * - Edit slides
 * - Preview slides
 * - Navigate between slides
 * - Export to PDF/PPTX
 * - Enter presenter mode
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { workspaceService } from '@/services/workspace-legacy/WorkspaceService';
import { Button } from '@/components/ui/button';
import { 
  Presentation as PresentationIcon, 
  Download, 
  Plus, 
  Trash2, 
  Copy,
  ArrowLeft,
  Play,
  Save,
  FileDown,
  Layout,
  Image as ImageIcon,
} from 'lucide-react';
import { presentationGenerator, type Presentation, type Slide } from '@/services/presentation/PresentationGenerator';
import { SlideRenderer } from '@/components/presentation/SlideRenderer';
import { BeautifulSlideRenderer } from '@/components/presentation/BeautifulSlideRenderer';
import { getBeautifulTheme, getAllBeautifulThemes } from '@/services/presentation/BeautifulThemes';
import { convertToBeautifulTheme } from '@/services/presentation/ThemeConverter';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';
import { PresentationSidebar } from '@/components/presentation/PresentationSidebar';
import { LayoutSelectorModal } from '@/components/presentation/LayoutSelectorModal';
import { ImageSearchModal } from '@/components/presentation/ImageSearchModal';
import { FloatingToolbar } from '@/components/presentation/FloatingToolbar';
import { BlockTransformer, type BlockType, type Block } from '@/services/presentation/BlockSystem';
import { BlockSelectorModal } from '@/components/presentation/BlockSelectorModal';
import { SlideLayoutModal } from '@/components/presentation/SlideLayoutModal';
import { createDemoBlock } from '@/utils/blockDemoData';

export default function PresentationEditor() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [showSlideLayoutModal, setShowSlideLayoutModal] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine the actual presentation ID from URL
  // Supports both:
  // - /presentation/{id}/edit (standalone)
  // - /workspace/doc/{id}/slides (workspace)
  const getActualPresentationId = (): string | null => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Check if we're in workspace context
    if (pathParts[0] === 'workspace' && pathParts[1] === 'doc') {
      return pathParts[2] || null; // /workspace/doc/{id}/slides
    }
    
    // Otherwise use the presentationId param
    return presentationId || null; // /presentation/{id}/edit
  };

  const actualId = getActualPresentationId();

  // Load or generate presentation on mount
  useEffect(() => {
    loadOrGeneratePresentation();
  }, [actualId]);

  // Update browser title with presentation name
  useEffect(() => {
    if (presentation) {
      document.title = `${presentation.title} - Presentation Editor`;
    }
    return () => {
      document.title = 'MD Creator';
    };
  }, [presentation]);

  const loadOrGeneratePresentation = async () => {
    try {
      // Check if we need to generate from context
      const sessionKey = localStorage.getItem('presentation-session');

      if (sessionKey) {
        console.log('🎤 Generating presentation from session:', sessionKey);
        await generateFromSession(sessionKey);
      } else if (actualId) {
        // Load existing presentation from workspace or localStorage
        console.log('📂 Loading presentation:', actualId);
        loadExistingPresentation(actualId);
      } else {
        setError('No presentation ID or session found');
      }
    } catch (error) {
      console.error('Failed to load presentation:', error);
      setError(error instanceof Error ? error.message : 'Failed to load presentation');
    }
  };

  const generateFromSession = async (sessionKey: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get editor content
      const editorContent = localStorage.getItem(`editor-${sessionKey}`) || '';
      
      // Get mindmap data if available
      const mindmapDataStr = localStorage.getItem(`mindmap-${sessionKey}`);
      const mindmapData = mindmapDataStr ? JSON.parse(mindmapDataStr) : null;

      console.log('📝 Editor content length:', editorContent.length);
      console.log('🧠 Mindmap nodes:', mindmapData?.nodes?.length || 0);

      if (!editorContent && !mindmapData) {
        throw new Error('No content found to generate presentation from');
      }

      // Generate presentation
      const generated = await presentationGenerator.generateFromContext(
        editorContent,
        mindmapData,
        {
          documentId: sessionKey,
          generateNotes: true,
          maxSlides: 15,
        }
      );

      setPresentation(generated);
      savePresentationToStorage(generated);
      
      // Clear session after successful generation
      localStorage.removeItem('presentation-session');
      localStorage.removeItem(`editor-${sessionKey}`);
      localStorage.removeItem(`mindmap-${sessionKey}`);

      console.log('✅ Presentation generated successfully!');
    } catch (error) {
      console.error('❌ Generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate presentation');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingPresentation = (id: string) => {
    // Try workspace first (for new flow)
    const workspaceDoc = workspaceService.getDocument(id);
    if (workspaceDoc && workspaceDoc.type === 'presentation') {
      try {
        const parsed = JSON.parse(workspaceDoc.content);
        setPresentation(parsed);
        console.log('✅ Loaded presentation from workspace:', parsed.title);
        return;
      } catch (e) {
        console.error('Failed to parse workspace presentation:', e);
      }
    }
    
    // Fallback to localStorage (for old flow)
    const saved = localStorage.getItem(`presentation-${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPresentation(parsed);
      console.log('✅ Loaded presentation from localStorage:', parsed.title);
    } else {
      setError('Presentation not found');
    }
  };

  const savePresentationToStorage = (pres: Presentation) => {
    localStorage.setItem(`presentation-${pres.id}`, JSON.stringify(pres));
    console.log('💾 Saved presentation to localStorage');
  };

  const handleSave = () => {
    if (presentation) {
      // Update updatedAt timestamp
      presentation.metadata.updatedAt = new Date();
      savePresentationToStorage(presentation);
      console.log('💾 Presentation saved');
    }
  };

  const handleAddSlide = () => {
    if (!presentation) return;

    const newSlide: Slide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: presentation.slides.length,
      layout: 'content',
      content: {
        title: 'New Slide',
        body: 'Click to edit...',
      },
      transition: 'slide',
    };

    const updatedPresentation = {
      ...presentation,
      slides: [...presentation.slides, newSlide],
    };

    setPresentation(updatedPresentation);
    setCurrentSlideIndex(presentation.slides.length); // Jump to new slide
    savePresentationToStorage(updatedPresentation);
  };

  const handleDeleteSlide = (index: number) => {
    if (!presentation || presentation.slides.length <= 1) {
      alert('Cannot delete the last slide');
      return;
    }

    const updatedSlides = presentation.slides.filter((_, i) => i !== index);
    // Reorder slides
    updatedSlides.forEach((slide, i) => {
      slide.order = i;
    });

    const updatedPresentation = {
      ...presentation,
      slides: updatedSlides,
    };

    setPresentation(updatedPresentation);
    
    // Adjust current index if needed
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }

    savePresentationToStorage(updatedPresentation);
  };

  const handleDuplicateSlide = (index: number) => {
    if (!presentation) return;

    const slideToDuplicate = presentation.slides[index];
    const duplicatedSlide: Slide = {
      ...slideToDuplicate,
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: index + 1,
    };

    const updatedSlides = [
      ...presentation.slides.slice(0, index + 1),
      duplicatedSlide,
      ...presentation.slides.slice(index + 1),
    ];

    // Reorder
    updatedSlides.forEach((slide, i) => {
      slide.order = i;
    });

    const updatedPresentation = {
      ...presentation,
      slides: updatedSlides,
    };

    setPresentation(updatedPresentation);
    setCurrentSlideIndex(index + 1);
    savePresentationToStorage(updatedPresentation);
  };

  const handleUpdateSlide = (updatedSlide: Slide) => {
    if (!presentation) return;

    const updatedSlides = presentation.slides.map((slide) =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );

    const updatedPresentation = {
      ...presentation,
      slides: updatedSlides,
    };

    console.log('🔄 Updating slide:', updatedSlide.id, updatedSlide);
    setPresentation(updatedPresentation);
    savePresentationToStorage(updatedPresentation);
  };

  // Add a new block to the current slide
  const handleAddBlock = (blockType: BlockType) => {
    if (!presentation) return;

    const currentSlide = presentation.slides[currentSlideIndex];
    if (!currentSlide) return;

    // Create a new block with demo data
    const newBlock: Block = createDemoBlock(blockType);

    // Add block to slide
    const updatedSlide: Slide = {
      ...currentSlide,
      layout: blockType, // Set layout to match block type
      content: {
        ...currentSlide.content,
        blocks: [...(currentSlide.content.blocks || []), newBlock],
      },
    };

    handleUpdateSlide(updatedSlide);
    console.log('✅ Added block:', blockType, newBlock);
  };

  // Add image to current slide
  const handleAddImage = (imageUrl: string) => {
    console.log('🖼️ handleAddImage called with:', imageUrl);
    if (!presentation) {
      console.error('❌ No presentation!');
      return;
    }

    const currentSlide = presentation.slides[currentSlideIndex];
    if (!currentSlide) {
      console.error('❌ No current slide!');
      return;
    }

    console.log('📝 Current slide before:', currentSlide);

    // Add image to slide content
    const updatedSlide: Slide = {
      ...currentSlide,
      content: {
        ...currentSlide.content,
        image: imageUrl,
      },
    };

    console.log('📝 Updated slide:', updatedSlide);
    handleUpdateSlide(updatedSlide);
    console.log('✅ Image added successfully!');
  };

  const handlePresent = () => {
    if (presentation) {
      // Check if we're in workspace context
      if (actualId && location.pathname.includes('/workspace/')) {
        // Stay in workspace, navigate to presenter mode with workspace context
        navigate(`/workspace/doc/${actualId}/present`);
      } else {
        // Fallback to old standalone route
        navigate(`/presentation/${presentation.id}/present`);
      }
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleBackToEditor = () => {
    // Check if we have a source document
    if (presentation?.metadata?.sourceDocumentId) {
      // Navigate back to the original document in workspace
      navigate(`/workspace/doc/${presentation.metadata.sourceDocumentId}/edit`);
    } else {
      // No source document, go to workspace home
      navigate('/workspace');
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex];

  // Loading state
  if (isGenerating) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="h-20 w-20 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <PresentationIcon className="h-10 w-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Generating Your Presentation</h2>
          <p className="text-muted-foreground mb-4">
            AI is analyzing your content and creating professional slides...
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Analyzing document structure</p>
            <p>✓ Extracting key points</p>
            <p>✓ Creating slides</p>
            <p className="animate-pulse">✓ Generating speaker notes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Generation Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={handleBackToEditor}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
        </div>
      </div>
    );
  }

  // No presentation
  if (!presentation) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-background" style={{ overflow: 'hidden', position: 'fixed', inset: 0 }}>
      {/* Main Content - FULL SCREEN */}
      <div className="flex-1 flex relative" style={{ overflow: 'hidden', height: '100vh', width: '100%' }}>
        {/* Floating Toolbar with ALL actions */}
        <FloatingToolbar
          onLayoutClick={() => setShowSlideLayoutModal(true)}
          onImageClick={() => setShowImageSearch(true)}
          onPresentClick={handlePresent}
          onAIClick={() => {
            // TODO: Add AI assistant
            alert('AI Assistant coming soon!');
          }}
          onBackClick={handleBackToEditor}
          onSaveClick={handleSave}
          onExportClick={handleExport}
          onPreviousSlide={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
          onNextSlide={() => setCurrentSlideIndex(Math.min((presentation?.slides.length || 1) - 1, currentSlideIndex + 1))}
          onSpeakerNotesClick={() => setShowSpeakerNotes(true)}
          canGoPrevious={currentSlideIndex > 0}
          canGoNext={currentSlideIndex < (presentation?.slides.length || 1) - 1}
        />


        {/* Sidebar: Slide List - Fixed height with its own scrollbar */}
        <div className="flex-shrink-0" style={{ height: '100%' }}>
          <PresentationSidebar
            slides={presentation.slides}
            currentIndex={currentSlideIndex}
            theme={presentation.theme}
            onSlideSelect={setCurrentSlideIndex}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
          />
        </div>

        {/* Main Canvas: Current Slide - FULL SPACE */}
        <div 
          className="flex-1 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradient 15s ease infinite',
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            padding: '2.5rem',
            position: 'relative',
          }}
        >
          <style>{`
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            /* NO SCROLLBARS AT ALL */
            body, html {
              overflow: hidden !important;
              height: 100vh !important;
              width: 100vw !important;
            }
          `}</style>
          {currentSlide ? (
            <div 
              className="transform transition-all duration-500"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Slide Number - Fixed position at top center */}
              <div 
                className="fixed top-6 left-1/2 -translate-x-1/2 z-40 text-sm text-center font-medium backdrop-blur-md py-2 px-6 rounded-full"
                style={{
                  color: 'white',
                  background: 'rgba(0, 0, 0, 0.6)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                ✨ Slide {currentSlideIndex + 1} of {presentation.slides.length}
              </div>

              {/* Slide Renderer Container - FULL SIZE with 16:9 ratio */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: '16/9',
                  maxHeight: '100%',
                  maxWidth: '100%',
                }}>
                {(() => {
                // Check if we should use beautiful renderer
                const beautifulThemeIds = getAllBeautifulThemes().map(t => t.id);
                
                // Try multiple ways to detect the theme ID
                const themeIdFromMetadata = (presentation.metadata as any)?.themeId;
                const themeIdFromTheme = (presentation.theme as any)?.id;
                const themeIdFromName = presentation.theme.name?.toLowerCase().replace(/\s+/g, '-');
                
                // Priority: metadata > theme.id > name conversion
                const themeId = themeIdFromMetadata || themeIdFromTheme || themeIdFromName;
                
                console.log('🎨 Theme Detection:', {
                  themeIdFromMetadata,
                  themeIdFromTheme,
                  themeIdFromName,
                  finalThemeId: themeId,
                  themeName: presentation.theme.name,
                  beautifulThemeIds,
                  isBeautiful: themeId && beautifulThemeIds.includes(themeId),
                });
                
                // Try to get beautiful theme
                let beautifulTheme: BeautifulTheme | null = null;
                try {
                  if (themeId && beautifulThemeIds.includes(themeId)) {
                    beautifulTheme = getBeautifulTheme(themeId);
                    console.log('✅ Using beautiful theme by ID:', beautifulTheme.name);
                  } else {
                    // ALWAYS convert to beautiful theme - even old themes get upgraded!
                    beautifulTheme = convertToBeautifulTheme(presentation.theme);
                    console.log('✅ Converted to beautiful theme:', beautifulTheme.name);
                  }
                } catch (e) {
                  console.error('❌ Could not get beautiful theme:', e);
                }
                
                // ALWAYS use BeautifulSlideRenderer - it's better!
                if (beautifulTheme) {
                  return (
                    <BeautifulSlideRenderer
                      slide={currentSlide}
                      theme={beautifulTheme}
                      isEditing={true}
                      onUpdate={handleUpdateSlide}
                    />
                  );
                }
                
                // Fallback to old renderer (shouldn't happen, but just in case)
                console.warn('⚠️ Falling back to old renderer - this should not happen!');
                return (
                  <SlideRenderer
                    slide={currentSlide}
                    theme={presentation.theme}
                    isEditing={true}
                    onUpdate={handleUpdateSlide}
                  />
                );
              })()}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-muted-foreground">No slide selected</div>
          )}
        </div>
      </div>

      {/* Export Modal (placeholder for now) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Export Presentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Export functionality coming soon! For now, you can present directly from the app.
            </p>
            <Button onClick={() => setShowExportModal(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Speaker Notes Modal */}
      {showSpeakerNotes && currentSlide && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowSpeakerNotes(false)}
        >
          <div 
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl border-2 border-amber-200"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(251, 191, 36, 0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  📝
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900">Speaker Notes</h3>
                  <p className="text-sm text-amber-700">Slide {currentSlideIndex + 1} of {presentation?.slides.length}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSpeakerNotes(false)}
                className="hover:bg-amber-200 text-amber-900"
              >
                ✕ Close
              </Button>
            </div>
            
            {currentSlide.speakerNotes ? (
              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-inner">
                <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentSlide.speakerNotes}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-inner text-center">
                <p className="text-gray-400 italic">No speaker notes for this slide</p>
                <p className="text-sm text-gray-500 mt-2">Add notes to help guide your presentation!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide Layout Modal - Image position, columns, etc. */}
      <SlideLayoutModal
        isOpen={showSlideLayoutModal}
        onClose={() => setShowSlideLayoutModal(false)}
        onSelect={(layoutId) => {
          console.log('🎨 Selected layout:', layoutId);
          // Apply layout to current slide
          if (presentation && currentSlide) {
            const updatedSlide: Slide = {
              ...currentSlide,
              layout: layoutId as any,
            };
            handleUpdateSlide(updatedSlide);
          }
        }}
      />

      {/* Block Selector Modal - Add beautiful blocks */}
      <BlockSelectorModal
        isOpen={showBlockSelector}
        onClose={() => setShowBlockSelector(false)}
        onSelect={(blockType) => {
          handleAddBlock(blockType);
        }}
      />

      {/* Layout Selector Modal */}
      <LayoutSelectorModal
        open={showLayoutSelector}
        onOpenChange={setShowLayoutSelector}
        onLayoutSelect={(layoutType) => {
          if (currentSlide && presentation) {
            // Transform current slide to new layout
            const block = {
              id: `block-${currentSlide.id}`,
              type: currentSlide.layout as BlockType,
              content: {
                text: currentSlide.content.body,
                heading: currentSlide.content.title,
                bullets: currentSlide.content.bullets,
              },
              order: 0,
            };
            
            const transformed = BlockTransformer.transform(block, layoutType);
            
            // Update slide
            const updatedSlides = [...presentation.slides];
            updatedSlides[currentSlideIndex] = {
              ...currentSlide,
              layout: layoutType as any,
              content: {
                ...currentSlide.content,
                ...transformed.content,
              },
            };
            
            setPresentation({
              ...presentation,
              slides: updatedSlides,
            });
          }
          setShowLayoutSelector(false);
        }}
        targetBlockId={currentSlide?.id}
      />

      {/* Image Search Modal */}
      <ImageSearchModal
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        onImageSelect={handleAddImage}
        context={currentSlide?.content.body || currentSlide?.content.title}
        themeName={presentation?.theme.name}
      />
    </div>
  );
}

