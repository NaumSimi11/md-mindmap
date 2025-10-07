# 🛠️ Development Setup Guide

This guide will get you up and running with MD Creator development in under 10 minutes.

## 📋 Prerequisites

### **Required Software**

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18+ | Frontend development | [Download](https://nodejs.org/) |
| **Rust** | Latest stable | Tauri backend | [Install](https://rustup.rs/) |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |

### **Optional but Recommended**

- **VS Code** with extensions:
  - [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 🚀 Quick Start

### **1. Clone Repository**

```bash
git clone <repository-url>
cd mdtauri-main
```

### **2. Install Dependencies**

```bash
# Install Node.js dependencies
npm install

# Verify Rust installation
rustc --version
cargo --version
```

### **3. Set Up Environment**

Create `.env.local` file for AI features:

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your API keys
code .env.local  # or nano .env.local
```

**Example `.env.local`:**
```bash
# AI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-key-here
VITE_AI_ENABLED=true
VITE_AI_DEFAULT_PROVIDER=openai
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
VITE_AI_DEBUG=false

# Optional: Anthropic
VITE_ANTHROPIC_API_KEY=your-anthropic-key-here
```

### **4. Start Development**

```bash
# Start desktop app with hot reload
npm run tauri dev

# OR start web version only
npm run dev
```

**Expected Output:**
```
🔍 Loaded environment variables: [
  'VITE_OPENAI_API_KEY',
  'VITE_AI_ENABLED',
  'VITE_AI_DEFAULT_PROVIDER'
]

VITE v6.3.6  ready in 160 ms
➜  Local:   http://localhost:1420/

Running BeforeDevCommand (`npm run dev`)
   Compiling tauri-app v0.1.0
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 3.37s
     Running `target/debug/tauri-app`
```

🎉 **Success!** You should now see:
- **Desktop**: Native window opens automatically
- **Web**: Browser opens to `http://localhost:1420/`

## 📁 Project Structure

```
mdtauri-main/
├── src/                          # Frontend Vue.js code
│   ├── components/              # Vue components
│   │   ├── editor/             # Markdown editor components
│   │   ├── AIGeneration/       # AI-powered features
│   │   └── WorkspaceSelector.vue # Desktop workspace setup
│   ├── composables/            # Vue composables (business logic)
│   │   ├── useAI.js           # AI service integration
│   │   └── useMindmap.js      # Mindmap functionality
│   ├── stores/                 # Pinia state management
│   │   ├── documents.js       # Document storage (legacy)
│   │   ├── documentsHybrid.js # New hybrid storage system
│   │   ├── aiConfig.js        # AI configuration
│   │   └── mindmap.js         # Mindmap state
│   ├── services/              # Service layer
│   │   ├── AIService.js       # AI provider abstraction
│   │   └── MindmapGenerator.js # Mindmap generation
│   └── config/               # Configuration files
│       └── aiConfig.js       # AI provider configuration
├── src-tauri/                # Rust backend code
│   ├── src/
│   │   ├── commands/         # Tauri command implementations
│   │   │   ├── file_operations.rs # File system operations
│   │   │   └── mod.rs        # Module exports
│   │   ├── lib.rs           # Main library file
│   │   └── main.rs          # Entry point
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── docs/                    # Documentation (this folder!)
├── public/                  # Static assets
└── package.json            # Node.js dependencies
```

## 🔧 Development Commands

### **Core Commands**

```bash
# Desktop development (recommended)
npm run tauri dev                # Hot reload desktop app

# Web development
npm run dev                      # Hot reload web app

# Building
npm run tauri build             # Build desktop app for production
npm run build                   # Build web app for production

# Testing
npm run test                    # Run tests
npm run test:watch             # Run tests in watch mode
```

### **Useful Development Commands**

```bash
# Check code quality
npm run lint                    # ESLint
npm run format                  # Prettier

# Tauri-specific
npm run tauri info             # System info for debugging
npm run tauri deps             # Check dependencies
cargo check                    # Check Rust code (in src-tauri/)
```

## 🐛 Debugging Setup

### **Browser DevTools (Web)**

1. Open browser DevTools (F12)
2. Check Console for Vue/JS errors
3. Check Network tab for API calls
4. Use Vue DevTools extension

### **Desktop App Debugging**

1. **Console Logs**: Check terminal where you ran `npm run tauri dev`
2. **Web Inspector**: Right-click in app → "Inspect Element"
3. **Rust Logs**: Add `println!()` in Rust code
4. **Tauri DevTools**: Built-in developer tools

### **AI Debugging**

Enable debug mode in `.env.local`:
```bash
VITE_AI_DEBUG=true
```

This will log:
- API requests/responses
- Token usage
- Error details
- Generation progress

### **File System Debugging (Desktop)**

Check file operations:
```javascript
// In browser console
console.log('Platform:', window.__TAURI__ ? 'desktop' : 'web')

// Check if commands are working
const { invoke } = window.__TAURI__.tauri
invoke('greet', { name: 'Developer' }).then(console.log)
```

## 🧪 Testing Strategy

### **Running Tests**

```bash
# All tests
npm run test

# Specific test files
npm run test -- --grep "AIService"
npm run test -- --grep "DocumentStore"

# Watch mode for development
npm run test:watch
```

### **Test Structure**

```
tests/
├── unit/                   # Unit tests
│   ├── services/          # Service layer tests
│   ├── stores/           # State management tests
│   └── components/       # Component tests
├── integration/          # Integration tests
│   ├── ai-workflow.test.js    # AI feature testing
│   └── file-operations.test.js # File system testing
└── e2e/                  # End-to-end tests
    └── app-workflow.test.js   # Full app testing
```

### **Writing Tests**

```javascript
// Example: Testing AI service
import { describe, it, expect, vi } from 'vitest'
import { AIService } from '@/services/AIService.js'

describe('AIService', () => {
  it('should generate mermaid diagrams', async () => {
    const service = new AIService()
    
    // Mock API response
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'flowchart TD\nA --> B' } }]
      })
    })
    
    const result = await service.generateMermaidDiagram('user login')
    
    expect(result).toContain('flowchart')
    expect(result).toContain('A --> B')
  })
})
```

## 🔐 Environment Configuration

### **Required Environment Variables**

```bash
# Minimum for AI features
VITE_OPENAI_API_KEY=sk-...     # Required for AI features
VITE_AI_ENABLED=true           # Enable/disable AI features

# Optional configuration
VITE_AI_DEFAULT_PROVIDER=openai     # openai | anthropic
VITE_AI_MAX_TOKENS=2000            # Token limit per request
VITE_AI_TEMPERATURE=0.7            # Creativity level (0-1)
VITE_AI_DEBUG=false                # Debug logging
VITE_AI_TIMEOUT_MS=30000           # Request timeout
```

### **Getting API Keys**

#### **OpenAI (Recommended)**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create account and add payment method
3. Click "Create new secret key"
4. Copy key (starts with `sk-`)
5. Add to `.env.local`

#### **Anthropic (Optional)**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create account
3. Get API key from dashboard
4. Add to `.env.local`

### **Environment Files**

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Example configuration | ✅ Tracked |
| `.env.local` | Your actual configuration | ❌ Ignored |
| `.env.development` | Development defaults | ✅ Tracked |
| `.env.production` | Production defaults | ✅ Tracked |

## 🚀 Performance Tips

### **Development Performance**

```bash
# Faster Rust compilation (add to ~/.cargo/config.toml)
[build]
rustflags = ["-C", "link-arg=-fuse-ld=lld"]  # Linux/Windows
# rustflags = ["-C", "link-arg=-fuse-ld=zld"]  # macOS

# Use faster linker
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]
```

### **Web Bundle Optimization**

```javascript
// vite.config.js - already configured
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
          ai: ['@/services/AIService.js'],
          editor: ['markdown-it', 'mermaid']
        }
      }
    }
  }
}
```

## 🐛 Common Issues & Solutions

### **Issue: Rust compilation fails**

```bash
# Update Rust
rustup update

# Clear cargo cache
cargo clean

# Reinstall dependencies
rm Cargo.lock
cargo build
```

### **Issue: Node modules errors**

```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install
```

### **Issue: Tauri commands not found**

Check that commands are registered in `src-tauri/src/lib.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    select_workspace_folder,  // ← Make sure your commands are here
    save_document_to_file,
    // ...
])
```

### **Issue: AI features not working**

1. Check `.env.local` exists and has valid API key
2. Verify environment variables are loaded:
   ```javascript
   console.log('AI Config:', import.meta.env)
   ```
3. Check browser console for API errors
4. Enable debug mode: `VITE_AI_DEBUG=true`

### **Issue: File operations fail on desktop**

1. Check workspace folder permissions
2. Verify Tauri commands are working:
   ```javascript
   await invoke('greet', { name: 'test' })
   ```
3. Check terminal output for Rust errors

## 📚 Learning Resources

### **Framework Documentation**
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Tauri Guides](https://tauri.app/v1/guides/)
- [Pinia State Management](https://pinia.vuejs.org/)
- [Vite Build Tool](https://vitejs.dev/guide/)

### **Project-Specific Resources**
- [Architecture Overview](../architecture/storage-auth-system.md)
- [AI Integration Guide](../architecture/ai-integration.md)
- [API Reference](../api/tauri-commands.md)

## 🤝 Contributing Workflow

### **Before Starting**

1. **Read documentation** - Start with [Architecture](../architecture/)
2. **Set up environment** - Follow this guide
3. **Run tests** - Ensure everything works: `npm test`

### **Development Process**

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**:
   - Update documentation first (if needed)
   - Write tests for new functionality
   - Implement the feature
   - Update relevant docs

3. **Test thoroughly**:
   ```bash
   npm run test        # Unit tests
   npm run lint        # Code quality
   npm run tauri dev   # Manual testing
   ```

4. **Commit with clear messages**:
   ```bash
   git add .
   git commit -m "feat: add workspace folder selection for desktop"
   ```

5. **Submit for review**

### **Code Standards**

- **JavaScript**: Use ESLint configuration
- **Vue**: Use Composition API style
- **Rust**: Follow `cargo fmt` formatting
- **Documentation**: Update relevant docs with changes

---

**🎉 You're all set!** Happy coding! If you run into issues, check the [troubleshooting section](#🐛-common-issues--solutions) or create an issue.

**Last Updated**: September 2024  
**Next Review**: October 2024
