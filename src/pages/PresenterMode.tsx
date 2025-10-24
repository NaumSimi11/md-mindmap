/**
 * PresenterMode - Full-screen presentation with speaker notes
 * 
 * Features:
 * - Full-screen slide display
 * - Speaker notes panel
 * - Keyboard navigation (arrows, space, escape)
 * - Timer (elapsed time)
 * - Slide counter
 * - Clean, minimal UI
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SlideRenderer } from '@/components/presentation/SlideRenderer';
import { workspaceService } from '@/services/workspace/WorkspaceService';
import type { Presentation, Slide } from '@/services/presentation/PresentationGenerator';

export default function PresenterMode() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Determine the actual presentation ID from URL
  const getActualPresentationId = (): string | null => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Check if we're in workspace context
    if (pathParts[0] === 'workspace' && pathParts[1] === 'doc') {
      return pathParts[2] || null; // /workspace/doc/{id}/present
    }
    
    // Otherwise use the presentationId param
    return presentationId || null; // /presentation/{id}/present
  };

  const actualId = getActualPresentationId();

  // Load presentation
  useEffect(() => {
    if (actualId) {
      // Try workspace first (for new flow)
      const workspaceDoc = workspaceService.getDocument(actualId);
      if (workspaceDoc && workspaceDoc.type === 'presentation') {
        try {
          const parsed = JSON.parse(workspaceDoc.content);
          setPresentation(parsed);
          console.log('✅ Loaded presentation from workspace for presenting:', parsed.title);
          return;
        } catch (e) {
          console.error('Failed to parse workspace presentation:', e);
        }
      }
      
      // Fallback to localStorage (for old flow)
      const saved = localStorage.getItem(`presentation-${actualId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPresentation(parsed);
        console.log('✅ Loaded presentation from localStorage for presenting:', parsed.title);
      } else {
        console.error('❌ Presentation not found:', actualId);
        navigate('/workspace');
      }
    }
  }, [actualId, navigate]);

  // Timer - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        exitPresenterMode();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (presentation) {
          setCurrentSlideIndex(presentation.slides.length - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, presentation]);

  const nextSlide = () => {
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const exitPresenterMode = () => {
    // Check if we're in workspace context
    if (actualId && location.pathname.includes('/workspace/')) {
      // Go back to slides editor in workspace
      navigate(`/workspace/doc/${actualId}/slides`);
    } else {
      // Fallback to old standalone route
      navigate(`/presentation/${presentationId}/edit`);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!presentation) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>Loading presentation...</p>
      </div>
    );
  }

  const currentSlide = presentation.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Main Slide Area (80% height) */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentSlide && (
          <div className="w-full max-w-7xl">
            <SlideRenderer
              slide={currentSlide}
              theme={presentation.theme}
              isEditing={false}
            />
          </div>
        )}
      </div>

      {/* Speaker Notes Panel (20% height) */}
      <div className="h-[20vh] bg-gray-900 text-white border-t border-gray-700">
        <div className="h-full flex items-center justify-between p-6">
          {/* Speaker Notes (Left side) */}
          <div className="flex-1 pr-8">
            <p className="text-xs text-gray-400 mb-2 font-semibold">📝 SPEAKER NOTES:</p>
            <p className="text-base text-gray-200 leading-relaxed">
              {currentSlide?.speakerNotes || 'No notes for this slide.'}
            </p>
          </div>

          {/* Controls (Right side) */}
          <div className="flex items-center gap-6 ml-6 flex-shrink-0">
            {/* Timer */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">⏱️ TIME</p>
              <p className="text-2xl font-mono font-bold text-white">
                {formatTime(elapsedTime)}
              </p>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gray-700" />

            {/* Slide Counter */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">📊 SLIDE</p>
              <p className="text-2xl font-mono font-bold text-white">
                {currentSlideIndex + 1} / {presentation.slides.length}
              </p>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gray-700" />

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={nextSlide}
                disabled={currentSlideIndex === presentation.slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gray-700" />

            {/* Exit Button */}
            <Button
              size="sm"
              variant="outline"
              className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
              onClick={exitPresenterMode}
            >
              <X className="h-4 w-4 mr-2" />
              Exit (ESC)
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint (fades out after 3 seconds) */}
      <KeyboardHints />
    </div>
  );
}

// Keyboard shortcuts hint component
function KeyboardHints() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000); // Fade out after 4 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white text-sm animate-in fade-in slide-in-from-top duration-500">
      <p className="font-semibold mb-2">⌨️ Keyboard Shortcuts:</p>
      <ul className="space-y-1 text-xs text-gray-300">
        <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> - Next slide</li>
        <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> - Previous slide</li>
        <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> - Exit presenter mode</li>
        <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Home</kbd> - First slide</li>
        <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded">End</kbd> - Last slide</li>
      </ul>
    </div>
  );
}

