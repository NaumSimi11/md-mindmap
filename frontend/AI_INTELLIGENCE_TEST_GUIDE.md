# 🧪 AI INTELLIGENCE TEST GUIDE

**Test the new intelligent AI chat system with these real-world scenarios!**

---

## 🎯 Test Scenario 1: Prerequisites Section

**User Message:**
```
"What are the prerequisites for this project?"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `prerequisites`
2. ✅ Chooses format: `checkbox-unchecked`
3. ✅ Creates checkboxes with `- [ ]` (unchecked)
4. ✅ Adds relevant icons (🔧)

**Expected Output:**
```markdown
## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running locally
- [ ] Git configured
- [ ] API keys from the dashboard
- [ ] Environment variables set up
```

---

## 🎯 Test Scenario 2: Features List

**User Message:**
```
"List the key features of this application"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `features`
2. ✅ Chooses format: `bullets-with-icons`
3. ✅ Uses bullet points with relevant emojis
4. ✅ NO checkboxes (features are not actionable)

**Expected Output:**
```markdown
## Key Features

- 🚀 **Real-time Collaboration** - Work together seamlessly
- 🔒 **End-to-end Encryption** - Your data stays secure
- 📱 **Cross-platform Support** - Works on all devices
- ⚡ **Lightning Fast** - Optimized for performance
- 🎨 **Beautiful UI** - Modern, intuitive design
```

---

## 🎯 Test Scenario 3: Installation Steps

**User Message:**
```
"How do I install this?"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `steps`
2. ✅ Chooses format: `numbered-list`
3. ✅ Uses sequential numbered steps
4. ✅ Includes code blocks where appropriate

**Expected Output:**
```markdown
## Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/user/repo.git
   cd repo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Copy `.env.example` to `.env` and fill in your values

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`
```

---

## 🎯 Test Scenario 4: Completed Tasks

**User Message:**
```
"Show what we've completed so far"
```

**Expected AI Behavior:**
1. ✅ Detects keywords: `completed`
2. ✅ Chooses format: `checkbox-checked`
3. ✅ Creates checkboxes with `- [x]` (checked)
4. ✅ Shows accomplishments

**Expected Output:**
```markdown
## Completed Tasks

- [x] Set up project structure
- [x] Configure TypeScript
- [x] Add testing framework
- [x] Implement authentication
- [x] Deploy to production
- [x] Add CI/CD pipeline
```

---

## 🎯 Test Scenario 5: TODO List

**User Message:**
```
"What tasks remain?"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `todo`
2. ✅ Chooses format: `checkbox-unchecked`
3. ✅ Creates actionable checkboxes `- [ ]`
4. ✅ Lists pending work

**Expected Output:**
```markdown
## Remaining Tasks

- [ ] Add payment integration
- [ ] Implement email notifications
- [ ] Create admin dashboard
- [ ] Write API documentation
- [ ] Add rate limiting
- [ ] Set up monitoring
```

---

## 🎯 Test Scenario 6: Comparison Table

**User Message:**
```
"Compare the different authentication methods"
```

**Expected AI Behavior:**
1. ✅ Detects keywords: `compare`
2. ✅ Chooses format: `table`
3. ✅ Creates structured comparison table
4. ✅ Includes relevant columns

**Expected Output:**
```markdown
## Authentication Methods Comparison

| Method | Security Level | Ease of Use | Best For |
|--------|----------------|-------------|----------|
| Password | Medium | High | Basic applications |
| MFA | High | Medium | Sensitive data |
| Biometric | Very High | High | Mobile apps |
| OAuth | High | Medium | Third-party integration |
| Certificate | Very High | Low | Enterprise systems |
```

---

## 🎯 Test Scenario 7: Mixed Progress Checklist

**User Message:**
```
"Create a security validation checklist"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `todo` + `validation`
2. ✅ Chooses format: `checkbox-mixed`
3. ✅ Some checked, some unchecked (realistic progress)

**Expected Output:**
```markdown
## Security Validation Checklist

Verify the following security measures:

- [x] HTTPS enabled on all endpoints
- [x] Environment variables secured
- [x] Database connections encrypted
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection protection added
- [ ] XSS prevention in place
- [ ] CSRF tokens implemented
```

---

## 🎯 Test Scenario 8: API Reference

**User Message:**
```
"Document the user API endpoints"
```

**Expected AI Behavior:**
1. ✅ Detects section type: `reference`
2. ✅ Chooses format: `code-block` + descriptions
3. ✅ Structured technical documentation

**Expected Output:**
```markdown
## User API Endpoints

### GET /api/users

Retrieve a list of all users.

**Request:**
```bash
curl -X GET https://api.example.com/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "users": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" }
  ]
}
```

### POST /api/users

Create a new user.

**Request:**
```bash
curl -X POST https://api.example.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```
```

---

## 🎯 Test Scenario 9: Context Awareness

**User Message (in a document that already has checkboxes):**
```
"Add more items to this section"
```

**Expected AI Behavior:**
1. ✅ Analyzes existing document patterns
2. ✅ Detects document already uses checkboxes
3. ✅ Matches existing format and style
4. ✅ Continues same checkbox state pattern

---

## 🎯 Test Scenario 10: Explicit Format Override

**User Message:**
```
"List the features using checkboxes"
```

**Expected AI Behavior:**
1. ✅ User explicitly requested checkboxes
2. ✅ Overrides default format (bullets) with checkboxes
3. ✅ Uses unchecked boxes (features aren't "done")

**Expected Output:**
```markdown
## Features

- [ ] Real-time collaboration
- [ ] End-to-end encryption
- [ ] Cross-platform support
- [ ] Lightning fast performance
```

---

## ✅ Success Criteria

For each test, verify:

1. **Format Detection** - AI chooses the RIGHT format automatically
2. **Checkbox State** - Checked vs unchecked is CORRECT
3. **Icon Usage** - Relevant, helpful icons are added
4. **Structure** - Content is well-organized and readable
5. **No Placeholders** - Real, useful content (not "content here...")
6. **Markdown Syntax** - Correct: `- [ ]`, `- [x]`, not `- []`
7. **Consistency** - Matches document style and patterns

---

## 🐛 Common Issues to Watch For

❌ **Wrong Format:**
- Using bullets for prerequisites (should be checkboxes)
- Using checkboxes for features (should be bullets)

❌ **Wrong Checkbox State:**
- Checked boxes for prerequisites (should be unchecked)
- Unchecked boxes for completed items (should be checked)

❌ **Bad Markdown:**
- `- []` instead of `- [ ]`
- `- [X]` instead of `- [x]`
- Missing space after hyphen

❌ **No Intelligence:**
- Generic responses that don't match context
- Asking user "what format do you want?"
- Placeholder content

---

## 🚀 How to Test

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open a document in the editor**

3. **Click the AI chat bubble** (bottom-right)

4. **Try each scenario above**

5. **Verify the AI:**
   - Chooses the right format
   - Uses correct checkbox states
   - Adds relevant icons
   - Creates beautiful, structured content

6. **Check the console** for intelligence logs:
   ```
   🧠 AI Intelligence: {
     documentType: 'technical',
     sectionType: 'prerequisites',
     userIntent: 'create',
     recommendedFormat: 'checkbox-unchecked',
     confidence: 'high'
   }
   ```

---

## 💡 Pro Tips

- The AI learns from your document patterns
- More context = better decisions
- The AI should feel like a **senior technical writer**
- If it asks "what format?", something is wrong!

**The AI should KNOW what to do!** 🧠✨



