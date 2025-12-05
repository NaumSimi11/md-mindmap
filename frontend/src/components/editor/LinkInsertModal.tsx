import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon } from 'lucide-react';

interface LinkInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string, text?: string) => void;
    initialText?: string;
    initialUrl?: string;
}

export const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
    isOpen,
    onClose,
    onInsert,
    initialText = '',
    initialUrl = '',
}) => {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
            setText(initialText);
        }
    }, [isOpen, initialText, initialUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onInsert(url, text);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" />
                        Insert Link
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                            id="link-url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            autoFocus
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link-text">Text (optional)</Label>
                        <Input
                            id="link-text"
                            placeholder="Link text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!url.trim()}>
                            Insert Link
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
