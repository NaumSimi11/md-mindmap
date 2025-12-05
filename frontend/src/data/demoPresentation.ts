import type { Presentation } from '@/services/presentation/PresentationTypes';

export const DEMO_PRESENTATION: Presentation = {
  id: 'demo-blocks-showcase',
  title: 'Beautiful Blocks Showcase',
  author: 'System',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  theme: {
    id: 'night-sky',
    name: 'Night Sky',
  },
  slides: [
    // 1. Hero Block
    {
      id: 'slide-1',
      type: 'content',
      layout: 'hero',
      content: {
        heading: 'Beautiful Blocks System',
        subtitle: '✨ NEW',
        body: 'Professional presentation components with stunning animations and modern design.',
        heroVariant: 'centered',
        centerIcon: '🚀',
        cta: {
          label: 'Get Started',
          action: () => console.log('CTA clicked'),
        },
        secondaryCta: {
          label: 'Learn More',
        },
        stats: [
          { value: '10', label: 'Components' },
          { value: '54+', label: 'Animations' },
          { value: '100%', label: 'Quality' },
        ],
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            content: {
              heading: 'Beautiful Blocks System',
              subtitle: '✨ NEW',
              body: 'Professional presentation components with stunning animations and modern design.',
              heroVariant: 'centered',
              centerIcon: '🚀',
              cta: {
                label: 'Get Started',
                action: () => console.log('CTA clicked'),
              },
              secondaryCta: {
                label: 'Learn More',
              },
              stats: [
                { value: '10', label: 'Components' },
                { value: '54+', label: 'Animations' },
                { value: '100%', label: 'Quality' },
              ],
            },
          },
        ],
      },
    },
    // 2. Cards Block
    {
      id: 'slide-2',
      type: 'content',
      layout: 'cards',
      content: {
        heading: 'Key Features',
        blocks: [
          {
            id: 'cards-1',
            type: 'cards',
            content: {
              heading: 'Key Features',
              cards: [
                {
                  id: '1',
                  title: 'Beautiful Design',
                  body: 'Gamma-quality components with professional polish',
                  icon: '🎨',
                  tags: ['UI', 'Design'],
                },
                {
                  id: '2',
                  title: 'Smooth Animations',
                  body: '60fps GPU-accelerated animations throughout',
                  icon: '⚡',
                  tags: ['Performance'],
                },
                {
                  id: '3',
                  title: 'Fully Themed',
                  body: 'Every component respects your theme settings',
                  icon: '🎭',
                  tags: ['Customization'],
                },
              ],
            },
          },
        ],
      },
    },
    // 3. Stats Block
    {
      id: 'slide-3',
      type: 'content',
      layout: 'stats',
      content: {
        heading: 'By The Numbers',
        blocks: [
          {
            id: 'stats-1',
            type: 'stats',
            content: {
              heading: 'By The Numbers',
              statType: 'ring',
              stats: [
                {
                  label: 'Completion',
                  value: 100,
                  max: 100,
                  format: 'percentage',
                  icon: '✓',
                },
                {
                  label: 'Components',
                  value: 10,
                  max: 10,
                  icon: '🎯',
                },
                {
                  label: 'Features',
                  value: 112,
                  max: 150,
                  icon: '⭐',
                },
                {
                  label: 'Quality',
                  value: 95,
                  max: 100,
                  format: 'percentage',
                  icon: '💎',
                },
              ],
            },
          },
        ],
      },
    },
    // 4. Steps Block
    {
      id: 'slide-4',
      type: 'content',
      layout: 'steps',
      content: {
        heading: 'How It Works',
        blocks: [
          {
            id: 'steps-1',
            type: 'steps',
            content: {
              heading: 'How It Works',
              steps: [
                {
                  id: '1',
                  title: 'Choose Your Block',
                  description: 'Select from 10 beautiful block types',
                  icon: '🎯',
                  duration: '1 min',
                  status: 'completed',
                },
                {
                  id: '2',
                  title: 'Add Your Content',
                  description: 'Fill in your data and customize',
                  icon: '✍️',
                  duration: '2 min',
                  status: 'in-progress',
                },
                {
                  id: '3',
                  title: 'Present Beautifully',
                  description: 'Enjoy stunning animations and design',
                  icon: '🎬',
                  duration: '5 min',
                  status: 'pending',
                },
              ],
            },
          },
        ],
      },
    },
    // 5. Funnel Block
    {
      id: 'slide-5',
      type: 'content',
      layout: 'funnel',
      content: {
        heading: 'Conversion Funnel Example',
        blocks: [
          {
            id: 'funnel-1',
            type: 'funnel',
            content: {
              heading: 'User Journey',
              funnelItems: [
                {
                  label: 'Visitors',
                  value: '10000',
                  icon: '👥',
                  description: 'Total site visitors',
                },
                {
                  label: 'Engaged Users',
                  value: '5000',
                  icon: '👀',
                  description: 'Viewed multiple pages',
                },
                {
                  label: 'Sign Ups',
                  value: '1000',
                  icon: '📝',
                  description: 'Created accounts',
                },
                {
                  label: 'Active Users',
                  value: '500',
                  icon: '⚡',
                  description: 'Regular engagement',
                },
              ],
            },
          },
        ],
      },
    },
    // 6. Timeline Block
    {
      id: 'slide-6',
      type: 'content',
      layout: 'timeline',
      content: {
        heading: 'Project Timeline',
        blocks: [
          {
            id: 'timeline-1',
            type: 'timeline',
            content: {
              heading: 'Development Milestones',
              timelineLayout: 'horizontal',
              timelineItems: [
                {
                  title: 'Planning',
                  date: 'Week 1',
                  description: 'Research and design',
                  icon: '📋',
                },
                {
                  title: 'Development',
                  date: 'Week 2',
                  description: 'Building components',
                  icon: '💻',
                },
                {
                  title: 'Testing',
                  date: 'Week 3',
                  description: 'QA and polish',
                  icon: '🧪',
                },
                {
                  title: 'Launch',
                  date: 'Week 4',
                  description: 'Production release',
                  icon: '🚀',
                },
              ],
            },
          },
        ],
      },
    },
    // 7. Comparison Block
    {
      id: 'slide-7',
      type: 'content',
      layout: 'comparison',
      content: {
        heading: 'Feature Comparison',
        blocks: [
          {
            id: 'comparison-1',
            type: 'comparison',
            content: {
              heading: 'Choose Your Plan',
              columns: [
                {
                  name: 'Basic',
                  price: '$0',
                  description: 'For starters',
                  icon: '📦',
                },
                {
                  name: 'Pro',
                  price: '$29',
                  description: 'Most popular',
                  icon: '⭐',
                  highlighted: true,
                  badge: 'POPULAR',
                  cta: 'Get Started',
                },
                {
                  name: 'Enterprise',
                  price: '$99',
                  description: 'For teams',
                  icon: '🏢',
                },
              ],
              features: [
                {
                  name: 'Components',
                  values: [true, true, true],
                },
                {
                  name: 'Animations',
                  values: [true, true, true],
                },
                {
                  name: 'Custom Themes',
                  values: [false, true, true],
                },
                {
                  name: 'Priority Support',
                  values: [false, false, true],
                },
              ],
            },
          },
        ],
      },
    },
    // 8. Callout Block
    {
      id: 'slide-8',
      type: 'content',
      layout: 'callout',
      content: {
        blocks: [
          {
            id: 'callout-1',
            type: 'callout',
            content: {
              calloutType: 'tip',
              title: '💡 Pro Tip',
              body: 'All components are fully responsive and work great on any screen size. Try resizing your browser to see them adapt!',
              tags: ['Responsive', 'Mobile-Friendly'],
              actions: [
                {
                  label: 'Learn More',
                  primary: true,
                },
              ],
            },
          },
        ],
      },
    },
    // 9. Cycle Block
    {
      id: 'slide-9',
      type: 'content',
      layout: 'cycle',
      content: {
        heading: 'Development Cycle',
        blocks: [
          {
            id: 'cycle-1',
            type: 'cycle',
            content: {
              heading: 'Agile Process',
              centerIcon: '♻️',
              centerLabel: 'Sprint',
              cycleItems: [
                {
                  label: 'Plan',
                  description: 'Define requirements',
                  icon: '📋',
                },
                {
                  label: 'Design',
                  description: 'Create mockups',
                  icon: '🎨',
                },
                {
                  label: 'Develop',
                  description: 'Write code',
                  icon: '💻',
                },
                {
                  label: 'Test',
                  description: 'Quality assurance',
                  icon: '🧪',
                },
                {
                  label: 'Deploy',
                  description: 'Ship to production',
                  icon: '🚀',
                },
                {
                  label: 'Review',
                  description: 'Gather feedback',
                  icon: '📊',
                },
              ],
            },
          },
        ],
      },
    },
    // 10. Pyramid Block
    {
      id: 'slide-10',
      type: 'content',
      layout: 'pyramid',
      content: {
        heading: 'Priority Pyramid',
        blocks: [
          {
            id: 'pyramid-1',
            type: 'pyramid',
            content: {
              heading: 'Development Priorities',
              pyramidItems: [
                {
                  label: 'Polish & Testing',
                  description: 'Final touches',
                  icon: '✨',
                  value: '10',
                  unit: '%',
                  percentage: 100,
                },
                {
                  label: 'Core Features',
                  description: 'Main functionality',
                  icon: '⚡',
                  value: '30',
                  unit: '%',
                  percentage: 80,
                },
                {
                  label: 'Architecture',
                  description: 'System design',
                  icon: '🏗️',
                  value: '60',
                  unit: '%',
                  percentage: 60,
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

