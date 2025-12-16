import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useYjsDocument } from '@/hooks/useYjsDocument';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import type { WebsocketProvider } from 'y-websocket';

interface YjsEditorProps {
  documentId: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onProviderReady?: (provider: WebsocketProvider | null) => void;
}

export function YjsEditor({ documentId, onTitleChange, onContentChange, onProviderReady }: YjsEditorProps) {
  const { ydoc, synced, online, websocketProvider } = useYjsDocument(documentId);
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (onProviderReady) {
      onProviderReady(websocketProvider);
    }
  }, [websocketProvider, onProviderReady]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        link: false, // Disable to avoid duplicates
        history: false, // Yjs provides history
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
    ],
    
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const firstLine = text.split('\n')[0];
      
      // Store in Yjs
      const ytext = ydoc.getText('content');
      const currentYText = ytext.toString();
      
      if (currentYText !== html) {
        ydoc.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, html);
        });
      }
      
      if (firstLine && onTitleChange) {
        onTitleChange(firstLine);
      }
      
      if (onContentChange) {
        onContentChange(html);
      }
    },
  });
  
  // Load initial content from Yjs
  useEffect(() => {
    if (!editor || !synced) return;
    
    const ytext = ydoc.getText('content');
    const content = ytext.toString();
    
    if (content && editor.isEmpty) {
      editor.commands.setContent(content);
    }
  }, [editor, ydoc, synced]);
  
  // Save metadata to backend
  useEffect(() => {
    if (!editor) return;
    
    const yMetadata = ydoc.getMap('metadata');
    
    const observer = () => {
      const title = yMetadata.get('title');
      if (title && onTitleChange) {
        onTitleChange(title as string);
      }
    };
    
    yMetadata.observe(observer);
    
    return () => {
      yMetadata.unobserve(observer);
    };
  }, [editor, ydoc, onTitleChange]);
  
  return (
    <div className="relative">
      {/* Status Indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-sm">
        {!online && (
          <span className="flex items-center gap-1 text-amber-600">
            📴 Offline
          </span>
        )}
        
        {online && !isAuthenticated && (
          <span className="flex items-center gap-1 text-blue-600">
            💾 Local Only
          </span>
        )}
        
        {online && isAuthenticated && synced && (
          <span className="flex items-center gap-1 text-green-600">
            ✅ Synced
          </span>
        )}
        
        {online && isAuthenticated && !synced && (
          <span className="flex items-center gap-1 text-amber-600">
            ⏳ Syncing...
          </span>
        )}
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} className="prose max-w-none" />
    </div>
  );
}

function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

