import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string, style: 'solid' | 'regular' | 'brands') => void;
}

// Popular icons organized by category
const ICON_CATEGORIES = {
  popular: [
    'check', 'star', 'heart', 'fire', 'lightbulb', 'rocket', 'trophy', 'bolt',
    'circle-check', 'circle-xmark', 'thumbs-up', 'thumbs-down', 'flag', 'bookmark'
  ],
  arrows: [
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
    'angle-right', 'angle-left', 'angle-up', 'angle-down',
    'circle-arrow-right', 'circle-arrow-left', 'circle-arrow-up', 'circle-arrow-down'
  ],
  symbols: [
    'check', 'xmark', 'plus', 'minus', 'equals', 'exclamation', 'question',
    'circle-check', 'circle-xmark', 'circle-plus', 'circle-minus',
    'triangle-exclamation', 'circle-exclamation', 'circle-info',
    'ban', 'stop', 'play', 'pause', 'forward', 'backward'
  ],
  business: [
    'briefcase', 'building', 'chart-line', 'chart-bar', 'money-bill',
    'file', 'file-lines', 'folder', 'folder-open', 'calendar',
    'clock', 'envelope', 'phone', 'fax', 'print'
  ],
  communication: [
    'comment', 'comment-dots', 'comments', 'message', 'envelope',
    'paper-plane', 'inbox', 'phone', 'mobile', 'video',
    'bell', 'bullhorn', 'rss', 'wifi', 'signal'
  ],
  media: [
    'image', 'images', 'camera', 'video', 'film', 'photo-film',
    'music', 'headphones', 'microphone', 'volume-high', 'volume-low',
    'play', 'pause', 'stop', 'forward', 'backward'
  ],
  ui: [
    'bars', 'ellipsis', 'ellipsis-vertical', 'grip', 'grip-vertical',
    'magnifying-glass', 'filter', 'sliders', 'gear', 'wrench',
    'user', 'users', 'user-group', 'home', 'dashboard'
  ],
  emotions: [
    'face-smile', 'face-frown', 'face-meh', 'face-laugh', 'face-grin',
    'face-sad-tear', 'face-angry', 'face-surprise', 'face-kiss', 'face-heart',
    'heart', 'heart-crack', 'star', 'fire', 'thumbs-up', 'thumbs-down'
  ],
  brands: [
    'github', 'twitter', 'facebook', 'linkedin', 'instagram', 'youtube',
    'google', 'apple', 'microsoft', 'amazon', 'slack', 'discord',
    'reddit', 'tiktok', 'spotify', 'netflix', 'paypal', 'stripe'
  ]
};

export function IconPickerModal({ isOpen, onClose, onSelectIcon }: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'solid' | 'regular' | 'brands'>('solid');

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchQuery) {
      return selectedStyle === 'brands' ? ICON_CATEGORIES.brands : ICON_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    
    if (selectedStyle === 'brands') {
      return ICON_CATEGORIES.brands.filter(icon => icon.includes(query));
    }

    const filtered: Record<string, string[]> = {};
    Object.entries(ICON_CATEGORIES).forEach(([category, icons]) => {
      if (category === 'brands') return; // Skip brands in solid/regular
      const matches = icons.filter(icon => icon.includes(query));
      if (matches.length > 0) {
        filtered[category] = matches;
      }
    });
    return filtered;
  }, [searchQuery, selectedStyle]);

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName, selectedStyle);
    onClose();
    setSearchQuery(''); // Reset search
  };

  const renderIconGrid = (icons: string[]) => (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
      {icons.map((iconName) => {
        const prefix = selectedStyle === 'brands' ? 'fab' : selectedStyle === 'regular' ? 'far' : 'fas';
        return (
          <Button
            key={iconName}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-accent hover:scale-105 transition-all"
            onClick={() => handleSelectIcon(iconName)}
            title={iconName}
          >
            <i className={`${prefix} fa-${iconName} text-2xl`} />
            <span className="text-xs truncate max-w-full">{iconName.split('-')[0]}</span>
          </Button>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-icons text-primary" />
            Insert Icon
          </DialogTitle>
          <DialogDescription>
            Choose from 2000+ FontAwesome icons. Click any icon to insert it into your document.
          </DialogDescription>
        </DialogHeader>

        {/* Style Tabs */}
        <Tabs value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solid">
              <i className="fas fa-circle mr-2" />
              Solid
            </TabsTrigger>
            <TabsTrigger value="regular">
              <i className="far fa-circle mr-2" />
              Regular
            </TabsTrigger>
            <TabsTrigger value="brands">
              <i className="fab fa-github mr-2" />
              Brands
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search icons... (e.g., 'star', 'check', 'heart')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Icon Grid */}
          <div className="overflow-y-auto flex-1 mt-4 pr-2" style={{ maxHeight: 'calc(80vh - 250px)' }}>
            <TabsContent value="solid" className="space-y-6 mt-0">
              {searchQuery ? (
                // Show filtered results
                Object.keys(filteredIcons).length > 0 ? (
                  Object.entries(filteredIcons).map(([category, icons]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 capitalize text-muted-foreground">
                        {category} ({(icons as string[]).length})
                      </h3>
                      {renderIconGrid(icons as string[])}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-search text-4xl mb-2" />
                    <p>No icons found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                )
              ) : (
                // Show all categories
                Object.entries(ICON_CATEGORIES).map(([category, icons]) => {
                  if (category === 'brands') return null;
                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 capitalize text-muted-foreground">
                        {category} ({icons.length})
                      </h3>
                      {renderIconGrid(icons)}
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="regular" className="space-y-6 mt-0">
              {searchQuery ? (
                Object.keys(filteredIcons).length > 0 ? (
                  Object.entries(filteredIcons).map(([category, icons]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 capitalize text-muted-foreground">
                        {category} ({(icons as string[]).length})
                      </h3>
                      {renderIconGrid(icons as string[])}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="far fa-search text-4xl mb-2" />
                    <p>No icons found for "{searchQuery}"</p>
                  </div>
                )
              ) : (
                Object.entries(ICON_CATEGORIES).map(([category, icons]) => {
                  if (category === 'brands') return null;
                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 capitalize text-muted-foreground">
                        {category} ({icons.length})
                      </h3>
                      {renderIconGrid(icons)}
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="brands" className="mt-0">
              {searchQuery ? (
                (filteredIcons as string[]).length > 0 ? (
                  renderIconGrid(filteredIcons as string[])
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fab fa-searchengin text-4xl mb-2" />
                    <p>No brand icons found for "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Popular Brands ({ICON_CATEGORIES.brands.length})
                  </h3>
                  {renderIconGrid(ICON_CATEGORIES.brands)}
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Looking for more? Search above or visit{' '}
                    <a
                      href="https://fontawesome.com/search?o=r&m=free&f=brands"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      FontAwesome.com
                    </a>
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            💡 Tip: You can also type <code className="bg-muted px-1 py-0.5 rounded">:fa-icon-name:</code> directly in markdown
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

