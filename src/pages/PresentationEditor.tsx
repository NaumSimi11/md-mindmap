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
import { workspaceService } from '@/services/workspace/WorkspaceService';
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
} from 'lucide-react';
import { presentationGenerator, type Presentation, type Slide } from '@/services/presentation/PresentationGenerator';
import { SlideRenderer } from '@/components/presentation/SlideRenderer';
import { PresentationSidebar } from '@/components/presentation/PresentationSidebar';

export default function PresentationEditor() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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

    setPresentation(updatedPresentation);
    savePresentationToStorage(updatedPresentation);
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToEditor}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">{presentation.title}</h1>
            <p className="text-xs text-muted-foreground">
              {presentation.slides.length} slides • {presentation.theme.name} theme
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
            onClick={handlePresent}
          >
            <Play className="h-4 w-4 mr-2" />
            Present
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Slide List */}
        <PresentationSidebar
          slides={presentation.slides}
          currentIndex={currentSlideIndex}
          theme={presentation.theme}
          onSlideSelect={setCurrentSlideIndex}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onDuplicateSlide={handleDuplicateSlide}
        />

        {/* Main Canvas: Current Slide */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          {currentSlide ? (
            <div className="w-full max-w-5xl">
              {/* Slide Number */}
              <div className="text-sm text-muted-foreground mb-4 text-center">
                Slide {currentSlideIndex + 1} of {presentation.slides.length}
              </div>

              {/* Slide Renderer */}
              <SlideRenderer
                slide={currentSlide}
                theme={presentation.theme}
                isEditing={true}
                onUpdate={handleUpdateSlide}
              />

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentSlideIndex + 1} / {presentation.slides.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentSlideIndex(
                      Math.min(presentation.slides.length - 1, currentSlideIndex + 1)
                    )
                  }
                  disabled={currentSlideIndex === presentation.slides.length - 1}
                >
                  Next →
                </Button>
              </div>

              {/* Speaker Notes */}
              {currentSlide.speakerNotes && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">
                    📝 Speaker Notes:
                  </p>
                  <p className="text-sm text-yellow-800">{currentSlide.speakerNotes}</p>
                </div>
              )}
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
    </div>
  );
}

