/**
 * Documentation Template - Technical documentation structure
 */

import { Template } from '@/services/TemplateService';

export const docsTemplate: Template = {
  id: 'documentation',
  name: 'Documentation',
  description: 'Technical documentation with proper structure',
  category: 'technical',
  icon: '⚙️',
  content: `# {{title}}

## Overview
{{description}}

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites
- [Requirement 1]
- [Requirement 2]

### Installation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Configuration

### Basic Configuration
\`\`\`{{config_language}}
# Example configuration
setting: value
\`\`\`

### Advanced Configuration
- **Option 1:** [Description]
- **Option 2:** [Description]

## Usage

### Basic Usage
\`\`\`{{code_language}}
// Basic example
function example() {
  // Your code here
}
\`\`\`

### Advanced Usage
\`\`\`{{code_language}}
// Advanced example
class ExampleClass {
  constructor() {
    // Initialize
  }

  method() {
    // Implementation
  }
}
\`\`\`

## API Reference

### Classes

#### {{main_class}}
\`\`\`{{code_language}}
class {{main_class}} {
  // Class definition
}
\`\`\`

### Methods

#### {{main_method}}()
\`\`\`{{code_language}}
{{main_method}}(param1, param2) {
  // Method implementation
}
\`\`\`

## Examples

### Example 1: Basic Usage
[Description of example]

\`\`\`{{code_language}}
// Example code
\`\`\`

### Example 2: Advanced Usage
[Description of advanced example]

\`\`\`{{code_language}}
// Advanced example code
\`\`\`

## Troubleshooting

### Common Issues

#### Issue 1: [Problem]
**Error:** [Error message]
**Solution:** [Solution steps]

#### Issue 2: [Problem]
**Error:** [Error message]
**Solution:** [Solution steps]

### Getting Help
- Check the [FAQ](#)
- Open an issue on [GitHub]({{github_url}})
- Contact support: {{support_email}}

---

*Version:* {{version}}
*Last Updated:* {{date}}
*Author:* {{author}}`,
  variables: [
    {
      key: 'title',
      label: 'Document Title',
      type: 'text',
      required: true,
      defaultValue: 'API Documentation',
    },
    {
      key: 'description',
      label: 'Brief Description',
      type: 'textarea',
      required: true,
      defaultValue: 'Brief overview of what this documentation covers.',
    },
    {
      key: 'config_language',
      label: 'Configuration Language',
      type: 'select',
      options: ['json', 'yaml', 'toml', 'ini', 'javascript'],
      required: true,
      defaultValue: 'json',
    },
    {
      key: 'code_language',
      label: 'Code Language',
      type: 'select',
      options: ['javascript', 'typescript', 'python', 'java', 'csharp', 'php', 'ruby', 'go'],
      required: true,
      defaultValue: 'javascript',
    },
    {
      key: 'main_class',
      label: 'Main Class Name',
      type: 'text',
      required: true,
      defaultValue: 'MainClass',
    },
    {
      key: 'main_method',
      label: 'Main Method Name',
      type: 'text',
      required: true,
      defaultValue: 'mainMethod',
    },
    {
      key: 'github_url',
      label: 'GitHub Repository URL',
      type: 'text',
      required: false,
      defaultValue: 'https://github.com/username/repo',
    },
    {
      key: 'support_email',
      label: 'Support Email',
      type: 'text',
      required: false,
      defaultValue: 'support@example.com',
    },
    {
      key: 'version',
      label: 'Version',
      type: 'text',
      required: true,
      defaultValue: '1.0.0',
    },
    {
      key: 'author',
      label: 'Author Name',
      type: 'text',
      required: true,
      defaultValue: 'Your Name',
    },
  ],
  metadata: {
    author: 'MD Creator',
    tags: ['documentation', 'technical', 'api', 'guide'],
    version: '1.0.0',
    lastModified: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};
