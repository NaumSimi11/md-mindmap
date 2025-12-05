/**
 * Presentation Template - Slides structure for presentations
 */

import { Template } from '@/services/TemplateService';

export const presentationTemplate: Template = {
  id: 'presentation',
  name: 'Presentation',
  description: 'Complete presentation structure with slides',
  category: 'business',
  icon: '🎯',
  content: `# {{title}}

**{{subtitle}}**

*{{presenter}} • {{date}}*

---

## Slide 1: Title Slide

# {{title}}

**{{subtitle}}**

*Presented by {{presenter}}*

[{{company}}]({{company_url}})

{{date}}

---

## Slide 2: Agenda

## Agenda

1. **{{agenda_item1}}**
2. **{{agenda_item2}}**
3. **{{agenda_item3}}**
4. **{{agenda_item4}}**
5. **Q&A**

---

## Slide 3: {{agenda_item1}}

### Key Points
- [Point 1]
- [Point 2]
- [Point 3]

### Details
[Supporting information and context for this topic]

---

## Slide 4: {{agenda_item2}}

### Key Points
- [Point 1]
- [Point 2]
- [Point 3]

### Visual Element
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[Result]
\`\`\`

---

## Slide 5: {{agenda_item3}}

### Data/Statistics
- **{{stat1_label}}:** {{stat1_value}}
- **{{stat2_label}}:** {{stat2_value}}
- **{{stat3_label}}:** {{stat3_value}}

### Chart
[Insert chart or graph here]

---

## Slide 6: {{agenda_item4}}

### Implementation Steps
1. **Step 1:** [Description]
2. **Step 2:** [Description]
3. **Step 3:** [Description]
4. **Step 4:** [Description]

### Timeline
- **Week 1-2:** [Milestone 1]
- **Week 3-4:** [Milestone 2]
- **Week 5-6:** [Milestone 3]

---

## Slide 7: Key Takeaways

### Main Points
- [Key takeaway 1]
- [Key takeaway 2]
- [Key takeaway 3]

### Remember
[{{key_message}}]

---

## Slide 8: Q&A

## Questions?

Thank you for your attention!

**Contact Information:**
- Email: {{email}}
- Phone: {{phone}}
- Website: {{website}}

---

## Slide 9: Thank You

## Thank You!

**{{closing_message}}**

*{{presenter}}*
{{company}}

[{{company_url}}]({{company_url}})

---

*This presentation was created with MD Creator*`,
  variables: [
    {
      key: 'title',
      label: 'Presentation Title',
      type: 'text',
      required: true,
      defaultValue: 'Presentation Title',
    },
    {
      key: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      defaultValue: 'Brief description of the presentation topic',
    },
    {
      key: 'presenter',
      label: 'Presenter Name',
      type: 'text',
      required: true,
      defaultValue: 'Your Name',
    },
    {
      key: 'company',
      label: 'Company/Organization',
      type: 'text',
      required: false,
      defaultValue: 'Your Company',
    },
    {
      key: 'company_url',
      label: 'Company Website',
      type: 'text',
      required: false,
      defaultValue: 'https://yourcompany.com',
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toLocaleDateString(),
    },
    {
      key: 'agenda_item1',
      label: 'Agenda Item 1',
      type: 'text',
      required: true,
      defaultValue: 'Introduction',
    },
    {
      key: 'agenda_item2',
      label: 'Agenda Item 2',
      type: 'text',
      required: true,
      defaultValue: 'Main Content',
    },
    {
      key: 'agenda_item3',
      label: 'Agenda Item 3',
      type: 'text',
      required: true,
      defaultValue: 'Case Study',
    },
    {
      key: 'agenda_item4',
      label: 'Agenda Item 4',
      type: 'text',
      required: true,
      defaultValue: 'Next Steps',
    },
    {
      key: 'stat1_label',
      label: 'Statistic 1 Label',
      type: 'text',
      required: false,
      defaultValue: 'Revenue Growth',
    },
    {
      key: 'stat1_value',
      label: 'Statistic 1 Value',
      type: 'text',
      required: false,
      defaultValue: '25%',
    },
    {
      key: 'stat2_label',
      label: 'Statistic 2 Label',
      type: 'text',
      required: false,
      defaultValue: 'Customer Satisfaction',
    },
    {
      key: 'stat2_value',
      label: 'Statistic 2 Value',
      type: 'text',
      required: false,
      defaultValue: '4.8/5',
    },
    {
      key: 'stat3_label',
      label: 'Statistic 3 Label',
      type: 'text',
      required: false,
      defaultValue: 'Market Share',
    },
    {
      key: 'stat3_value',
      label: 'Statistic 3 Value',
      type: 'text',
      required: false,
      defaultValue: '15%',
    },
    {
      key: 'key_message',
      label: 'Key Message',
      type: 'text',
      required: true,
      defaultValue: 'Remember this important point',
    },
    {
      key: 'closing_message',
      label: 'Closing Message',
      type: 'text',
      required: true,
      defaultValue: 'Thank you for your time and attention',
    },
    {
      key: 'email',
      label: 'Contact Email',
      type: 'text',
      required: false,
      defaultValue: 'your.email@company.com',
    },
    {
      key: 'phone',
      label: 'Contact Phone',
      type: 'text',
      required: false,
      defaultValue: '+1 (555) 123-4567',
    },
    {
      key: 'website',
      label: 'Website',
      type: 'text',
      required: false,
      defaultValue: 'https://yourcompany.com',
    },
  ],
  metadata: {
    author: 'MD Creator',
    tags: ['presentation', 'slides', 'business', 'communication'],
    version: '1.0.0',
    lastModified: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};
