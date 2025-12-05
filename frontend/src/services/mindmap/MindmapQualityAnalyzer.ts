/**
 * MindmapQualityAnalyzer - AI-powered mindmap structure analysis
 * Checks for common issues and suggests improvements
 */

import { aiService } from "@/services/ai/AIService";
import type { MindmapContext } from "./MindmapAIService";

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface QualityIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedNodes?: string[];
  autoFixable: boolean;
  suggestion?: string;
}

export interface QualityReport {
  score: number; // 0-100
  issues: QualityIssue[];
  strengths: string[];
  summary: string;
}

export class MindmapQualityAnalyzer {
  /**
   * Run comprehensive quality analysis
   */
  async analyze(context: MindmapContext): Promise<QualityReport> {
    console.log('🔍 Analyzing mindmap quality...');

    // Run both rule-based and AI-based analysis
    const ruleBasedIssues = this.runRuleBasedAnalysis(context);
    const aiAnalysis = await this.runAIAnalysis(context);

    // Combine results
    const allIssues = [...ruleBasedIssues, ...aiAnalysis.issues];
    const score = this.calculateScore(allIssues, context.nodes.length);

    return {
      score,
      issues: allIssues,
      strengths: aiAnalysis.strengths,
      summary: aiAnalysis.summary,
    };
  }

  /**
   * Rule-based analysis (fast, deterministic)
   */
  private runRuleBasedAnalysis(context: MindmapContext): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check 1: Orphaned nodes (no connections)
    const orphanedNodes = context.nodes.filter(node => {
      const hasIncoming = context.edges.some(e => e.target === node.id);
      const hasOutgoing = context.edges.some(e => e.source === node.id);
      return !hasIncoming && !hasOutgoing && context.nodes.length > 1;
    });

    if (orphanedNodes.length > 0) {
      issues.push({
        id: 'orphaned-nodes',
        severity: 'warning',
        title: `${orphanedNodes.length} Orphaned Node${orphanedNodes.length > 1 ? 's' : ''}`,
        description: 'Some nodes have no connections to the rest of the mindmap.',
        affectedNodes: orphanedNodes.map(n => n.id),
        autoFixable: false,
        suggestion: 'Connect these nodes to related topics or remove them if irrelevant.',
      });
    }

    // Check 2: Single-child nodes (might be unnecessary nesting)
    const singleChildNodes = context.nodes.filter(node => {
      const children = context.edges.filter(e => e.source === node.id);
      return children.length === 1;
    });

    if (singleChildNodes.length > 3) {
      issues.push({
        id: 'single-child-nodes',
        severity: 'info',
        title: `${singleChildNodes.length} Nodes with Only One Child`,
        description: 'Multiple nodes have only a single child, which might indicate unnecessary nesting.',
        affectedNodes: singleChildNodes.map(n => n.id),
        autoFixable: false,
        suggestion: 'Consider merging single-child chains or adding more subtopics.',
      });
    }

    // Check 3: Leaf nodes without descriptions
    const leafNodesNoDesc = context.nodes.filter(node => {
      const hasChildren = context.edges.some(e => e.source === node.id);
      return !hasChildren && !node.description;
    });

    if (leafNodesNoDesc.length > 0) {
      issues.push({
        id: 'missing-descriptions',
        severity: 'info',
        title: `${leafNodesNoDesc.length} Leaf Nodes Missing Descriptions`,
        description: 'End nodes would benefit from descriptions for better context.',
        affectedNodes: leafNodesNoDesc.map(n => n.id),
        autoFixable: true,
        suggestion: 'AI can generate descriptions for these nodes.',
      });
    }

    // Check 4: Overly broad nodes (many children)
    const broadNodes = context.nodes.filter(node => {
      const children = context.edges.filter(e => e.source === node.id);
      return children.length > 7;
    });

    if (broadNodes.length > 0) {
      issues.push({
        id: 'overly-broad',
        severity: 'warning',
        title: `${broadNodes.length} Node${broadNodes.length > 1 ? 's' : ''} with Too Many Children`,
        description: 'Some nodes have more than 7 direct children, which can be hard to navigate.',
        affectedNodes: broadNodes.map(n => n.id),
        autoFixable: false,
        suggestion: 'Consider grouping children into intermediate categories.',
      });
    }

    // Check 5: Shallow hierarchy (max depth < 3)
    const maxDepth = this.calculateMaxDepth(context);
    if (maxDepth < 2 && context.nodes.length > 5) {
      issues.push({
        id: 'shallow-hierarchy',
        severity: 'info',
        title: 'Shallow Hierarchy',
        description: 'The mindmap has limited depth, which might indicate underexplored topics.',
        autoFixable: false,
        suggestion: 'Expand key nodes to add more detail and structure.',
      });
    }

    // Check 6: Unbalanced tree (one branch much deeper than others)
    const depths = this.calculateAllDepths(context);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const maxVariance = Math.max(...depths) - avgDepth;
    
    if (maxVariance > 3 && context.nodes.length > 10) {
      issues.push({
        id: 'unbalanced-tree',
        severity: 'info',
        title: 'Unbalanced Structure',
        description: 'Some branches are significantly deeper than others.',
        autoFixable: false,
        suggestion: 'Balance the mindmap by expanding underdeveloped branches.',
      });
    }

    // Check 7: Generic labels
    const genericLabels = context.nodes.filter(node =>
      /^(node|item|topic|thing|stuff|idea)\s*\d*$/i.test(node.label)
    );

    if (genericLabels.length > 0) {
      issues.push({
        id: 'generic-labels',
        severity: 'warning',
        title: `${genericLabels.length} Generic Label${genericLabels.length > 1 ? 's' : ''}`,
        description: 'Some nodes have generic, non-descriptive labels.',
        affectedNodes: genericLabels.map(n => n.id),
        autoFixable: true,
        suggestion: 'AI can suggest more meaningful labels based on context.',
      });
    }

    return issues;
  }

  /**
   * AI-based analysis (semantic, contextual)
   */
  private async runAIAnalysis(context: MindmapContext): Promise<{
    issues: QualityIssue[];
    strengths: string[];
    summary: string;
  }> {
    const structureDesc = this.buildStructureDescription(context);

    const prompt = `You are a mindmap quality expert. Analyze this mindmap structure and provide insights.

**MINDMAP:**
Title: "${context.title}"
Nodes: ${context.nodes.length}
Connections: ${context.edges.length}

**STRUCTURE:**
${structureDesc.slice(0, 800)}

**TASK:**
Analyze the mindmap for:
1. **Logical flow**: Does the structure make sense?
2. **Missing topics**: What key topics might be missing?
3. **Redundancy**: Are there duplicate or overlapping concepts?
4. **Clarity**: Are relationships and groupings clear?
5. **Completeness**: Is each branch sufficiently developed?

**OUTPUT FORMAT (JSON):**
{
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "warning" or "info"
    }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "summary": "Overall 1-2 sentence assessment"
}

Output ONLY the JSON, no other text.`;

    try {
      const response = await aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 800,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ AI analysis failed to parse');
        return { issues: [], strengths: [], summary: 'Analysis unavailable.' };
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Convert AI issues to our format
      const aiIssues: QualityIssue[] = (analysis.issues || []).map((issue: any, i: number) => ({
        id: `ai-issue-${i}`,
        severity: issue.severity || 'info',
        title: issue.title,
        description: issue.description,
        autoFixable: false,
      }));

      return {
        issues: aiIssues,
        strengths: analysis.strengths || [],
        summary: analysis.summary || 'Analysis complete.',
      };
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return { issues: [], strengths: [], summary: 'AI analysis unavailable.' };
    }
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateScore(issues: QualityIssue[], nodeCount: number): number {
    let score = 100;

    // Deduct points based on issues
    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 15;
      else if (issue.severity === 'warning') score -= 8;
      else score -= 3;
    });

    // Bonus for size (more nodes = more effort)
    if (nodeCount > 10) score += 5;
    if (nodeCount > 20) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Auto-fix issues where possible
   */
  async autoFix(context: MindmapContext, issueId: string): Promise<any> {
    // Placeholder for auto-fix implementations
    console.log(`🔧 Auto-fixing issue: ${issueId}`);
    return null;
  }

  // --- Helper Methods ---

  private buildStructureDescription(context: MindmapContext): string {
    const rootNodes = context.nodes.filter(n =>
      !context.edges.some(e => e.target === n.id)
    );

    const buildTree = (nodeId: string, indent: number = 0): string => {
      const node = context.nodes.find(n => n.id === nodeId);
      if (!node) return '';

      const children = context.edges
        .filter(e => e.source === nodeId)
        .map(e => e.target);

      let result = `${'  '.repeat(indent)}- ${node.label}\n`;
      children.forEach(childId => {
        result += buildTree(childId, indent + 1);
      });

      return result;
    };

    return rootNodes.map(n => buildTree(n.id)).join('\n');
  }

  private calculateMaxDepth(context: MindmapContext): number {
    const depths = this.calculateAllDepths(context);
    return depths.length > 0 ? Math.max(...depths) : 0;
  }

  private calculateAllDepths(context: MindmapContext): number[] {
    const rootNodes = context.nodes.filter(n =>
      !context.edges.some(e => e.target === n.id)
    );

    const getDepth = (nodeId: string, currentDepth: number = 0): number => {
      const children = context.edges
        .filter(e => e.source === nodeId)
        .map(e => e.target);

      if (children.length === 0) return currentDepth;

      return Math.max(...children.map(childId => getDepth(childId, currentDepth + 1)));
    };

    return rootNodes.map(n => getDepth(n.id));
  }
}

// Export singleton
export const mindmapQualityAnalyzer = new MindmapQualityAnalyzer();
