# Fixed Mermaid Diagram Example

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        UI["User Interface"]
        StateManager["State Management"]
        DocumentRenderer["Document Renderer"]
        VersionControl["Version Control UI"]
        n1["Untitled Node"]
        n2["Untitled Node"]
    end
    
    subgraph Backend["Backend Layer"]
        API["API Gateway"]
        ConversationEngine["Conversation Engine"]
        DocumentBuilder["Document Builder"]
        ValidationEngine["Validation Engine"]
        VersionManager["Version Manager"]
    end
    
    subgraph Integration["Integration Layer"]
        IDEPlugins["IDE Plugins"]
        GitIntegration["Git Integration"]
        APIClients["API Clients"]
    end
    
    subgraph Storage["Storage Layer"]
        Database[("Database")]
        FileStorage[("File Storage")]
    end
    
    subgraph AI["AI Layer"]
        LLM["Large Language Model"]
        EntityExtractor["Entity Extractor"]
        ContextAnalyzer["Context Analyzer"]
    end
    
    UI --> StateManager
    UI --> API
    StateManager --> DocumentRenderer
    StateManager --> VersionControl
    API --> ConversationEngine
    API --> DocumentBuilder
    API --> ValidationEngine
    API --> VersionManager
    ConversationEngine --> LLM
    ConversationEngine --> Database
    DocumentBuilder --> LLM
    DocumentBuilder --> Database
    DocumentBuilder --> FileStorage
    ValidationEngine --> LLM
    ValidationEngine --> Database
    LLM --> EntityExtractor
    LLM --> ContextAnalyzer
    VersionManager --> Database
    VersionManager --> FileStorage
    IDEPlugins --> API
    GitIntegration --> API
    APIClients --> API
    DocumentRenderer --> n1
    DocumentRenderer --> n2
```

## What Was Fixed:

1. **Removed the `---` config block** - This can cause parsing issues
2. **Replaced compound arrows** - Changed `UI --> StateManager & API` to separate lines
3. **Simplified subgraph names** - Used descriptive names instead of `subGraph0`, `subGraph1`, etc.
4. **Maintained the same visual structure** - The diagram looks identical but uses compatible syntax
