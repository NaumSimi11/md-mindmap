/**
 * Blog Post Template - Complete blog post structure
 */

import { Template } from '@/services/TemplateService';

export const blogTemplate: Template = {
  id: 'blog-post',
  name: 'Blog Post',
  description: 'Complete blog post structure with sections',
  category: 'creative',
  icon: '📝',
  content: `# {{title}}

*By {{author}} • {{date}}*

## Introduction
[Hook your readers with a compelling opening that grabs attention and clearly states what they'll learn or why they should care about this topic.]

## Main Content

### {{section1_title}}
[Develop your first key point with specific examples, data, or anecdotes that support your main argument.]

### {{section2_title}}
[Build on the first point with your second key insight, providing actionable advice or deeper analysis.]

### {{section3_title}}
[Complete your main argument with a third point, or provide a counter-argument and refute it.]

## Key Takeaways
- [Main lesson 1]
- [Main lesson 2]
- [Main lesson 3]

## Conclusion
[Summarize the main points and leave readers with a memorable final thought or clear next steps.]

## Call to Action
[What should readers do next? Include links to related content, newsletter signup, or social sharing.]

---

*Tags: {{tags}}*
*Reading time: {{reading_time}} minutes*

*Share this post: [Twitter] [LinkedIn] [Facebook]*`,
  variables: [
    {
      key: 'title',
      label: 'Post Title',
      type: 'text',
      required: true,
      defaultValue: 'Your Blog Post Title',
    },
    {
      key: 'author',
      label: 'Author Name',
      type: 'text',
      required: true,
      defaultValue: 'Your Name',
    },
    {
      key: 'date',
      label: 'Publication Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toLocaleDateString(),
    },
    {
      key: 'section1_title',
      label: 'Section 1 Title',
      type: 'text',
      required: true,
      defaultValue: 'First Key Point',
    },
    {
      key: 'section2_title',
      label: 'Section 2 Title',
      type: 'text',
      required: true,
      defaultValue: 'Second Key Point',
    },
    {
      key: 'section3_title',
      label: 'Section 3 Title',
      type: 'text',
      required: true,
      defaultValue: 'Third Key Point',
    },
    {
      key: 'tags',
      label: 'Tags (comma-separated)',
      type: 'text',
      required: false,
      defaultValue: 'blog, writing, productivity',
    },
    {
      key: 'reading_time',
      label: 'Reading Time (minutes)',
      type: 'text',
      required: false,
      defaultValue: '5',
    },
  ],
  metadata: {
    author: 'MD Creator',
    tags: ['blog', 'writing', 'content', 'structure'],
    version: '1.0.0',
    lastModified: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};
