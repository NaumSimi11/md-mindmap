/**
 * Meeting Template - Professional meeting notes structure
 */

import { Template } from '@/services/TemplateService';

export const meetingTemplate: Template = {
  id: 'meeting-notes',
  name: 'Meeting Notes',
  description: 'Professional meeting notes with structured sections',
  category: 'business',
  icon: '📅',
  content: `# Meeting Notes - {{date}}

## Attendees
- [Click to add name]
- [Click to add name]

## Agenda
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

## Discussion
- 

## Key Points
- 

## Decisions Made
- 

## Action Items
- [ ] [Action item] - @assignee
- [ ] [Action item] - @assignee

## Next Steps
- [ ] [Follow-up item]
- [ ] [Follow-up item]

## Notes
- 

---

*Meeting facilitated by:* [Facilitator Name]
*Duration:* [Time]
*Location:* [Location/Platform]`,
  variables: [
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toLocaleDateString(),
    },
  ],
  metadata: {
    author: 'MD Creator',
    tags: ['meeting', 'notes', 'business', 'professional'],
    version: '1.0.0',
    lastModified: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};
