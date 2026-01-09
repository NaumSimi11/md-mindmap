/**
 * WorkspaceDemo - Test page for workspace components
 * 
 * This is a temporary demo page to test the workspace sidebar and new document modal.
 * Once tested, the components will be integrated into the main AppLayout.
 */

import { useState } from 'react';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { FileText, Brain, Presentation, Sparkles, CheckCircle2 } from 'lucide-react';
import { workspaceService } from '@/services/workspace-legacy/WorkspaceService';

export default function WorkspaceDemo() {
  const [currentDocId, setCurrentDocId] = useState<string>();
  const [currentDoc, setCurrentDoc] = useState<any>(null);

  const handleDocumentSelect = (documentId: string) => {
    // Load the actual document from workspace service
    const doc = workspaceService.getDocument(documentId);
    
    if (doc) {
      setCurrentDocId(documentId);
      setCurrentDoc(doc);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'mindmap':
        return <Brain className="h-5 w-5 text-purple-500" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-pink-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="h-screen flex">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar
        onDocumentSelect={handleDocumentSelect}
        currentDocumentId={currentDocId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Demo Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Workspace Demo
              </h1>
              <p className="text-sm text-muted-foreground">
                Testing the new document modal and workspace sidebar
              </p>
            </div>
            <div className="text-xs text-right text-muted-foreground">
              <p className="font-mono">/workspace-demo</p>
              <p className="mt-1">🧪 Test Mode</p>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>👉 Try this:</strong> Click <strong>"New Doc"</strong> in the sidebar → Browse templates → Click to preview → Create!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {currentDoc ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                {getDocumentIcon(currentDoc.type)}
                <div>
                  <h2 className="text-xl font-bold">{currentDoc.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    ID: {currentDoc.id} • Type: {currentDoc.type}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 max-h-96 overflow-auto">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">CONTENT PREVIEW</h3>
                {currentDoc.type === 'markdown' ? (
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {currentDoc.content.substring(0, 1000)}
                    {currentDoc.content.length > 1000 && '\n\n... (content truncated)'}
                  </pre>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                    {JSON.stringify(JSON.parse(currentDoc.content), null, 2).substring(0, 500)}...
                  </pre>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                      ✅ Document loaded successfully!
                    </p>
                    <p className="text-xs text-blue-800">
                      In the real app, this would open the Editor, Mindmap Studio, or Presentation Editor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Document Selected</h2>
              <p className="text-muted-foreground mb-6">
                Select a document from the sidebar or create a new one
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                <div className="p-6 border border-border rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">Click "New Doc"</p>
                  <p className="text-xs text-muted-foreground mt-1">Choose from 8 templates</p>
                </div>
                <div className="p-6 border border-border rounded-lg">
                  <Brain className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">Create Mindmap</p>
                  <p className="text-xs text-muted-foreground mt-1">Start brainstorming</p>
                </div>
                <div className="p-6 border border-border rounded-lg">
                  <Presentation className="h-8 w-8 text-pink-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">Start Presentation</p>
                  <p className="text-xs text-muted-foreground mt-1">Build slides</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-yellow-900">
                  <strong>🧪 Demo Mode</strong>
                  <br />
                  This page is for testing. Once verified, these components will be integrated into the main app.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

