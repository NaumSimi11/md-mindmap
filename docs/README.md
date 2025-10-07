# 📚 MD Creator Documentation

Welcome to the MD Creator documentation! This folder contains all technical documentation, architecture decisions, and implementation guides.

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - main index
├── architecture/                # System architecture & design
│   ├── storage-auth-system.md  # Storage & Authentication Architecture
│   ├── ai-integration.md       # AI Services Integration
│   └── platform-differences.md # Desktop vs Web Platform Handling
├── development/                 # Development guides
│   ├── setup.md               # Development environment setup
│   ├── building.md             # Building for different platforms
│   └── testing.md              # Testing strategies
├── api/                        # API documentation
│   ├── tauri-commands.md       # Tauri backend commands
│   ├── ai-services.md          # AI service API
│   └── stores.md               # Frontend stores documentation
└── deployment/                 # Deployment guides
    ├── desktop.md              # Desktop app deployment
    └── web.md                  # Web app deployment
```

## 🚀 Quick Start

1. **New to the project?** Start with [Architecture Overview](architecture/storage-auth-system.md)
2. **Setting up development?** Check [Development Setup](development/setup.md)
3. **Working with AI features?** See [AI Integration](architecture/ai-integration.md)
4. **Building for production?** Review [Building Guide](development/building.md)

## 🧭 Product Flows (Web-first)

- Guest Dashboard Spec: See [Guest Dashboard & Trial Flows](development/guest-dashboard.md)
- Web vs Desktop Strategy: See [Platform Differences](architecture/platform-differences.md)
- Migration Plan (Vue→React, JS→TS): See [Modernization Roadmap](../MODERNIZATION_ROADMAP.md)
- Ultimate Mindmap: See [Mindmap Roadmap](development/mindmap-roadmap.md)
- Mindmap Enhancement Plan: See [Mindmap Studio Enhancements](development/mindmap-studio-enhancements.md)

## 🎯 Key Features Documented

- **🔄 Hybrid Storage System** - Desktop file system + Web browser storage
- **🤖 AI Integration** - OpenAI & Anthropic API integration
- **📱 Platform Detection** - Automatic desktop vs web adaptation
- **⚡ Real-time Features** - Live preview, auto-save, AI generation
- **🗂️ Workspace Management** - Folder-based organization for desktop
- **🎨 Slideshow Presentations** - Generate beautiful presentations from Editor + Mindmap content
- **🏷️ Smart Annotations** - Icons, labels, and conditional branches on mindmap nodes and edges
- **💬 Conversational Brainstorming** - ChatGPT-style AI brainstorming mode for mindmap creation

## 📝 Recent Updates

- **2025-01**: Implemented Conversational Brainstorming Mode (ChatGPT-style AI)
- **2025-01**: Added dual-mode AI chat (Brainstorm + Command)
- **2024-12**: Built Slideshow Presentations & Smart Annotations features
- **2024-09**: Implemented hybrid storage/auth architecture
- **2024-09**: Added Tauri file system commands
- **2024-09**: Created platform-aware document management
- **2024-09**: Integrated AI services with proper error handling

## 🤝 Contributing

When adding new features or making architectural changes:

1. **Document first** - Update relevant docs before coding
2. **Update this index** - Keep the structure current
3. **Add examples** - Include code examples and diagrams
4. **Test documentation** - Ensure examples work

## 🔗 External Links

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia State Management](https://pinia.vuejs.org/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Last Updated**: September 2024  
**Version**: 1.0.0
