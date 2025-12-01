import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Upload, Link as LinkIcon, Loader2, X } from 'lucide-react';

interface ImageInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
    isOpen,
    onClose,
    onInsert,
}) => {
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onInsert(url);
            onClose();
            setUrl('');
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                onInsert(result);
                onClose();
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Insert Image
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="upload" className="w-full mt-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="upload">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="url">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            From URL
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4 space-y-4">
                        <div
                            className={`
                border-2 border-dashed rounded-xl p-8
                flex flex-col items-center justify-center gap-4
                cursor-pointer transition-all duration-200
                ${dragActive
                                    ? 'border-primary bg-primary/5 scale-[1.02]'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                }
              `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="text-sm font-medium text-muted-foreground">Processing image...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max 10MB)</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4 space-y-4">
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="image-url">Image URL</Label>
                                <div className="relative">
                                    <Input
                                        id="image-url"
                                        placeholder="https://example.com/image.jpg"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="pl-9"
                                    />
                                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={!url.trim()}>
                                Insert Image
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
