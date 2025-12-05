/**
 * ImageSearchModal - AI-powered image search for presentations
 * 
 * Features:
 * - Search Unsplash images
 * - AI-suggested images based on content
 * - Theme-matched images
 * - Click to insert into slide
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { unsplashService, type ImageSearchResult } from '@/services/media/UnsplashService';

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (imageUrl: string) => void;
  context?: string; // AI context for suggestions
  themeName?: string;
}

export function ImageSearchModal({
  open,
  onOpenChange,
  onImageSelect,
  context,
  themeName,
}: ImageSearchModalProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load AI-suggested or themed images on open
  useEffect(() => {
    if (open) {
      loadInitialImages();
    }
  }, [open, context, themeName]);

  const loadInitialImages = async () => {
    setIsLoading(true);
    try {
      let results: ImageSearchResult[];
      
      if (context) {
        // AI-suggested based on content
        results = await unsplashService.getAISuggestedImages(context);
      } else if (themeName) {
        // Theme-matched images
        results = await unsplashService.getThemedImages(themeName);
      } else {
        // Random high-quality images
        results = await unsplashService.getRandomImages(12);
      }
      
      setImages(results);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await unsplashService.searchImages(query, 12);
      setImages(results);
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleInsert = () => {
    if (selectedImage) {
      console.log('✅ Inserting image:', selectedImage);
      onImageSelect(selectedImage);
      onOpenChange(false);
      setSelectedImage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Add Image
          </DialogTitle>
          <DialogDescription>
            Search for high-quality images or use AI-suggested images
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for images..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleImageClick(image.url)}
                  className={`
                    relative aspect-video rounded-lg overflow-hidden
                    transition-all duration-200
                    ${selectedImage === image.url
                      ? 'ring-4 ring-primary scale-95'
                      : 'hover:scale-105 hover:shadow-lg'
                    }
                  `}
                >
                  <img
                    src={image.thumbnail}
                    alt={image.description}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with author */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-xs text-white truncate">
                      by {image.author}
                    </p>
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedImage === image.url && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Images provided by Unsplash
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={!selectedImage}>
              Insert Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

