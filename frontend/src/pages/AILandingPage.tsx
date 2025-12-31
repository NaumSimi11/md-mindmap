/**
 * AILandingPage - Bolt.new / Lovable inspired landing
 * 
 * Features:
 * - Big AI prompt input
 * - Quick action cards (Document/Mindmap/Presentation)
 * - Guest credits system
 * - Example prompts
 * - Smooth animations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';  // 🔥 FIX: Import hook
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Brain,
  Presentation,
  Sparkles,
  ArrowRight,
  Zap,
  Clock,
  Users,
  Check,
  Upload,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai/AIService';
import { MDFileDropZone, type FileAnalysisResult } from '@/components/landing/MDFileDropZone';
import { FileAnalysisResults } from '@/components/landing/FileAnalysisResults';
import { mdFileAnalyzerService, type AnalysisInsights } from '@/services/landing/MDFileAnalyzerService';

type DocumentType = 'markdown' | 'mindmap' | 'presentation';
type InputMode = 'file' | 'text';

export default function AILandingPage() {
  const navigate = useNavigate();
  const { createDocument, refreshDocuments } = useWorkspace();
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [guestCredits, setGuestCredits] = useState(3);
  
  // File analysis state
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysisResult | null>(null);
  const [analysisInsights, setAnalysisInsights] = useState<AnalysisInsights | null>(null);

  // Load guest credits
  useEffect(() => {
    const credits = parseInt(localStorage.getItem('guest-credits-remaining') || '3');
    setGuestCredits(credits);
  }, []);

  // Handle file analysis
  const handleFileAnalyzed = async (result: FileAnalysisResult) => {
    console.log('📄 File analyzed:', result.fileName);
    setIsAnalyzing(true);
    
    try {
      // Generate insights
      const insights = await mdFileAnalyzerService.generateInsights(result, {
        isOnline: true, // TODO: Detect actual online status
        isLoggedIn: false, // TODO: Check auth state
        creditsRemaining: guestCredits,
      });
      
      setFileAnalysis(result);
      setAnalysisInsights(insights);
      console.log('✨ Insights generated:', insights);
    } catch (error) {
      console.error('❌ Failed to generate insights:', error);
      alert('Failed to analyze file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle action selection from file analysis
  const handleFileActionSelect = async (actionId: string) => {
    if (!fileAnalysis || !analysisInsights) return;
    
    console.log('🎯 Action selected:', actionId);
    
    const action = analysisInsights.suggestions.find(s => s.id === actionId);
    if (!action) return;

    setIsGenerating(true);

    try {
      let content: string;
      let title: string;
      let docType: DocumentType;

      // Map action type to document type
      if (action.type === 'mindmap') {
        // Only use credit for AI generation (mindmap)
        if (guestCredits <= 0) {
          alert('Out of free credits! Sign up for unlimited access.');
          navigate('/signup');
          setIsGenerating(false);
          return;
        }

        docType = 'mindmap';
        content = await aiService.generateContent(
          `Convert this markdown into a mindmap:\n\n${fileAnalysis.content}`,
          {
            systemPrompt: `You are a mindmap expert. Create a hierarchical mindmap structure as JSON based on the markdown content. Format:
{
  "nodes": [
    { "id": "1", "type": "mindNode", "data": { "label": "Central Topic" }, "position": { "x": 500, "y": 300 } },
    { "id": "2", "type": "mindNode", "data": { "label": "Subtopic 1" }, "position": { "x": 300, "y": 200 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "type": "smoothstep" }
  ]
}

Generate 5-20 nodes with a clear hierarchy. Position nodes in a radial layout around the center.`,
          }
        );
        title = `Mindmap: ${fileAnalysis.fileName.replace(/\.(md|markdown|txt)$/i, '')}`;

        // Decrement credits
        const newCredits = guestCredits - 1;
        setGuestCredits(newCredits);
        localStorage.setItem('guest-credits-remaining', newCredits.toString());
      } else if (action.type === 'summary') {
        // Summary generation - uses credit
        if (guestCredits <= 0) {
          alert('Out of free credits! Sign up for unlimited access.');
          navigate('/signup');
          setIsGenerating(false);
          return;
        }

        docType = 'markdown';
        content = await aiService.generateContent(
          `Create a concise summary of this markdown content:\n\n${fileAnalysis.content}`,
          {
            systemPrompt: `You are an expert at creating concise, well-structured summaries. Extract key points and present them in clean markdown format.`,
          }
        );
        title = `Summary: ${fileAnalysis.fileName.replace(/\.(md|markdown|txt)$/i, '')}`;

        // Decrement credits
        const newCredits = guestCredits - 1;
        setGuestCredits(newCredits);
        localStorage.setItem('guest-credits-remaining', newCredits.toString());
      } else if (action.type === 'actionItems') {
        // Action items extraction - uses credit
        if (guestCredits <= 0) {
          alert('Out of free credits! Sign up for unlimited access.');
          navigate('/signup');
          setIsGenerating(false);
          return;
        }

        docType = 'markdown';
        content = await aiService.generateContent(
          `Extract all action items, tasks, and TODOs from this content:\n\n${fileAnalysis.content}`,
          {
            systemPrompt: `You are an expert at extracting action items. Create a clean markdown checklist with all tasks found.`,
          }
        );
        title = `Action Items: ${fileAnalysis.fileName.replace(/\.(md|markdown|txt)$/i, '')}`;

        // Decrement credits
        const newCredits = guestCredits - 1;
        setGuestCredits(newCredits);
        localStorage.setItem('guest-credits-remaining', newCredits.toString());
      } else {
        // Document/Editor - NO credit needed (just opens file)
        docType = 'markdown';
        content = fileAnalysis.content; // Use original content as-is
        title = fileAnalysis.fileName.replace(/\.(md|markdown|txt)$/i, '');
      }

      // Create document
      const tempDoc = await createDocument(docType, title, content);

      // Store content in Yjs if markdown
      // 🔥 FIX: Use _init_markdown field (TipTap reads from this, not getText('content'))
      if (docType === 'markdown') {
        const Y = await import('yjs');
        const { IndexeddbPersistence } = await import('y-indexeddb');
        const { markdownToHtml } = await import('@/utils/markdownConversion');
        
        const ydoc = new Y.Doc();
        
        // Convert markdown to HTML for TipTap to parse
        const html = markdownToHtml(content);
        
        // Store in _init_markdown field (TipTap's useTipTapEditor reads this)
        const ytext = ydoc.getText('_init_markdown');
        ytext.insert(0, html);
        
        // 🔥 FIX: Normalize ID to match useYjsDocument hook (strips doc_ prefix)
        const normalizedDocId = tempDoc.id.startsWith('doc_') 
          ? tempDoc.id.slice(4) 
          : tempDoc.id;
        
        const persistence = new IndexeddbPersistence(`mdreader-${normalizedDocId}`, ydoc);
        await new Promise(resolve => persistence.once('synced', resolve));
        persistence.destroy();
      }

      await refreshDocuments();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to appropriate view
      if (docType === 'markdown') {
        navigate(`/workspace/doc/${tempDoc.id}/edit`);
      } else if (docType === 'mindmap') {
        navigate(`/workspace/doc/${tempDoc.id}/mindmap`);
      }
    } catch (error) {
      console.error('❌ Generation failed:', error);
      alert(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    {
      text: "Create a project roadmap for launching a mobile app in Q1 2025",
      type: 'mindmap' as DocumentType,
      icon: '🚀',
    },
    {
      text: "Write meeting notes template with action items and decisions",
      type: 'markdown' as DocumentType,
      icon: '📝',
    },
    {
      text: "Build a pitch deck for an AI-powered productivity tool",
      type: 'presentation' as DocumentType,
      icon: '📊',
    },
    {
      text: "Plan a marketing campaign with timeline and deliverables",
      type: 'mindmap' as DocumentType,
      icon: '📢',
    },
  ];

  const quickActions = [
    {
      type: 'markdown' as DocumentType,
      icon: FileText,
      title: 'Document',
      description: 'Write, edit, and format with AI',
      gradient: 'from-cyan-500 to-blue-600',
      glowColor: 'cyan-500',
      examples: ['Meeting Notes', 'Blog Post', 'PRD'],
    },
    {
      type: 'mindmap' as DocumentType,
      icon: Brain,
      title: 'Mindmap',
      description: 'Brainstorm and visualize ideas',
      gradient: 'from-violet-500 to-indigo-600',
      glowColor: 'violet-500',
      examples: ['Roadmap', 'Strategy', 'Research'],
    },
    {
      type: 'presentation' as DocumentType,
      icon: Presentation,
      title: 'Presentation',
      description: 'Create stunning slide decks',
      gradient: 'from-indigo-500 to-purple-600',
      glowColor: 'indigo-500',
      examples: ['Pitch Deck', 'Report', 'Training'],
    },
  ];

  // Handle opening a file from disk
  const handleOpenFile = async () => {
    console.log('📂 Open File clicked');
    
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      console.log('📄 File selected:', file.name);
      
      try {
        // Read file content
        const content = await file.text();
        console.log('✅ File read:', content.length, 'characters');
        
        // Create document (no AI, no credits used)
        const title = file.name.replace(/\.(md|markdown|txt)$/i, '');
        const doc = await createDocument('markdown', title, content);
        
        // Store content in Yjs document
        // 🔥 FIX: Use _init_markdown field (TipTap reads from this, not getText('content'))
        const Y = await import('yjs');
        const { IndexeddbPersistence } = await import('y-indexeddb');
        const { markdownToHtml } = await import('@/utils/markdownConversion');
        
        const ydoc = new Y.Doc();
        
        // Convert markdown to HTML for TipTap to parse
        const html = markdownToHtml(content);
        
        // Store in _init_markdown field (TipTap's useTipTapEditor reads this)
        const ytext = ydoc.getText('_init_markdown');
        ytext.insert(0, html);
        
        // 🔥 FIX: Normalize ID to match useYjsDocument hook (strips doc_ prefix)
        const normalizedDocId = doc.id.startsWith('doc_') 
          ? doc.id.slice(4) 
          : doc.id;
        
        const persistence = new IndexeddbPersistence(`mdreader-${normalizedDocId}`, ydoc);
        await new Promise(resolve => persistence.once('synced', resolve));
        persistence.destroy();
        
        await refreshDocuments();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        navigate(`/workspace/doc/${doc.id}/edit`);
      } catch (error) {
        console.error('❌ Failed to open file:', error);
        alert(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    // Trigger file picker
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  // Handle starting a blank document
  const handleStartWriting = async () => {
    console.log('✍️ Start Writing clicked');

    try {
      // Check if user already has documents in workspace
      const { offlineDB } = await import('@/services/offline/OfflineDatabase');
      const existingDocs = await offlineDB.documents.count();

      if (existingDocs > 0) {
        // User has existing documents - just navigate to workspace without creating new document
        console.log(`📂 User has ${existingDocs} existing documents, navigating to workspace`);
        navigate('/workspace');
        return;
      }

      // No existing documents - create a blank one
      console.log('📄 No existing documents, creating blank document');
      const doc = await createDocument('markdown', 'Untitled', '');

      // Initialize Yjs document
      const Y = await import('yjs');
      const { IndexeddbPersistence } = await import('y-indexeddb');
      const ydoc = new Y.Doc();

      const persistence = new IndexeddbPersistence(`mdreader-${doc.id}`, ydoc);
      await new Promise(resolve => persistence.once('synced', resolve));
      persistence.destroy();

      await refreshDocuments();
      await new Promise(resolve => setTimeout(resolve, 100));

      navigate(`/workspace/doc/${doc.id}/edit`);
    } catch (error) {
      console.error('❌ Failed to start writing:', error);
      alert(`Failed to start writing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerate = async () => {
    console.log('🚀 Generate button clicked!');
    console.log('Prompt:', prompt);
    console.log('Selected Type:', selectedType);
    console.log('Guest Credits:', guestCredits);
    
    if (!prompt.trim()) {
      console.warn('❌ Missing prompt');
      alert('Please enter a prompt!');
      return;
    }
    if (guestCredits <= 0) {
      alert('Out of free credits! Sign up for unlimited access.');
      return;
    }

    setIsGenerating(true);
    console.log('✨ Starting AI generation...');

    try {
      // Determine document type based on prompt or user selection
      let finalType: DocumentType = selectedType || 'markdown'; // Default to markdown
      
      // If user didn't select a type, analyze the prompt (ONLY explicit requests)
      if (!selectedType) {
        const promptLower = prompt.toLowerCase();
        // Only trigger mindmap if EXPLICITLY asking for visual/mindmap format
        if (promptLower.includes('as a mindmap') || promptLower.includes('create a mindmap') || promptLower.includes('generate mindmap') || promptLower.includes('mind map') || promptLower.includes('visualize as')) {
          finalType = 'mindmap';
        } 
        // Only trigger presentation if EXPLICITLY asking for slides
        else if (promptLower.includes('presentation') || promptLower.includes('slides') || promptLower.includes('pitch deck') || promptLower.includes('slide deck')) {
          finalType = 'presentation';
        }
        // Everything else = document (default)
        console.log('🤖 AI detected type:', finalType);
      }

      // Generate content with AI
      let content: string;
      let title: string;

      if (finalType === 'markdown') {
        // Generate markdown document
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are an expert writer. Create a well-structured markdown document based on the user's request. Use proper headings, lists, and formatting.`,
        });
        title = prompt.substring(0, 50);
      } else if (finalType === 'mindmap') {
        // Generate mindmap structure
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are a mindmap expert. Create a hierarchical mindmap structure as JSON based on the user's request. 
        
Format:
{
  "nodes": [
    { "id": "1", "type": "mindNode", "data": { "label": "Central Topic" }, "position": { "x": 500, "y": 300 } },
    { "id": "2", "type": "mindNode", "data": { "label": "Subtopic 1" }, "position": { "x": 300, "y": 200 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "type": "smoothstep" }
  ]
}

Generate 5-10 nodes with a clear hierarchy. Position nodes in a radial layout around the center.`,
        });
        title = `Mindmap: ${prompt.substring(0, 40)}`;
      } else {
        // Generate presentation
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are a presentation expert. Create a slide deck structure as JSON based on the user's request.
        
Format:
{
  "title": "Presentation Title",
  "slides": [
    { "layout": "title", "content": { "title": "Main Title", "subtitle": "Subtitle" }, "order": 0 },
    { "layout": "content", "content": { "title": "Slide Title", "body": "Content here..." }, "order": 1 }
  ]
}

Create 5-8 slides with varied layouts: title, content, bullets, diagram.`,
        });
        title = `Presentation: ${prompt.substring(0, 40)}`;
      }

      console.log('✅ Content generated:', content.substring(0, 100) + '...');

      // Create temporary guest document
      const tempDoc = await createDocument(
        finalType,
        title,
        content
      );

      // Store content in Yjs if markdown
      // 🔥 FIX: Use _init_markdown field (TipTap reads from this, not getText('content'))
      if (finalType === 'markdown') {
        const Y = await import('yjs');
        const { IndexeddbPersistence } = await import('y-indexeddb');
        const { markdownToHtml } = await import('@/utils/markdownConversion');
        
        const ydoc = new Y.Doc();
        
        // Convert markdown to HTML for TipTap to parse
        const html = markdownToHtml(content);
        
        // Store in _init_markdown field (TipTap's useTipTapEditor reads this)
        const ytext = ydoc.getText('_init_markdown');
        ytext.insert(0, html);
        
        // 🔥 FIX: Normalize ID to match useYjsDocument hook (strips doc_ prefix)
        const normalizedDocId = tempDoc.id.startsWith('doc_') 
          ? tempDoc.id.slice(4) 
          : tempDoc.id;
        
        const persistence = new IndexeddbPersistence(`mdreader-${normalizedDocId}`, ydoc);
        await new Promise(resolve => persistence.once('synced', resolve));
        persistence.destroy();
      }

      // Decrement guest credits
      const newCredits = guestCredits - 1;
      setGuestCredits(newCredits);
      localStorage.setItem('guest-credits-remaining', newCredits.toString());

      await refreshDocuments();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to workspace with appropriate view
      if (finalType === 'markdown') {
        navigate(`/workspace/doc/${tempDoc.id}/edit`);
      } else if (finalType === 'mindmap') {
        navigate(`/workspace/doc/${tempDoc.id}/mindmap`);
      } else {
        navigate(`/workspace/doc/${tempDoc.id}/slides`);
      }
    } catch (error) {
      console.error('❌ Generation failed:', error);
      alert(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      console.log('🏁 Generation complete');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      {/* Animated background with modern colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft cyan glow - top right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full filter blur-[120px] animate-blob"></div>
        {/* Purple accent - bottom left */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-violet-600/20 rounded-full filter blur-[120px] animate-blob animation-delay-2000"></div>
        {/* Indigo center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/15 rounded-full filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
              MindFlow AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-cyan-200/90 font-medium">
              ✨ {guestCredits} free generations
            </div>
            <Button 
              variant="outline" 
              className="border-white/20 hover:bg-white/10 text-white"
              onClick={() => navigate('/workspace')}
            >
              Open Workspace
            </Button>
            <Button 
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25"
              onClick={() => navigate('/pricing')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
              Transform Ideas into Action
            </span>
            <br />
            <span className="text-4xl bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Instantly with AI
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Drop a markdown file or describe what you want to create.
            <br />
            <span className="text-cyan-300/90">Documents, mindmaps, and presentations</span> in seconds.
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1.5 bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <button
              onClick={() => {
                setInputMode('file');
                setFileAnalysis(null);
                setAnalysisInsights(null);
              }}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm',
                inputMode === 'file'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <Upload className="h-4 w-4" />
              Drop File
            </button>
            <button
              onClick={() => {
                setInputMode('text');
                setFileAnalysis(null);
                setAnalysisInsights(null);
              }}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm',
                inputMode === 'text'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <Type className="h-4 w-4" />
              Type Prompt
            </button>
          </div>
        </div>

        {/* Main Input Area */}
        <div className="mb-8">
          {inputMode === 'file' ? (
            <>
              {/* File Drop Zone */}
              {!fileAnalysis && (
                <MDFileDropZone
                  onFileAnalyzed={handleFileAnalyzed}
                  isAnalyzing={isAnalyzing}
                />
              )}

              {/* Analysis Results */}
              {fileAnalysis && analysisInsights && (
                <FileAnalysisResults
                  fileAnalysis={fileAnalysis}
                  insights={analysisInsights}
                  onActionSelect={handleFileActionSelect}
                  guestCredits={guestCredits}
                />
              )}
            </>
          ) : (
            <>
              {/* Type Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-400">
                    {selectedType ? (
                      <span className="text-cyan-400">✓ Will create: {selectedType === 'markdown' ? 'Document' : selectedType === 'mindmap' ? 'Mindmap' : 'Presentation'}</span>
                    ) : (
                      <span>Choose format (optional - defaults to Document)</span>
                    )}
                  </h3>
                  {selectedType && (
                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const isSelected = selectedType === action.type;
                    
                    return (
                      <button
                        key={action.type}
                        onClick={() => setSelectedType(action.type)}
                        className={`
                          p-3 rounded-xl border-2 transition-all duration-200 text-left
                          ${
                            isSelected
                              ? 'border-cyan-500/50 bg-slate-800/60 scale-[1.02]'
                              : 'border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/70 hover:border-slate-500'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-8 h-8 bg-gradient-to-r ${action.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-bold text-base" style={{ color: '#ffffff' }}>{action.title}</span>
                          {isSelected && <span className="ml-auto text-cyan-400 font-bold">✓</span>}
                        </div>
                        <p className="text-xs ml-10" style={{ color: '#cbd5e1' }}>{action.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Prompt Area */}
              <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-2xl shadow-cyan-500/10">
                <textarea
                  placeholder="Describe what you want to create... (e.g., 'Create a project roadmap for launching a mobile app')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full min-h-32 bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-lg resize-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 focus-visible:outline-none"
                  style={{ 
                    color: '#ffffff',
                    backgroundColor: 'rgba(51, 65, 85, 0.4)',
                  }}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-400">
                      {prompt.length} / 500 characters
                    </span>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating || guestCredits <= 0}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold px-8 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate with AI
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="mt-6">
                <p className="text-sm text-slate-400 mb-3">✨ Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(example.text);
                        setSelectedType(example.type);
                      }}
                      className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg text-sm text-slate-300 transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      {example.icon} {example.text.substring(0, 50)}...
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alternative Path: Manual Start */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-slate-300">or skip AI generation</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Primary Actions: Open File & Start Writing */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={handleOpenFile}
                className="border-slate-600 hover:bg-slate-800/50 hover:border-cyan-500/50 text-white px-8"
              >
                <Upload className="h-5 w-5 mr-2" />
                Open .md File
              </Button>
              
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white px-8 shadow-lg shadow-cyan-500/25"
                onClick={handleStartWriting}
              >
                <Type className="h-5 w-5 mr-2" />
                Start Writing
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            
            <p className="text-sm text-slate-400">
              No login required • Works offline • Your data stays local
            </p>
          </div>
        </div>


        {/* Features */}
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Lightning Fast</h4>
            <p className="text-sm text-slate-400">Generate content in seconds</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-indigo-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Save Hours</h4>
            <p className="text-sm text-slate-400">10x faster than manual work</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-violet-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Collaborate</h4>
            <p className="text-sm text-slate-400">Share and work together</p>
          </div>
        </div>
      </main>

      {/* Styles for animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Force textarea text to be white */
        textarea {
          color: #ffffff !important;
        }
        textarea::placeholder {
          color: #94a3b8 !important;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

