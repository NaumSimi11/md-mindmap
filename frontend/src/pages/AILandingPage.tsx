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
} from 'lucide-react';
import { aiService } from '@/services/ai/AIService';
import { workspaceService } from '@/services/workspace/WorkspaceService';

type DocumentType = 'markdown' | 'mindmap' | 'presentation';

export default function AILandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guestCredits, setGuestCredits] = useState(3);

  // Load guest credits
  useEffect(() => {
    const credits = parseInt(localStorage.getItem('guest-credits-remaining') || '3');
    setGuestCredits(credits);
  }, []);

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
      const tempDoc = await workspaceService.createDocument(
        finalType,
        title,
        content,
        null // No folder for guest
      );

      console.log('📄 Document created:', tempDoc.id, 'Type:', finalType);

      // Decrement guest credits
      const newCredits = guestCredits - 1;
      setGuestCredits(newCredits);
      localStorage.setItem('guest-credits-remaining', newCredits.toString());

      console.log('💳 Credits remaining:', newCredits);

      // Navigate to workspace with appropriate view
      if (finalType === 'markdown') {
        console.log('📝 Navigating to Workspace Editor...');
        navigate(`/workspace/doc/${tempDoc.id}/edit`);
      } else if (finalType === 'mindmap') {
        console.log('🧠 Navigating to Workspace Mindmap...');
        navigate(`/workspace/doc/${tempDoc.id}/mindmap`);
      } else {
        console.log('📊 Navigating to Workspace Presentation...');
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
            Describe what you want to create, and watch AI bring it to life.
            <br />
            <span className="text-cyan-300/90">Documents, mindmaps, and presentations</span> in seconds.
          </p>
        </div>

        {/* Type Selector (Above Input) */}
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

        {/* Main Prompt Area */}
        <div className="mb-8">
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
                {!selectedType && prompt.trim() && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <span>⚠️</span> Select a document type below
                  </span>
                )}
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
          
          <div className="mt-8">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-slate-600 hover:bg-slate-800/50 hover:border-cyan-500/50 text-white px-8"
            >
              <FileText className="h-5 w-5 mr-2" />
              Start Working Manually
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-slate-400 mt-3">
              Open editor, browse templates, or organize your documents
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

