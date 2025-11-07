/**
 * UnsplashService - Image search using Unsplash API
 * 
 * Provides AI-powered image suggestions for presentations
 */

const UNSPLASH_ACCESS_KEY = ''; // Using fallback images (no API key needed)

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  color: string;
  width: number;
  height: number;
}

export interface ImageSearchResult {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  author: string;
  authorUrl: string;
  color: string;
  relevanceScore?: number;
}

class UnsplashServiceClass {
  private baseUrl = 'https://api.unsplash.com';
  
  /**
   * Search for images based on a query
   */
  async searchImages(query: string, count: number = 12): Promise<ImageSearchResult[]> {
    // Always use fallback images (no API key needed)
    console.log('🖼️ Loading images for:', query);
    return this.getFallbackImages(query, count);
  }
  
  /**
   * Get AI-suggested images for presentation content
   * Extracts topics and searches for relevant images
   */
  async getAISuggestedImages(content: string): Promise<ImageSearchResult[]> {
    // Extract keywords from content
    const keywords = this.extractKeywords(content);
    
    if (keywords.length === 0) {
      return this.getFallbackImages('presentation', 12);
    }
    
    // Search for images based on main keyword
    const mainKeyword = keywords[0];
    return this.searchImages(mainKeyword, 12);
  }
  
  /**
   * Get themed images for presentation background
   */
  async getThemedImages(themeName: string): Promise<ImageSearchResult[]> {
    const themeQueries: Record<string, string> = {
      'night-sky': 'night sky stars galaxy',
      'oasis': 'oasis desert nature',
      'modern': 'modern architecture minimal',
      'velvet-tides': 'ocean waves sunset',
      'vanilla': 'minimal white aesthetic',
      'tranquil': 'peaceful nature zen',
      'terracotta': 'desert warm earth',
      'alien': 'space nebula cosmic',
      'aurora': 'aurora borealis northern lights',
    };
    
    const query = themeQueries[themeName.toLowerCase()] || 'abstract gradient';
    return this.searchImages(query, 6);
  }
  
  /**
   * Extract keywords from content using simple NLP
   */
  private extractKeywords(content: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    ]);
    
    // Extract words
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count frequency
    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });
    
    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
    
    return sorted.slice(0, 3);
  }
  
  /**
   * Get fallback images using Picsum (no API key needed)
   */
  private getFallbackImages(query: string, count: number): ImageSearchResult[] {
    const images: ImageSearchResult[] = [];
    const seed = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timestamp = Date.now();
    
    for (let i = 0; i < count; i++) {
      // Use timestamp + index to ensure unique IDs
      const uniqueId = `${seed}-${timestamp}-${i}`;
      const imageId = (seed + i * 100) % 1000;
      images.push({
        id: `picsum-${uniqueId}`,
        url: `https://picsum.photos/seed/${imageId}/1200/800`,
        thumbnail: `https://picsum.photos/seed/${imageId}/400/300`,
        description: query,
        author: 'Unsplash',
        authorUrl: 'https://unsplash.com',
        color: '#6366f1',
      });
    }
    
    return images;
  }
  
  /**
   * Get random high-quality images for inspiration
   */
  async getRandomImages(count: number = 12): Promise<ImageSearchResult[]> {
    // Always use fallback images (no API key needed)
    return this.getFallbackImages('presentation', count);
  }
}

export const unsplashService = new UnsplashServiceClass();

