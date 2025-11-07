/**
 * FloatingToolbar - Right-side floating toolbar for presentation editing
 * 
 * Icon-only design with tooltips, Gamma-style
 */

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Layout,
  Image,
  Palette,
  Type,
  Sparkles,
  Share2,
  Download,
  Settings,
  Play,
  ArrowLeft,
  Save,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface FloatingToolbarProps {
  onBackClick?: () => void;
  onSaveClick?: () => void;
  onLayoutClick: () => void;
  onImageClick: () => void;
  onThemeClick?: () => void;
  onAIClick?: () => void;
  onPresentClick?: () => void;
  onShareClick?: () => void;
  onExportClick?: () => void;
  onSettingsClick?: () => void;
  onPreviousSlide?: () => void;
  onNextSlide?: () => void;
  onSpeakerNotesClick?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export function FloatingToolbar({
  onBackClick,
  onSaveClick,
  onLayoutClick,
  onImageClick,
  onThemeClick,
  onAIClick,
  onPresentClick,
  onShareClick,
  onExportClick,
  onSettingsClick,
  onPreviousSlide,
  onNextSlide,
  onSpeakerNotesClick,
  canGoPrevious = true,
  canGoNext = true,
}: FloatingToolbarProps) {
  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 animate-in slide-in-from-right duration-500"
      style={{
        background: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(24px) saturate(150%)',
        borderRadius: '16px',
        padding: '10px 8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <TooltipProvider>
        <div className="flex flex-col gap-2">
          {/* Back Button - TOP */}
          {onBackClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBackClick}
                  className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-violet-400/20"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                  }}
                >
                  <ArrowLeft className="h-4 w-4 group-hover:scale-105 transition-transform group-hover:-translate-x-0.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Back</p>
                <p className="text-xs text-gray-400 mt-0.5">Return to editor</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Save Button */}
          {onSaveClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSaveClick}
                  className="hover:bg-emerald-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-emerald-400/20"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <Save className="h-4 w-4 group-hover:scale-105 transition-transform" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Save</p>
                <p className="text-xs text-gray-400 mt-0.5">Save changes</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Divider after save */}
          <div 
            className="h-px my-3"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)',
            }}
          />

          {/* Layouts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLayoutClick}
                className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-violet-400/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Layout className="h-4 w-4 group-hover:scale-105 transition-transform" />
              </Button>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
            >
              <p className="font-medium">Change Layout</p>
              <p className="text-xs text-gray-400 mt-0.5">Transform your content</p>
            </TooltipContent>
          </Tooltip>

          {/* Images */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onImageClick}
                className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-violet-400/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Image className="h-4 w-4 group-hover:scale-105 transition-transform" />
              </Button>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
            >
              <p className="font-medium">Add Image</p>
              <p className="text-xs text-gray-400 mt-0.5">AI-powered search</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div 
            className="h-px my-2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
            }}
          />

          {/* Theme */}
          {onThemeClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onThemeClick}
                  className="hover:bg-white/20 text-white h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Palette className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Change Theme</p>
                <p className="text-xs text-gray-400 mt-0.5">Beautiful designs</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* AI Assistant */}
          {onAIClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAIClick}
                  className="hover:bg-violet-500/30 text-white h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group relative border border-transparent hover:border-violet-400/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Sparkles className="h-4 w-4 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">AI Assistant</p>
                <p className="text-xs text-gray-400 mt-0.5">Smart suggestions</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Divider */}
          <div 
            className="h-px my-2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
            }}
          />

          {/* Present - BIG BUTTON */}
          {onPresentClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPresentClick}
                  className="hover:bg-violet-500/40 text-white h-12 w-12 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl group relative border border-violet-400/40"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(236, 72, 153, 0.35))',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  <Play className="h-5 w-5 group-hover:scale-105 transition-transform fill-white drop-shadow-lg" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/30 to-pink-400/30 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Present</p>
                <p className="text-xs text-gray-400 mt-0.5">Start presentation mode</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Divider */}
          <div 
            className="h-px my-2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
            }}
          />

          {/* Export */}
          {onExportClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportClick}
                  className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-violet-400/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Download className="h-4 w-4 group-hover:scale-105 transition-transform group-hover:-translate-y-0.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Export</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, PPTX, Web</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Divider - Navigation Section */}
          <div 
            className="h-px my-2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
            }}
          />

          {/* Previous Slide */}
          {onPreviousSlide && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPreviousSlide}
                  disabled={!canGoPrevious}
                  className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-violet-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <ChevronLeft className="h-5 w-5 group-hover:scale-105 transition-transform group-hover:-translate-x-0.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Previous Slide</p>
                <p className="text-xs text-gray-400 mt-0.5">Navigate back</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Next Slide */}
          {onNextSlide && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNextSlide}
                  disabled={!canGoNext}
                  className="hover:bg-violet-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-violet-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <ChevronRight className="h-5 w-5 group-hover:scale-105 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Next Slide</p>
                <p className="text-xs text-gray-400 mt-0.5">Navigate forward</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Speaker Notes */}
          {onSpeakerNotesClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSpeakerNotesClick}
                  className="hover:bg-amber-500/30 text-white h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-amber-400/30"
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                  }}
                >
                  <FileText className="h-4 w-4 group-hover:scale-105 transition-transform" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Speaker Notes</p>
                <p className="text-xs text-gray-400 mt-0.5">View presentation notes</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Share */}
          {onShareClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onShareClick}
                  className="hover:bg-white/20 text-white h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform group-hover:rotate-12" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Share</p>
                <p className="text-xs text-gray-400 mt-0.5">Collaborate with team</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Settings */}
          {onSettingsClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsClick}
                  className="hover:bg-white/20 text-white h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group"
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Settings className="h-5 w-5 group-hover:scale-110 transition-transform group-hover:rotate-90" />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-gray-900 border-gray-700 text-white px-3 py-2 rounded-lg shadow-xl"
              >
                <p className="font-medium">Settings</p>
                <p className="text-xs text-gray-400 mt-0.5">Configure options</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}

