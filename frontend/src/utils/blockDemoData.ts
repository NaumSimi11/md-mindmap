/**
 * Create demo data for different block types
 */

import type { Block, BlockType } from '@/services/presentation/BlockSystem';

export function createDemoBlock(blockType: BlockType): Block {
  const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  switch (blockType) {
    case 'hero':
      return {
        id: blockId,
        type: 'hero',
        content: {
          heading: 'Your Hero Title Here',
          subtitle: '✨ NEW',
          body: 'Add your message here. This is a hero block perfect for big impact moments.',
          heroVariant: 'centered',
          cta: {
            label: 'Get Started',
          },
        },
      };

    case 'cards':
      return {
        id: blockId,
        type: 'cards',
        content: {
          cards: [
            {
              id: '1',
              title: 'Card 1',
              body: 'Description here',
              icon: '🎯',
            },
            {
              id: '2',
              title: 'Card 2',
              body: 'Description here',
              icon: '⚡',
            },
            {
              id: '3',
              title: 'Card 3',
              body: 'Description here',
              icon: '🚀',
            },
          ],
        },
      };

    case 'stats':
      return {
        id: blockId,
        type: 'stats',
        content: {
          statType: 'ring',
          stats: [
            {
              label: 'Metric 1',
              value: 85,
              max: 100,
              icon: '📊',
            },
            {
              label: 'Metric 2',
              value: 120,
              icon: '⭐',
            },
          ],
        },
      };

    case 'steps':
      return {
        id: blockId,
        type: 'steps',
        content: {
          steps: [
            {
              id: '1',
              title: 'Step 1',
              description: 'First step description',
              icon: '1️⃣',
            },
            {
              id: '2',
              title: 'Step 2',
              description: 'Second step description',
              icon: '2️⃣',
            },
            {
              id: '3',
              title: 'Step 3',
              description: 'Third step description',
              icon: '3️⃣',
            },
          ],
        },
      };

    case 'funnel':
      return {
        id: blockId,
        type: 'funnel',
        content: {
          funnelItems: [
            {
              label: 'Stage 1',
              value: '1000',
              icon: '👥',
            },
            {
              label: 'Stage 2',
              value: '500',
              icon: '🎯',
            },
            {
              label: 'Stage 3',
              value: '100',
              icon: '✓',
            },
          ],
        },
      };

    case 'cycle':
      return {
        id: blockId,
        type: 'cycle',
        content: {
          centerIcon: '♻️',
          centerLabel: 'Process',
          cycleItems: [
            { label: 'Step 1', icon: '1️⃣' },
            { label: 'Step 2', icon: '2️⃣' },
            { label: 'Step 3', icon: '3️⃣' },
            { label: 'Step 4', icon: '4️⃣' },
          ],
        },
      };

    case 'timeline':
      return {
        id: blockId,
        type: 'timeline',
        content: {
          timelineLayout: 'horizontal',
          timelineItems: [
            {
              title: 'Milestone 1',
              date: 'Q1 2024',
              icon: '🎯',
            },
            {
              title: 'Milestone 2',
              date: 'Q2 2024',
              icon: '🚀',
            },
          ],
        },
      };

    case 'comparison':
      return {
        id: blockId,
        type: 'comparison',
        content: {
          columns: [
            { name: 'Basic', icon: '📦' },
            { name: 'Pro', icon: '⭐', highlighted: true },
          ],
          features: [
            {
              name: 'Feature 1',
              values: [true, true],
            },
            {
              name: 'Feature 2',
              values: [false, true],
            },
          ],
        },
      };

    case 'pyramid':
      return {
        id: blockId,
        type: 'pyramid',
        content: {
          pyramidItems: [
            {
              label: 'Top Level',
              icon: '⭐',
              value: '10',
            },
            {
              label: 'Middle Level',
              icon: '📊',
              value: '30',
            },
            {
              label: 'Base Level',
              icon: '🏗️',
              value: '60',
            },
          ],
        },
      };

    case 'callout':
      return {
        id: blockId,
        type: 'callout',
        content: {
          calloutType: 'tip',
          title: 'Pro Tip',
          body: 'Edit this callout to add your important message!',
        },
      };

    default:
      return {
        id: blockId,
        type: 'text',
        content: {
          text: 'New block added',
        },
      };
  }
}

