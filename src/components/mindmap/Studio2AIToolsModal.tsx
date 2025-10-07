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
import { Sparkles, Brain, Link2, MessageSquare, Target, Wand2 } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

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

export default function Studio2AIToolsModal({
  isOpen,
  onClose,
  nodes,
  edges,
  onApplyAI,
}: Studio2AIToolsModalProps) {
  const [goalPrompt, setGoalPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (type: AIAction['type'], data?: any) => {
    setIsLoading(true);
    try {
      await onApplyAI({ type, data });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Mindmap Tools
          </DialogTitle>
        </DialogHeader>

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
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                🧠 Smart Expand All
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                AI analyzes your entire mindmap and intelligently adds 2-3 relevant child nodes to EVERY node. 
                Perfect for quickly fleshing out ideas!
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <ul className="text-sm space-y-1">
                  <li>• 📊 {nodes.length} nodes will be expanded</li>
                  <li>• 🎯 ~{nodes.length * 2.5} new nodes will be created</li>
                  <li>• ⚡ Context-aware suggestions based on existing content</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                onClick={() => handleAction('expand-all')}
                disabled={isLoading || nodes.length === 0}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                🔗 Auto-Connect
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                AI discovers hidden relationships between your nodes and automatically creates smart cross-links. 
                Reveals insights you might have missed!
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 mb-2">What AI will analyze:</p>
                <ul className="text-sm space-y-1">
                  <li>• 🔍 Semantic similarity between nodes</li>
                  <li>• 🎯 Logical dependencies and relationships</li>
                  <li>• 💡 Complementary concepts</li>
                  <li>• 📊 Will suggest {Math.min(5, Math.floor(nodes.length / 2))} new connections</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                onClick={() => handleAction('auto-connect')}
                disabled={isLoading || nodes.length < 3}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-orange-600" />
                ✨ AI Reorganize
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                AI analyzes your mindmap structure and suggests better organization, groupings, and hierarchy. 
                Perfect for cleaning up messy brainstorming!
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 mb-2">AI will:</p>
                <ul className="text-sm space-y-1">
                  <li>• 🏗️ Analyze current structure and content</li>
                  <li>• 🎯 Group related nodes into milestones</li>
                  <li>• 📊 Suggest optimal hierarchy</li>
                  <li>• ✅ Apply best layout for clarity</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                onClick={() => handleAction('reorganize')}
                disabled={isLoading || nodes.length < 5}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-pink-600" />
                🎯 Goal-Oriented Generation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
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
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">AI will generate:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 📋 Main phases/milestones</li>
                    <li>• ✅ Detailed tasks and sub-tasks</li>
                    <li>• 🔗 Dependencies and relationships</li>
                    <li>• 🎯 Organized in logical hierarchy</li>
                  </ul>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white"
                  onClick={() => handleAction('goal-generate', { goal: goalPrompt })}
                  disabled={isLoading || !goalPrompt.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                📊 Quality Audit
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get a comprehensive AI analysis of your mindmap structure, completeness, and quality. 
                Receive actionable suggestions for improvement!
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 mb-2">Audit includes:</p>
                <ul className="text-sm space-y-1">
                  <li>• 🔍 Structure analysis (orphaned nodes, depth, balance)</li>
                  <li>• 💡 Content quality assessment</li>
                  <li>• ❓ Missing topics identification</li>
                  <li>• 📈 Quality score (0-100)</li>
                  <li>• ✅ Specific improvement suggestions</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                onClick={() => handleAction('quality-audit')}
                disabled={isLoading || nodes.length === 0}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
