import React, { createContext, useContext, ReactNode } from 'react';
import { Editor } from '@tiptap/react';

interface EditorContextValue {
  editor: Editor | null;
  documentId: string;
  documentTitle: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ 
  children, 
  value 
}: { 
  children: ReactNode;
  value: EditorContextValue;
}) {
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  
  return context;
}

