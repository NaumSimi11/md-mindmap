/**
 * AILandingPage - Redesigned with Mindbraining & Hyper Influence Power Theme
 * 
 * Design Principles:
 * - Modernistic: Clean, contemporary, cutting-edge
 * - Simplicity: Minimal, uncluttered, focused
 * - Realistic: Authentic, genuine, not over-the-top
 * - Hyper Influence Power: Bold, confident, authoritative
 * - Mindbraining: Brain/mind-focused visuals, neural networks, cognitive themes
 */

import { useState, useEffect, useRef } from 'react';
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
  Network,
  Target,
  TrendingUp,
} from 'lucide-react';
import { aiService } from '@/services/ai/AIService';
import { workspaceService } from '@/services/workspace/WorkspaceService';

type DocumentType = 'markdown' | 'mindmap' | 'presentation';

export default function AILandingPageRedesigned() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guestCredits, setGuestCredits] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load guest credits
  useEffect(() => {
    const credits = parseInt(localStorage.getItem('guest-credits-remaining') || '3');
    setGuestCredits(credits);
  }, []);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Neural network nodes
    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const nodeCount = 50;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.fill();

        // Draw connections
        nodes.forEach((other) => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const examplePrompts = [
    {
      text: "Create a project roadmap for launching a mobile app in Q1 2025",
      type: 'mindmap' as DocumentType,
      icon: '🧠',
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
  ];

  const quickActions = [
    {
      type: 'markdown' as DocumentType,
      icon: FileText,
      title: 'Document',
      description: 'Write with precision',
      gradient: 'from-purple-500 to-indigo-600',
      glowColor: 'purple-500',
    },
    {
      type: 'mindmap' as DocumentType,
      icon: Brain,
      title: 'Mindmap',
      description: 'Visualize thoughts',
      gradient: 'from-indigo-500 to-purple-600',
      glowColor: 'indigo-500',
    },
    {
      type: 'presentation' as DocumentType,
      icon: Presentation,
      title: 'Presentation',
      description: 'Present powerfully',
      gradient: 'from-violet-500 to-purple-600',
      glowColor: 'violet-500',
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }
    if (guestCredits <= 0) {
      alert('Out of free credits! Sign up for unlimited access.');
      return;
    }

    setIsGenerating(true);

    try {
      let finalType: DocumentType = selectedType || 'markdown';
      
      if (!selectedType) {
        const promptLower = prompt.toLowerCase();
        if (promptLower.includes('as a mindmap') || promptLower.includes('create a mindmap') || promptLower.includes('mind map') || promptLower.includes('visualize as')) {
          finalType = 'mindmap';
        } else if (promptLower.includes('presentation') || promptLower.includes('slides') || promptLower.includes('pitch deck')) {
          finalType = 'presentation';
        }
      }

      let content: string;
      let title: string;

      if (finalType === 'markdown') {
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are an expert writer. Create a well-structured markdown document based on the user's request. Use proper headings, lists, and formatting.`,
        });
        title = prompt.substring(0, 50);
      } else if (finalType === 'mindmap') {
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are a mindmap expert. Create a hierarchical mindmap structure as JSON based on the user's request.`,
        });
        title = `Mindmap: ${prompt.substring(0, 40)}`;
      } else {
        content = await aiService.generateContent(prompt, {
          systemPrompt: `You are a presentation expert. Create a slide deck structure as JSON based on the user's request.`,
        });
        title = `Presentation: ${prompt.substring(0, 40)}`;
      }

      const tempDoc = await workspaceService.createDocument(
        finalType,
        title,
        content,
        null
      );

      const newCredits = guestCredits - 1;
      setGuestCredits(newCredits);
      localStorage.setItem('guest-credits-remaining', newCredits.toString());

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
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
      {/* Neural Network Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Subtle gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-950/20 via-transparent to-indigo-950/20" />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header - Minimal & Powerful */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-md bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold text-white drop-shadow-lg">MindFlow</span>
              <span className="text-xs text-purple-100 ml-2 font-semibold drop-shadow-md">AI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="h-3 w-3 text-purple-300" />
              <span className="text-sm text-purple-200 font-medium">{guestCredits} credits</span>
            </div>
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/5"
              onClick={() => navigate('/workspace')}
            >
              Workspace
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 border-0"
              onClick={() => navigate('/pricing')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Bold & Focused */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        {/* Main Headline - Hyper Influence Power */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Network className="h-4 w-4 text-purple-300" />
            <span className="text-sm text-purple-200 font-medium">Powered by Neural AI</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-6 leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-100 to-indigo-100 bg-clip-text text-transparent">
              Think.
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Create.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              Influence.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-4">
            The only tool that transforms your thoughts into
            <span className="text-purple-300 font-semibold"> documents</span>,
            <span className="text-indigo-300 font-semibold"> mindmaps</span>, and
            <span className="text-purple-300 font-semibold"> presentations</span>
            <br />
            <span className="text-slate-300 text-lg">All in one powerful platform.</span>
          </p>
        </div>

        {/* Type Selector - Clean & Simple */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedType === action.type;
              
              return (
                <button
                  key={action.type}
                  onClick={() => setSelectedType(action.type)}
                  className={`
                    group relative px-6 py-4 rounded-xl border-2 transition-all duration-300
                    ${isSelected
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25 scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-purple-200' : 'text-slate-200'}`}>
                      {action.title}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Input - Powerful & Focused */}
        <div className="mb-8">
          <div className="relative bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/15 p-8 shadow-2xl">
            {/* Brain icon decoration */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>

            <textarea
              placeholder="Describe what you want to create... (e.g., 'Create a project roadmap for launching a mobile app')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
              className="w-full min-h-40 bg-slate-800/40 border border-white/15 rounded-xl px-6 py-4 text-lg resize-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 focus-visible:outline-none text-slate-100 placeholder:text-slate-400"
            />
            
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">
                  {prompt.length} / 500
                </span>
                <span className="text-xs text-slate-400">
                  Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">⌘</kbd> + <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Enter</kbd> to generate
                </span>
              </div>
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || guestCredits <= 0}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Example Prompts - Minimal */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {examplePrompts.map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(example.text);
                  setSelectedType(example.type);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg text-sm text-slate-200 transition-all hover:scale-105"
              >
                {example.icon} {example.text.substring(0, 45)}...
              </button>
            ))}
          </div>
        </div>

        {/* Power Features - Simple Grid */}
        <div className="grid grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <Target className="h-8 w-8 text-purple-300" />
            </div>
            <h4 className="font-bold mb-2 text-white">Precision</h4>
            <p className="text-sm text-slate-300">AI-powered accuracy</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Network className="h-8 w-8 text-indigo-300" />
            </div>
            <h4 className="font-bold mb-2 text-white">Intelligence</h4>
            <p className="text-sm text-slate-300">Neural network powered</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
              <TrendingUp className="h-8 w-8 text-purple-300" />
            </div>
            <h4 className="font-bold mb-2 text-white">Influence</h4>
            <p className="text-sm text-slate-300">Create with impact</p>
          </div>
        </div>
      </main>

      {/* Styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

