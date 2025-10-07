# 🤖 AI Features Setup Guide

This guide helps you enable AI-powered features in MD Creator.

## 🚀 Quick Start

### 1. Create Environment File

Create a `.env.local` file in the root directory (same level as `package.json`):

```bash
# AI Configuration - Add your API keys here
# This file is automatically ignored by git for security

VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
VITE_AI_ENABLED=true
VITE_AI_DEFAULT_PROVIDER=openai

# Optional: Anthropic (Claude)
VITE_ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional: Custom settings
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
VITE_AI_DEBUG=false
```

### 2. Get API Keys

#### OpenAI (Recommended)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account and add billing information
3. Generate a new API key starting with `sk-`
4. Copy the key to your `.env.local` file

#### Anthropic (Optional)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get your API key
3. Add it to your `.env.local` file

### 3. Restart the App

After creating `.env.local`, restart the development server:

```bash
npm run dev
```

## 🎯 Available AI Features

Once configured, you'll have access to:

### 🧠 Smart Mindmap Generation
- Generate mindmaps from text descriptions
- Multiple templates (project structure, user journey, etc.)
- AI-powered node relationships

### 🔧 Mermaid Diagram Assistant
- Automatic syntax error detection
- AI-powered error fixing
- Diagram enhancement suggestions
- Template-based generation

### 📝 Content Generation
- Document structure creation
- Section enhancement
- Table generation
- Executive summaries

### 🔍 Intelligent Validation
- Real-time syntax checking
- Smart error correction
- Optimization suggestions

## ⚙️ Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `VITE_AI_ENABLED` | Enable/disable AI features | `false` |
| `VITE_AI_DEFAULT_PROVIDER` | Primary AI provider | `openai` |
| `VITE_AI_MAX_TOKENS` | Maximum tokens per request | `2000` |
| `VITE_AI_TEMPERATURE` | Creativity level (0-1) | `0.7` |
| `VITE_AI_DEBUG` | Enable debug logging | `false` |

## 🔒 Security Notes

- ✅ `.env.local` is automatically ignored by git
- ✅ API keys are never logged or exposed
- ✅ All requests are made securely over HTTPS
- ✅ Keys are validated before use

## 🛠️ Troubleshooting

### No AI Features Visible
1. Check that `.env.local` exists in the root directory
2. Verify `VITE_AI_ENABLED=true`
3. Restart the development server

### "Invalid API Key" Error
1. Check your API key format:
   - OpenAI keys start with `sk-`
   - Anthropic keys start with your assigned prefix
2. Verify the key is active in your provider dashboard
3. Check you have billing/credits available

### Features Not Working
1. Open browser DevTools (F12)
2. Check the Console tab for error messages
3. Enable debug mode: `VITE_AI_DEBUG=true`
4. Restart the app and check logs

## 💰 Cost Management

### Token Usage
- Most operations use 100-500 tokens
- Complex mindmaps may use 1000-2000 tokens
- Monitor usage in your provider dashboard

### Optimization Tips
- Use specific prompts for better results
- Start with GPT-3.5-turbo for testing (cheaper)
- Upgrade to GPT-4 for complex diagrams

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your `.env.local` configuration
3. Test your API key in the provider dashboard
4. Enable debug mode for detailed logs

## 📖 Example .env.local

```bash
# Working example configuration
VITE_OPENAI_API_KEY=sk-1234567890abcdef...
VITE_AI_ENABLED=true
VITE_AI_DEFAULT_PROVIDER=openai
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
VITE_AI_DEBUG=false
```

---

**🎉 You're all set!** Once configured, AI features will appear throughout the app with a 🤖 icon.

