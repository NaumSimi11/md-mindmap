import React, { useState, useRef } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ImageInsertPopoverProps {
    onInsert: (url: string) => void;
    children: React.ReactNode;
}

export const ImageInsertPopover: React.FC<ImageInsertPopoverProps> = ({
    onInsert,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onInsert(url);
            setIsOpen(false);
            setUrl('');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // Simulate upload - in a real app this would upload to server/S3
        // For now we'll use FileReader to get a base64 string or object URL
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                onInsert(result);
                setIsOpen(false);
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side="left"
                align="start"
                className="w-80 p-0 bg-card/98 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl overflow-hidden"
            >
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none bg-muted/50 p-0 h-10">
                        <TabsTrigger
                            value="upload"
                            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger
                            value="url"
                            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            URL
                        </TabsTrigger>
                    </TabsList>

                    <div className="p-4">
                        <TabsContent value="upload" className="mt-0 space-y-4">
                            <div
                                className="
                  border-2 border-dashed border-border hover:border-primary/50 
                  rounded-lg p-8 
                  flex flex-col items-center justify-center gap-2
                  cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40
                "
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                )}
                                <div className="text-sm text-muted-foreground text-center">
                                    {isUploading ? 'Uploading...' : 'Click to upload image'}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Supports JPG, PNG, GIF, WEBP
                            </p>
                        </TabsContent>

                        <TabsContent value="url" className="mt-0 space-y-4">
                            <form onSubmit={handleUrlSubmit} className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl" className="text-xs">Image URL</Label>
                                    <Input
                                        id="imageUrl"
                                        placeholder="https://example.com/image.jpg"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-9" disabled={!url.trim()}>
                                    Insert Image
                                </Button>
                            </form>
                        </TabsContent>
                    </div>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
};
