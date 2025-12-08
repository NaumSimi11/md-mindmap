/**
 * Workspace Test Page
 * Test backend integration
 */

import { useBackendWorkspace } from '@/hooks/useBackendWorkspace';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';

export default function WorkspaceTest() {
  const { 
    workspace, 
    documents, 
    isLoading, 
    error,
    createDocument,
    deleteDocument,
    getWorkspaceStats,
  } = useBackendWorkspace();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTest = async () => {
    setIsCreating(true);
    try {
      await createDocument(
        'markdown', 
        `Test Document ${Date.now()}`, 
        '# Hello from Backend!\n\nThis document is stored in PostgreSQL!'
      );
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this document?')) {
      await deleteDocument(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg">Loading workspace from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Error</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = getWorkspaceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">
            🎉 {workspace?.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Connected to PostgreSQL Database
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</div>
              <div className="text-sm text-blue-600/70">Documents</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.markdownDocs}</div>
              <div className="text-sm text-purple-600/70">Markdown</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{workspace?.id.slice(0, 8)}...</div>
              <div className="text-sm text-green-600/70">Workspace ID</div>
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateTest}
            disabled={isCreating}
            className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Test Document (Saves to Database!)
              </>
            )}
          </Button>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold mb-4">
            📄 Documents from Database
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No documents yet. Create one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-slate-500">
                      <span>ID: {doc.id.slice(0, 12)}...</span>
                      <span>Created: {new Date(doc.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>This is real data!</strong> Refresh the page and your documents will still be here. 
            They're stored in PostgreSQL, not LocalStorage!
          </p>
        </div>
      </div>
    </div>
  );
}

