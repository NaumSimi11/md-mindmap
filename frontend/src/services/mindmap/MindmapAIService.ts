/**
 * MindmapAIService - Context-aware AI for mindmap operations
 * Understands full document context and existing structure
 */

import { aiService } from "@/services/ai/AIService";

export interface MindmapContext {
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    level?: number;
    parent?: string;
    description?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
  documentContext?: string; // Original markdown or text
}

export interface AIGenerationOptions {
  count?: number; // Number of nodes to generate
  depth?: number; // Depth of expansion
  style?: 'concise' | 'detailed' | 'creative';
  focus?: string; // Specific aspect to focus on
}

export class MindmapAIService {
  /**
   * Generate child nodes for a specific node with full context awareness
   */
  async generateChildNodes(
    parentNodeId: string,
    context: MindmapContext,
    options: AIGenerationOptions = {}
  ): Promise<Array<{ label: string; description?: string }>> {
    const parentNode = context.nodes.find(n => n.id === parentNodeId);
    if (!parentNode) {
      throw new Error(`Parent node ${parentNodeId} not found`);
    }

    const count = options.count ?? 3;
    const style = options.style ?? 'concise';
    
    // Build context-aware prompt
    const existingStructure = this.buildStructureDescription(context);
    const siblingNodes = this.getSiblingNodes(parentNodeId, context);
    const ancestorPath = this.getAncestorPath(parentNodeId, context);

    const prompt = `You are a mindmap expansion expert. Generate ${count} child nodes for a mindmap.

**CONTEXT:**
${context.documentContext ? `Original Content:\n${context.documentContext.slice(0, 500)}...\n\n` : ''}
Mindmap Title: "${context.title}"
Total Nodes: ${context.nodes.length}

**PARENT NODE:**
${ancestorPath.length > 0 ? `Path: ${ancestorPath.join(' → ')} → ` : ''}**${parentNode.label}**
${parentNode.description ? `Description: ${parentNode.description}\n` : ''}

**EXISTING STRUCTURE:**
${existingStructure}

${siblingNodes.length > 0 ? `**SIBLING NODES (already exist, don't duplicate):**
${siblingNodes.map(s => `- ${s.label}`).join('\n')}

` : ''}**TASK:**
Generate ${count} ${style} child nodes for "${parentNode.label}" that:
1. Are logically connected to the parent
2. Don't duplicate existing siblings
3. Fit the overall mindmap structure
4. ${options.focus ? `Focus specifically on: ${options.focus}` : 'Cover different aspects/sub-topics'}

**OUTPUT FORMAT (JSON array):**
[
  {
    "label": "Child Node 1",
    "description": "Brief 1-sentence description"
  },
  ...
]

Generate ONLY the JSON array, no other text.`;

    try {
      const response = await aiService.generateContent(prompt, {
        temperature: style === 'creative' ? 0.8 : 0.5,
        maxTokens: 500,
      });

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ Failed to parse AI response:', response);
        throw new Error('Invalid AI response format');
      }

      const children = JSON.parse(jsonMatch[0]);
      console.log(`✨ Generated ${children.length} child nodes for "${parentNode.label}"`);
      return children;
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a complete mindmap from scratch with context
   */
  async generateMindmapFromPrompt(
    prompt: string,
    documentContext?: string,
    options: AIGenerationOptions = {}
  ): Promise<MindmapContext> {
    const depth = options.depth ?? 2;
    const style = options.style ?? 'detailed';

    const aiPrompt = `You are a mindmap creation expert. Create a comprehensive mindmap structure.

**USER REQUEST:**
${prompt}

${documentContext ? `**DOCUMENT CONTEXT:**
${documentContext.slice(0, 1000)}...

` : ''}**TASK:**
Create a ${style} mindmap with ${depth} levels of depth that covers:
- Main concepts and themes
- Logical sub-topics and relationships
- Actionable items where relevant

**OUTPUT FORMAT (JSON):**
{
  "title": "Mindmap Title",
  "nodes": [
    {
      "id": "root",
      "label": "Root Node",
      "description": "Brief description",
      "level": 0
    },
    {
      "id": "child1",
      "label": "Child 1",
      "description": "Brief description",
      "level": 1,
      "parent": "root"
    }
  ],
  "edges": [
    { "source": "root", "target": "child1" }
  ]
}

Generate a well-structured mindmap with at least ${depth} levels. Output ONLY the JSON, no other text.`;

    try {
      const response = await aiService.generateContent(aiPrompt, {
        temperature: style === 'creative' ? 0.8 : 0.5,
        maxTokens: 1500,
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ Failed to parse AI response:', response);
        throw new Error('Invalid AI response format');
      }

      const mindmap = JSON.parse(jsonMatch[0]) as MindmapContext;
      console.log(`✨ Generated mindmap with ${mindmap.nodes.length} nodes`);
      return mindmap;
    } catch (error) {
      console.error('❌ AI mindmap generation failed:', error);
      throw error;
    }
  }

  /**
   * Enhance/refine an existing node with AI
   */
  async enhanceNode(
    nodeId: string,
    context: MindmapContext,
    enhancementType: 'label' | 'description' | 'both' = 'both'
  ): Promise<{ label?: string; description?: string }> {
    const node = context.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const ancestorPath = this.getAncestorPath(nodeId, context);
    
    const prompt = `You are a mindmap refinement expert. Enhance this node.

**MINDMAP CONTEXT:**
Title: "${context.title}"
Path: ${ancestorPath.join(' → ')}${ancestorPath.length > 0 ? ' → ' : ''}**${node.label}**

**CURRENT NODE:**
Label: "${node.label}"
${node.description ? `Description: "${node.description}"` : 'Description: (none)'}

**TASK:**
${enhancementType === 'label' ? 'Improve the label to be clearer and more professional.' : ''}
${enhancementType === 'description' ? 'Write a concise 1-2 sentence description.' : ''}
${enhancementType === 'both' ? 'Improve both the label and description.' : ''}

**OUTPUT FORMAT (JSON):**
{
  ${enhancementType !== 'description' ? '"label": "Enhanced Label",' : ''}
  ${enhancementType !== 'label' ? '"description": "Enhanced description."' : ''}
}

Output ONLY the JSON, no other text.`;

    try {
      const response = await aiService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 200,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const enhanced = JSON.parse(jsonMatch[0]);
      console.log(`✨ Enhanced node "${node.label}"`);
      return enhanced;
    } catch (error) {
      console.error('❌ Node enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Suggest connections between existing nodes
   */
  async suggestConnections(
    context: MindmapContext,
    maxSuggestions: number = 5
  ): Promise<Array<{ source: string; target: string; reason: string }>> {
    const structureDesc = this.buildStructureDescription(context);

    const prompt = `You are a mindmap structure expert. Analyze this mindmap and suggest meaningful connections.

**MINDMAP:**
Title: "${context.title}"
Nodes: ${context.nodes.length}

**STRUCTURE:**
${structureDesc}

**EXISTING CONNECTIONS:**
${context.edges.map(e => {
  const source = context.nodes.find(n => n.id === e.source);
  const target = context.nodes.find(n => n.id === e.target);
  return `${source?.label} → ${target?.label}`;
}).join('\n')}

**TASK:**
Suggest up to ${maxSuggestions} NEW connections that:
1. Are semantically meaningful
2. Don't duplicate existing connections
3. Add value to understanding relationships

**OUTPUT FORMAT (JSON):**
[
  {
    "source": "node-id-1",
    "target": "node-id-2",
    "reason": "Brief reason for connection"
  }
]

Available node IDs: ${context.nodes.map(n => `"${n.id}"`).join(', ')}

Output ONLY the JSON array, no other text.`;

    try {
      const response = await aiService.generateContent(prompt, {
        temperature: 0.4,
        maxTokens: 600,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      console.log(`✨ Generated ${suggestions.length} connection suggestions`);
      return suggestions;
    } catch (error) {
      console.error('❌ Connection suggestion failed:', error);
      throw error;
    }
  }

  // --- Helper Methods ---

  private buildStructureDescription(context: MindmapContext): string {
    // Build a tree representation
    const rootNodes = context.nodes.filter(n => 
      !context.edges.some(e => e.target === n.id)
    );

    const buildTree = (nodeId: string, indent: number = 0): string => {
      const node = context.nodes.find(n => n.id === nodeId);
      if (!node) return '';

      const children = context.edges
        .filter(e => e.source === nodeId)
        .map(e => e.target);

      let result = `${'  '.repeat(indent)}- ${node.label}`;
      if (node.description) {
        result += ` (${node.description.slice(0, 50)}${node.description.length > 50 ? '...' : ''})`;
      }
      result += '\n';

      children.forEach(childId => {
        result += buildTree(childId, indent + 1);
      });

      return result;
    };

    return rootNodes.map(n => buildTree(n.id)).join('\n');
  }

  private getSiblingNodes(nodeId: string, context: MindmapContext): Array<{ id: string; label: string }> {
    // Find parent
    const parentEdge = context.edges.find(e => e.target === nodeId);
    if (!parentEdge) return [];

    // Find all children of parent (siblings)
    const siblings = context.edges
      .filter(e => e.source === parentEdge.source && e.target !== nodeId)
      .map(e => context.nodes.find(n => n.id === e.target))
      .filter(Boolean) as Array<{ id: string; label: string }>;

    return siblings;
  }

  private getAncestorPath(nodeId: string, context: MindmapContext): string[] {
    const path: string[] = [];
    let currentId = nodeId;

    while (true) {
      const parentEdge = context.edges.find(e => e.target === currentId);
      if (!parentEdge) break;

      const parent = context.nodes.find(n => n.id === parentEdge.source);
      if (!parent) break;

      path.unshift(parent.label);
      currentId = parent.id;
    }

    return path;
  }
}

// Export singleton
export const mindmapAIService = new MindmapAIService();
