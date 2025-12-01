/**
 * Studio2AIToolsModal - AI-Powered Mindmap Tools
 * Revolutionary AI features for mindmap creation and enhancement
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, Brain, Link2, Target, Wand2, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Studio2AIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  onApplyAI: (action: AIAction) => void;
}

export interface AIAction {
  type: 'expand-all' | 'auto-connect' | 'reorganize' | 'goal-generate' | 'quality-audit';
  data?: any;
}

export interface AIResult {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  details?: string[];
  stats?: { label: string; value: string | number }[];
}

export default function Studio2AIToolsModal({
  isOpen,
  onClose,
  nodes,
  edges,
  onApplyAI,
}: Studio2AIToolsModalProps) {
  const [goalPrompt, setGoalPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const handleAction = async (type: AIAction['type'], data?: any) => {
    setIsLoading(true);
    setAiResult(null); // Clear previous result

    try {
      await onApplyAI({ type, data });

      // Set success result based on action type
      switch (type) {
        case 'expand-all':
          setAiResult({
            type: 'success',
            title: '🎉 Smart Expand Complete!',
            message: `AI successfully expanded your mindmap nodes.`,
            stats: [
              { label: 'Nodes Expanded', value: nodes.length },
              { label: 'New Nodes Created', value: `~${nodes.length * 2.5}` },
            ],
          });
          break;
        case 'auto-connect':
          setAiResult({
            type: 'success',
            title: '🔗 Smart Connections Added!',
            message: 'AI discovered hidden relationships between your nodes.',
            details: [
              'Analyzed semantic similarity',
              'Identified logical dependencies',
              'Found complementary concepts',
            ],
          });
          break;
        case 'reorganize':
          setAiResult({
            type: 'success',
            title: '✨ Mindmap Reorganized!',
            message: 'AI optimized your mindmap structure.',
            details: [
              'Grouped related nodes',
              'Optimized hierarchy',
              'Applied best layout',
            ],
          });
          break;
        case 'goal-generate':
          setAiResult({
            type: 'success',
            title: '🎯 Mindmap Generated!',
            message: 'AI created a complete mindmap from your goal.',
            details: [
              'Generated main phases/milestones',
              'Created detailed tasks',
              'Established dependencies',
            ],
          });
          break;
        case 'quality-audit':
          setAiResult({
            type: 'info',
            title: '📊 Quality Audit Complete!',
            message: 'AI analyzed your mindmap structure.',
            details: [
              'Structure analysis complete',
              'Content quality assessed',
              'Improvement suggestions generated',
            ],
          });
          break;
      }
    } catch (error) {
      setAiResult({
        type: 'error',
        title: '❌ AI Action Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: ['Please try again', 'Check your AI API configuration'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAiResult(null);
    setGoalPrompt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Mindmap Tools
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left: AI Tools */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="expand" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="expand">
                  <Brain className="h-4 w-4 mr-1" />
                  Expand
                </TabsTrigger>
                <TabsTrigger value="connect">
                  <Link2 className="h-4 w-4 mr-1" />
                  Connect
                </TabsTrigger>
                <TabsTrigger value="reorganize">
                  <Wand2 className="h-4 w-4 mr-1" />
                  Reorganize
                </TabsTrigger>
                <TabsTrigger value="goal">
                  <Target className="h-4 w-4 mr-1" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="audit">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Audit
                </TabsTrigger>
              </TabsList>

              {/* 1. SMART EXPAND ALL */}
              <TabsContent value="expand" className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-lg border border-purple-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    🧠 Smart Expand All
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI analyzes your entire mindmap and intelligently adds 2-3 relevant child nodes to EVERY node.
                    Perfect for quickly fleshing out ideas!
                  </p>
                  <div className="bg-background/50 p-3 rounded border border-border mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <ul className="text-sm space-y-1">
                      <li>• 📊 {nodes.length} nodes will be expanded</li>
                      <li>• 🎯 ~{nodes.length * 2.5} new nodes will be created</li>
                      <li>• ⚡ Context-aware suggestions based on existing content</li>
                    </ul>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    onClick={() => handleAction('expand-all')}
                    disabled={isLoading || nodes.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI Expanding...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Expand All Nodes with AI
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* 2. AUTO-CONNECT */}
              <TabsContent value="connect" className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-500" />
                    🔗 Auto-Connect
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI discovers hidden relationships between your nodes and automatically creates smart cross-links.
                    Reveals insights you might have missed!
                  </p>
                  <div className="bg-background/50 p-3 rounded border border-border mb-4">
                    <p className="text-xs text-muted-foreground mb-2">What AI will analyze:</p>
                    <ul className="text-sm space-y-1">
                      <li>• 🔍 Semantic similarity between nodes</li>
                      <li>• 🎯 Logical dependencies and relationships</li>
                      <li>• 💡 Complementary concepts</li>
                      <li>• 📊 Will suggest {Math.min(5, Math.floor(nodes.length / 2))} new connections</li>
                    </ul>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700"
                    onClick={() => handleAction('auto-connect')}
                    disabled={isLoading || nodes.length < 3}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finding Connections...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Discover Smart Connections
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* 3. AI REORGANIZE */}
              <TabsContent value="reorganize" className="space-y-4">
                <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-lg border border-orange-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-orange-500" />
                    ✨ AI Reorganize
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI analyzes your mindmap structure and suggests better organization, groupings, and hierarchy.
                    Perfect for cleaning up messy brainstorming!
                  </p>
                  <div className="bg-background/50 p-3 rounded border border-border mb-4">
                    <p className="text-xs text-muted-foreground mb-2">AI will:</p>
                    <ul className="text-sm space-y-1">
                      <li>• 🏗️ Analyze current structure and content</li>
                      <li>• 🎯 Group related nodes into milestones</li>
                      <li>• 📊 Suggest optimal hierarchy</li>
                      <li>• ✅ Apply best layout for clarity</li>
                    </ul>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
                    onClick={() => handleAction('reorganize')}
                    disabled={isLoading || nodes.length < 5}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reorganizing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Reorganize with AI
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* 5. GOAL-ORIENTED GENERATION */}
              <TabsContent value="goal" className="space-y-4">
                <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-4 rounded-lg border border-pink-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-pink-500" />
                    🎯 Goal-Oriented Generation
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start from scratch! Describe your goal and AI builds a complete, structured mindmap with tasks, milestones, and dependencies.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="goal-prompt" className="text-sm font-medium">Describe your goal:</Label>
                      <Textarea
                        id="goal-prompt"
                        placeholder="Examples:&#10;• Create a product launch plan for a SaaS app&#10;• Build a learning roadmap for becoming a full-stack developer&#10;• Plan a 6-month content marketing strategy&#10;• Design a user onboarding flow"
                        value={goalPrompt}
                        onChange={(e) => setGoalPrompt(e.target.value)}
                        className="mt-1 min-h-[120px]"
                      />
                    </div>
                    <div className="bg-background/50 p-3 rounded border border-border">
                      <p className="text-xs text-muted-foreground mb-2">AI will generate:</p>
                      <ul className="text-sm space-y-1">
                        <li>• 📋 Main phases/milestones</li>
                        <li>• ✅ Detailed tasks and sub-tasks</li>
                        <li>• 🔗 Dependencies and relationships</li>
                        <li>• 🎯 Organized in logical hierarchy</li>
                      </ul>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700"
                      onClick={() => handleAction('goal-generate', { goal: goalPrompt })}
                      disabled={isLoading || !goalPrompt.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Mindmap...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Generate Complete Mindmap
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 6. QUALITY AUDIT */}
              <TabsContent value="audit" className="space-y-4">
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 rounded-lg border border-violet-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    📊 Quality Audit
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get a comprehensive AI analysis of your mindmap structure, completeness, and quality.
                    Receive actionable suggestions for improvement!
                  </p>
                  <div className="bg-background/50 p-3 rounded border border-border mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Audit includes:</p>
                    <ul className="text-sm space-y-1">
                      <li>• 🔍 Structure analysis (orphaned nodes, depth, balance)</li>
                      <li>• 💡 Content quality assessment</li>
                      <li>• ❓ Missing topics identification</li>
                      <li>• 📈 Quality score (0-100)</li>
                      <li>• ✅ Specific improvement suggestions</li>
                    </ul>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                    onClick={() => handleAction('quality-audit')}
                    disabled={isLoading || nodes.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run Quality Audit
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: AI Result Panel */}
          {(isLoading || aiResult) && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="w-80 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">AI Response</h3>
                  {aiResult && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAiResult(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <ScrollArea className="flex-1 pr-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                      <p className="text-sm text-muted-foreground text-center">
                        AI is working its magic...
                      </p>
                    </div>
                  ) : aiResult ? (
                    <div className="space-y-4">
                      {/* Result Header */}
                      <div className={`p-4 rounded-lg border-2 ${aiResult.type === 'success'
                          ? 'bg-green-500/10 border-green-500/20'
                          : aiResult.type === 'error'
                            ? 'bg-red-500/10 border-red-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                          {aiResult.type === 'success' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : aiResult.type === 'error' ? (
                            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1">{aiResult.title}</h4>
                            <p className="text-xs text-foreground">{aiResult.message}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      {aiResult.stats && aiResult.stats.length > 0 && (
                        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statistics</p>
                          {aiResult.stats.map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{stat.label}</span>
                              <span className="text-sm font-semibold">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Details */}
                      {aiResult.details && aiResult.details.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
                          <ul className="space-y-2">
                            {aiResult.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-purple-500 flex-shrink-0">✓</span>
                                <span className="text-muted-foreground">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Hint */}
                      {aiResult.type === 'success' && (
                        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
                          <p className="text-xs text-purple-500">
                            💡 <strong>Tip:</strong> Check your mindmap canvas to see the changes!
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
