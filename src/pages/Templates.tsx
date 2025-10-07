import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  FileText, 
  Search, 
  Code, 
  Calendar, 
  Target, 
  Heart, 
  BookOpen, 
  User, 
  Lightbulb,
  Users
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  preview: string;
  content: string;
}

const templates: Template[] = [
  {
    id: 'quick-notes',
    title: 'Quick Notes',
    description: 'Minimal structure for jotting down ideas quickly',
    category: 'Notes',
    icon: Lightbulb,
    preview: '# Quick Notes\n\n**Date:** 2024-01-15\n\n- Important idea\n- Follow up task\n- Remember this',
    content: `# Quick Notes

**Date:** ${new Date().toLocaleDateString()}

## Ideas
- 
- 
- 

## Tasks
- [ ] 
- [ ] 
- [ ] 

## Notes
Write your thoughts here...`
  },
  {
    id: 'blog-post',
    title: 'Blog Post',
    description: 'Complete structure for writing engaging blog articles',
    category: 'Blog',
    icon: FileText,
    preview: '# Blog Post Title\n\n**Author:** Your Name\n**Date:** 2024-01-15\n**Tags:** #tech #tutorial\n\n## Introduction\nHook your readers...',
    content: `# Blog Post Title

**Author:** Your Name
**Date:** ${new Date().toLocaleDateString()}
**Tags:** #tag1 #tag2 #tag3

## Introduction

Write a compelling introduction that hooks your readers and explains what they'll learn...

## Main Content

### Section 1
Your main points here...

### Section 2
Continue building your argument or explanation...

## Conclusion

Summarize your key points and provide a call to action...

---

*Thank you for reading! Leave a comment below with your thoughts.*`
  },
  {
    id: 'technical-docs',
    title: 'Technical Documentation',
    description: 'Perfect for developers writing guides and API docs',
    category: 'Docs',
    icon: Code,
    preview: '# API Documentation\n\n## Table of Contents\n- [Overview](#overview)\n- [Endpoints](#endpoints)\n\n## Overview\nThis API provides...',
    content: `# Technical Documentation

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)

## Overview

Brief description of what this documentation covers...

## Installation

\`\`\`bash
npm install your-package
\`\`\`

## Usage

### Basic Example

\`\`\`javascript
const example = require('your-package');
example.doSomething();
\`\`\`

## API Reference

### Function Name

**Description:** What this function does

**Parameters:**
- \`param1\` (string): Description of parameter
- \`param2\` (number): Description of parameter

**Returns:** Description of return value

**Example:**
\`\`\`javascript
const result = functionName('value', 42);
\`\`\`

## Examples

More detailed examples here...`
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Organized format for capturing meeting discussions and action items',
    category: 'Notes',
    icon: Users,
    preview: '# Meeting: Weekly Standup\n\n**Date:** 2024-01-15\n**Attendees:** John, Sarah, Mike\n\n## Agenda\n- Project updates\n- Action items',
    content: `# Meeting: [Meeting Title]

**Date:** ${new Date().toLocaleDateString()}
**Time:** [Start Time] - [End Time]
**Location:** [Physical/Virtual Location]

## Attendees
- [Name 1]
- [Name 2]
- [Name 3]

## Agenda
1. [Agenda Item 1]
2. [Agenda Item 2]
3. [Agenda Item 3]

## Discussion Points

### [Topic 1]
- Key points discussed
- Decisions made
- Concerns raised

### [Topic 2]
- Key points discussed
- Decisions made

## Action Items
- [ ] [Action Item 1] - Assigned to: [Name] - Due: [Date]
- [ ] [Action Item 2] - Assigned to: [Name] - Due: [Date]
- [ ] [Action Item 3] - Assigned to: [Name] - Due: [Date]

## Next Steps
- [Next meeting date]
- [Follow-up tasks]

## Notes
Additional notes and observations...`
  },
  {
    id: 'project-plan',
    title: 'Project Plan',
    description: 'Comprehensive template for planning and tracking projects',
    category: 'Personal',
    icon: Target,
    preview: '# Project Plan: Website Redesign\n\n## Goals\n- Improve user experience\n- Increase conversions\n\n## Timeline\n| Phase | Duration |\n|-------|----------|\n| Design | 2 weeks |',
    content: `# Project Plan: [Project Name]

## Project Overview
Brief description of the project and its purpose...

## Goals & Objectives
- [ ] Primary Goal 1
- [ ] Primary Goal 2
- [ ] Secondary Goal 1

## Timeline & Milestones

| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Planning | [Date] | [Date] | ⏳ |
| Development | [Date] | [Date] | ⏳ |
| Testing | [Date] | [Date] | ⏳ |
| Launch | [Date] | [Date] | ⏳ |

## Resources Needed
- **Team Members:** [List team members and roles]
- **Budget:** [Budget requirements]
- **Tools:** [Required tools and software]
- **External Dependencies:** [Third-party requirements]

## Risk Assessment
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

## Success Metrics
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]
- [Metric 3]: [Target value]

## Notes
Additional project notes and considerations...`
  },
  {
    id: 'journal-entry',
    title: 'Journal Entry',
    description: 'Personal reflection template with mood tracking',
    category: 'Personal',
    icon: Heart,
    preview: '# Journal Entry\n\n**Date:** 2024-01-15\n**Mood:** 😊 Happy\n\n## Today I...\n- Accomplished something great\n- Learned something new',
    content: `# Journal Entry

**Date:** ${new Date().toLocaleDateString()}
**Mood:** [😊 😐 😔 😤 😴 🤔] (Choose one or add your own)

## Today I...
- 
- 
- 

## Gratitude
Three things I'm grateful for today:
1. 
2. 
3. 

## Reflections
What went well today?


What could have gone better?


What did I learn?


## Tomorrow I want to...
- 
- 
- 

## Random Thoughts
Space for any other thoughts, ideas, or observations...

---
*"The life unexamined is not worth living." - Socrates*`
  },
  {
    id: 'research-summary',
    title: 'Research Summary',
    description: 'Academic-style template for research notes and summaries',
    category: 'Docs',
    icon: BookOpen,
    preview: '# Research Summary: Topic\n\n## Abstract\nBrief overview of the research...\n\n## Key Findings\n- Finding 1\n- Finding 2\n\n## References\n[1] Author et al.',
    content: `# Research Summary: [Topic/Title]

**Author:** [Your Name]
**Date:** ${new Date().toLocaleDateString()}
**Subject:** [Research Area]

## Abstract
Brief 2-3 sentence summary of the research topic and main findings...

## Key Findings
- **Finding 1:** Description and significance
- **Finding 2:** Description and significance  
- **Finding 3:** Description and significance

## Methodology
Brief description of research methods used...

## Important Quotes
> "Significant quote from the research"
> — Author Name, Publication

> "Another important insight"
> — Author Name, Publication

## Analysis & Insights
Your personal analysis and interpretation of the findings...

## Implications
What do these findings mean for:
- **Theory:** 
- **Practice:** 
- **Future Research:** 

## Questions for Further Investigation
- Question 1?
- Question 2?
- Question 3?

## References
[1] Author, A. A., Author, B. B., & Author, C. C. (Year). Title of article. *Title of Journal*, volume(issue), pages.

[2] Author, D. D. (Year). *Title of book*. Publisher.

## Additional Notes
Other observations and thoughts...`
  },
  {
    id: 'resume',
    title: 'Resume / CV',
    description: 'Professional resume template with clean Markdown formatting',
    category: 'Personal',
    icon: User,
    preview: '# Your Name\n\n**Email:** your.email@example.com\n**Phone:** (555) 123-4567\n\n## Experience\n### Job Title - Company\n*2023 - Present*',
    content: `# Your Full Name

**Email:** your.email@example.com  
**Phone:** (555) 123-4567  
**LinkedIn:** linkedin.com/in/yourprofile  
**Location:** City, State  

## Professional Summary
Brief 2-3 sentence summary of your professional background and key strengths...

## Experience

### Job Title - Company Name
*Start Date - End Date*
- Achievement or responsibility 1
- Achievement or responsibility 2
- Achievement or responsibility 3

### Previous Job Title - Company Name
*Start Date - End Date*
- Achievement or responsibility 1
- Achievement or responsibility 2
- Achievement or responsibility 3

## Education

### Degree Name - University Name
*Graduation Year*
- Relevant coursework, honors, or achievements

## Skills

**Technical Skills:**
- Skill category 1: Skill 1, Skill 2, Skill 3
- Skill category 2: Skill 1, Skill 2, Skill 3

**Soft Skills:**
- Leadership, Communication, Problem-solving, Teamwork

## Projects

### Project Name
*Date*
- Brief description of the project and your role
- Technologies used and key achievements

## Certifications
- Certification Name - Issuing Organization (Year)
- Certification Name - Issuing Organization (Year)

## Additional Information
- Languages: [Languages and proficiency levels]
- Volunteer work: [Brief description if relevant]
- Interests: [Professional interests or hobbies]`
  }
];

const categories = ['All', 'Notes', 'Blog', 'Docs', 'Personal'];

export default function Templates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: Template) => {
    // Store the template content in localStorage to pass to editor
    localStorage.setItem('templateContent', template.content);
    localStorage.setItem('templateTitle', template.title);
    navigate('/editor');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Templates</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Choose from professional templates to get started quickly
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card 
                key={template.id} 
                className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 hover:scale-[1.02] bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                    {template.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-hidden">
                    <pre className="text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {template.preview}
                    </pre>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-3">
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">No templates found</div>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}