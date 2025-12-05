/**
 * Diagram templates for quick insertion
 * Covers most common diagram types
 */

export interface DiagramTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  code: string;
  category: 'flow' | 'uml' | 'data' | 'project' | 'other';
}

export const diagramTemplates: DiagramTemplate[] = [
  // FLOW DIAGRAMS
  {
    id: 'flowchart-basic',
    name: 'Flowchart',
    icon: '📊',
    description: 'Basic decision flowchart',
    category: 'flow',
    code: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
  },
  {
    id: 'flowchart-lr',
    name: 'Horizontal Flow',
    icon: '➡️',
    description: 'Left to right flowchart',
    category: 'flow',
    code: `flowchart LR
    A[Input] --> B[Process] --> C[Output]`,
  },

  // UML DIAGRAMS
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    icon: '🔄',
    description: 'UML sequence interaction',
    category: 'uml',
    code: `sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Request
    System->>Database: Query
    Database-->>System: Result
    System-->>User: Response`,
  },
  {
    id: 'class',
    name: 'Class Diagram',
    icon: '📦',
    description: 'UML class structure',
    category: 'uml',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: 'state',
    name: 'State Diagram',
    icon: '🔵',
    description: 'UML state machine',
    category: 'uml',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: start()
    Processing --> Success: complete()
    Processing --> Failed: error()
    Failed --> Idle: retry()
    Success --> [*]`,
  },

  // DATA DIAGRAMS
  {
    id: 'er',
    name: 'ER Diagram',
    icon: '🗄️',
    description: 'Entity relationship (database)',
    category: 'data',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes
    
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date created_at
    }`,
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    icon: '🥧',
    description: 'Data distribution',
    category: 'data',
    code: `pie title Distribution
    "Category A" : 45
    "Category B" : 30
    "Category C" : 25`,
  },

  // PROJECT MANAGEMENT
  {
    id: 'gantt',
    name: 'Gantt Chart',
    icon: '📅',
    description: 'Project timeline',
    category: 'project',
    code: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    
    section Planning
    Requirements    :a1, 2024-01-01, 5d
    Design         :a2, after a1, 7d
    
    section Development
    Implementation :a3, after a2, 14d
    Testing        :a4, after a3, 7d`,
  },
  {
    id: 'journey',
    name: 'User Journey',
    icon: '🚶',
    description: 'User experience flow',
    category: 'project',
    code: `journey
    title User Purchase Journey
    section Discovery
      Browse products: 5: User
      Add to cart: 4: User
    section Checkout
      Enter details: 3: User
      Payment: 4: User
    section Complete
      Confirmation: 5: User`,
  },

  // OTHER
  {
    id: 'mindmap',
    name: 'Mindmap',
    icon: '🧠',
    description: 'Hierarchical ideas',
    category: 'other',
    code: `mindmap
  root((Central Idea))
    Topic 1
      Subtopic A
      Subtopic B
    Topic 2
      Subtopic C
      Subtopic D
    Topic 3`,
  },
  {
    id: 'git',
    name: 'Git Graph',
    icon: '🌿',
    description: 'Git branching',
    category: 'other',
    code: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit`,
  },
  {
    id: 'quadrant',
    name: 'Quadrant Chart',
    icon: '📈',
    description: 'Priority matrix',
    category: 'other',
    code: `quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Eliminate
    Task A: [0.3, 0.8]
    Task B: [0.7, 0.7]
    Task C: [0.5, 0.3]`,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: '⏱️',
    description: 'Historical timeline',
    category: 'other',
    code: `timeline
    title Product History
    section 2021
        Q1 : Planning
        Q2 : Development
    section 2022
        Q1 : Beta Launch
        Q2 : Public Release`,
  },
];

export const getTemplatesByCategory = (category: DiagramTemplate['category']) => {
  return diagramTemplates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return diagramTemplates.find(t => t.id === id);
};
