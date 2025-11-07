# Gamma.app vs Our Presentation System: Template & Theme Analysis

## Executive Summary

This document analyzes how Gamma.app uses templates/themes for presentation generation and compares it with our current implementation. The goal is to identify improvements we can adopt to enhance our presentation generation capabilities.

---

## 🎨 Gamma.app's Template/Theme Approach

### Key Concepts

#### 1. **Theme System (`themeName`)**
- **Simple String-Based Selection**: Gamma uses theme names like `"Night Sky"`, `"Oasis"` as simple strings
- **Pre-defined Visual Styles**: Each theme includes colors, fonts, and overall aesthetic
- **Workspace Defaults**: Falls back to workspace default if not specified
- **No Complex Configuration**: Themes are "all-in-one" packages, not modular

**Example:**
```json
{
  "themeName": "Night Sky"
}
```

#### 2. **Card-Based Architecture**
Gamma uses a **card-based** system where:
- Each slide is a "card"
- Cards have configurable dimensions (`cardOptions.dimensions`)
- Cards can be split automatically or manually (`cardSplit`)
- Number of cards is configurable (`numCards`: 1-60)

**Card Splitting:**
- `"auto"`: AI automatically splits content into cards
- `"inputTextBreaks"`: Uses `\n---\n` delimiters in input text

**Card Dimensions:**
- Format-specific options (presentation, document, social)
- Default: `"fluid"` (responsive)
- Fixed ratios: `"16x9"`, `"4x3"`, etc.

#### 3. **Content Processing Modes (`textMode`)**
Three distinct modes for handling input:

1. **`"generate"`** (default)
   - Rewrites and expands input text
   - Uses AI to create new content
   - Applies tone, audience, amount settings

2. **`"condense"`**
   - Summarizes input text
   - Reduces content while maintaining key points
   - Useful for dense source material

3. **`"preserve"`**
   - Retains exact text from input
   - Only structures/reformats, doesn't rewrite
   - Good for finalized content

#### 4. **Text Customization (`textOptions`)**
Granular control over text generation:

```json
{
  "textOptions": {
    "amount": "brief" | "medium" | "detailed" | "extensive",
    "tone": "professional, inspiring" (1-500 chars, multiple keywords),
    "audience": "outdoors enthusiasts" (1-500 chars, multiple keywords),
    "language": "en" | "es" | etc.
  }
}
```

**Key Features:**
- **Amount**: Controls detail level per card
- **Tone**: Multiple keywords allowed (comma-separated)
- **Audience**: Tailors language and complexity
- **Language**: Independent of input language

#### 5. **Image Generation (`imageOptions`)**
Sophisticated image handling:

```json
{
  "imageOptions": {
    "source": "aiGenerated" | "pictographic" | "unsplash" | "giphy" | "noImages",
    "model": "flux-1-pro" | "imagen-4-pro" | "gamma-v1.0",
    "style": "minimal, black and white, line art" (multiple keywords)
  }
}
```

**Key Features:**
- Multiple image sources (AI, stock photos, icons, GIFs)
- Model selection for AI generation
- Style keywords for visual consistency
- Can disable images entirely

#### 6. **Layout Instructions (`additionalInstructions`)**
Free-form guidance for AI:

```json
{
  "additionalInstructions": "Make the card headings humorous and catchy"
}
```

- 1-500 character limit
- Allows custom layout/content guidance
- Complements structured options

---

## 🔍 Our Current System

### What We Have

#### 1. **Theme System**
**Location:** `src/services/presentation/PresentationThemes.ts`

**Current Implementation:**
```typescript
export interface PresentationTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: 'compact' | 'normal' | 'spacious';
}
```

**Available Themes:**
- `modern` - Purple gradient, clean
- `professional` - Navy blue, corporate
- `minimal` - Black & white, simple
- `dark` - Dark with gold accents
- `vibrant` - Pink/purple, energetic
- `corporate` - Green, business

**Strengths:**
- ✅ Structured theme objects
- ✅ Multiple theme options
- ✅ Color and font customization

**Limitations:**
- ❌ No theme preview/description in UI
- ❌ Fixed theme structure (can't extend easily)
- ❌ No theme-specific layout rules

#### 2. **Slide Generation**
**Location:** `src/services/presentation/PresentationGenerator.ts`

**Current Flow:**
1. Analyze content (editor + mindmap)
2. Get AI suggestions for structure
3. Generate slides from structure
4. Generate speaker notes (optional)

**Slide Types:**
- `title`, `content`, `bullets`, `two-column`, `image`, `diagram`, `mindmap`, `quote`, `section`, `blank`

**Strengths:**
- ✅ Multiple layout types
- ✅ Supports diagrams and mindmaps
- ✅ Speaker notes generation

**Limitations:**
- ❌ No text processing modes (generate/condense/preserve)
- ❌ No text customization (tone, audience, amount)
- ❌ No card dimensions/aspect ratio control
- ❌ No additional instructions parameter

#### 3. **Wizard Configuration**
**Location:** `src/components/presentation/PresentationWizardModal.tsx`

**Current Options:**
- Slide count (3-20)
- Theme selection (dropdown)
- Background type (gradient/solid/image)
- Speaker notes toggle

**Limitations:**
- ❌ No text mode selection
- ❌ No tone/audience customization
- ❌ No image generation options
- ❌ No additional instructions field
- ❌ No card dimension options

---

## 💡 Key Learnings from Gamma

### 1. **Text Processing Modes**
**What Gamma Does:**
- Offers 3 modes: generate, condense, preserve
- Users can choose based on their needs
- Each mode serves different use cases

**What We Should Add:**
```typescript
type TextMode = 'generate' | 'condense' | 'preserve';

interface GenerationSettings {
  // ... existing fields
  textMode: TextMode;
}
```

**Benefits:**
- Users can control how AI processes their content
- `preserve` mode for finalized content
- `condense` mode for dense source material

### 2. **Text Customization Options**
**What Gamma Does:**
- `amount`: Controls detail level
- `tone`: Multiple keywords for voice
- `audience`: Tailors content to specific groups
- `language`: Independent language selection

**What We Should Add:**
```typescript
interface TextOptions {
  amount?: 'brief' | 'medium' | 'detailed' | 'extensive';
  tone?: string; // Multiple keywords: "professional, inspiring"
  audience?: string; // "outdoors enthusiasts, adventure seekers"
  language?: string; // "en", "es", etc.
}
```

**Benefits:**
- Better control over AI output
- Audience-specific content
- Multi-language support

### 3. **Card/Slide Dimensions**
**What Gamma Does:**
- `cardOptions.dimensions`: Controls aspect ratio
- Format-specific options
- `"fluid"` for responsive layouts

**What We Should Add:**
```typescript
interface SlideOptions {
  dimensions?: 'fluid' | '16x9' | '4x3' | 'square';
  aspectRatio?: number; // Custom ratio
}
```

**Benefits:**
- Better control over slide layout
- Support for different presentation formats
- Responsive vs fixed aspect ratios

### 4. **Additional Instructions**
**What Gamma Does:**
- Free-form text field (1-500 chars)
- Allows custom guidance
- Complements structured options

**What We Should Add:**
```typescript
interface GenerationSettings {
  // ... existing fields
  additionalInstructions?: string; // 1-500 chars
}
```

**Benefits:**
- Users can provide custom guidance
- More flexible than structured options alone
- Better AI understanding of user intent

### 5. **Image Generation Options**
**What Gamma Does:**
- Multiple image sources
- AI model selection
- Style keywords

**What We Should Add:**
```typescript
interface ImageOptions {
  source?: 'aiGenerated' | 'unsplash' | 'pictographic' | 'none';
  model?: string; // When source is 'aiGenerated'
  style?: string; // Style keywords
}
```

**Benefits:**
- Better image control
- Consistent visual style
- Multiple image sources

### 6. **Structured Input with Delimiters**
**What Gamma Does:**
- Uses `\n---\n` to split cards manually
- `cardSplit: "inputTextBreaks"` mode
- Gives users control over structure

**What We Should Add:**
```typescript
// Support for structured markdown input
// Use --- or ---\n to split slides
const structuredInput = `
# Slide 1
Content here
---
# Slide 2
More content
`;
```

**Benefits:**
- Users can pre-structure content
- More predictable slide generation
- Better control over slide boundaries

---

## 🚀 Recommended Improvements

### Phase 1: Quick Wins (1-2 weeks)

#### 1. **Add Text Mode Selection**
```typescript
// In PresentationWizardModal.tsx
const [textMode, setTextMode] = useState<'generate' | 'condense' | 'preserve'>('generate');

// Add to UI:
<Select value={textMode} onValueChange={setTextMode}>
  <SelectItem value="generate">Generate & Expand</SelectItem>
  <SelectItem value="condense">Condense & Summarize</SelectItem>
  <SelectItem value="preserve">Preserve Exact Text</SelectItem>
</Select>
```

#### 2. **Add Additional Instructions Field**
```typescript
// In PresentationWizardModal.tsx
const [additionalInstructions, setAdditionalInstructions] = useState('');

// Add to UI:
<Textarea
  placeholder="E.g., 'Make headings catchy', 'Use bullet points', 'Keep it concise'"
  value={additionalInstructions}
  onChange={(e) => setAdditionalInstructions(e.target.value)}
  maxLength={500}
/>
```

#### 3. **Add Text Options (Tone & Audience)**
```typescript
// In PresentationWizardModal.tsx
const [tone, setTone] = useState('professional');
const [audience, setAudience] = useState('');

// Add to UI:
<Input
  placeholder="E.g., 'professional, inspiring' or 'casual, friendly'"
  value={tone}
  onChange={(e) => setTone(e.target.value)}
/>
<Input
  placeholder="E.g., 'outdoors enthusiasts' or 'seven year olds'"
  value={audience}
  onChange={(e) => setAudience(e.target.value)}
/>
```

### Phase 2: Enhanced Features (2-3 weeks)

#### 4. **Add Card Dimensions**
```typescript
// In PresentationWizardModal.tsx
const [cardDimensions, setCardDimensions] = useState<'fluid' | '16x9' | '4x3'>('fluid');

// Add to UI:
<Select value={cardDimensions} onValueChange={setCardDimensions}>
  <SelectItem value="fluid">Fluid (Responsive)</SelectItem>
  <SelectItem value="16x9">16:9 (Widescreen)</SelectItem>
  <SelectItem value="4x3">4:3 (Standard)</SelectItem>
</Select>
```

#### 5. **Add Text Amount Control**
```typescript
// In PresentationWizardModal.tsx
const [textAmount, setTextAmount] = useState<'brief' | 'medium' | 'detailed'>('medium');

// Add to UI:
<Select value={textAmount} onValueChange={setTextAmount}>
  <SelectItem value="brief">Brief (Concise)</SelectItem>
  <SelectItem value="medium">Medium (Balanced)</SelectItem>
  <SelectItem value="detailed">Detailed (Comprehensive)</SelectItem>
</Select>
```

#### 6. **Support Structured Input**
```typescript
// In PresentationGenerator.ts
private parseStructuredInput(input: string): SlideStructure {
  // Split by --- or ---\n
  const slides = input.split(/\n---\n?/).map((content, index) => {
    // Parse markdown headings, bullets, etc.
    return this.parseSlideContent(content, index);
  });
  return { slides, totalSlides: slides.length };
}
```

### Phase 3: Advanced Features (3-4 weeks)

#### 7. **Image Generation Options**
```typescript
// In PresentationWizardModal.tsx
const [imageSource, setImageSource] = useState<'aiGenerated' | 'unsplash' | 'none'>('none');
const [imageStyle, setImageStyle] = useState('');

// Add to UI:
<Select value={imageSource} onValueChange={setImageSource}>
  <SelectItem value="none">No Images</SelectItem>
  <SelectItem value="unsplash">Stock Photos</SelectItem>
  <SelectItem value="aiGenerated">AI Generated</SelectItem>
</Select>
```

#### 8. **Enhanced Theme System**
```typescript
// Extend PresentationTheme interface
export interface PresentationTheme {
  // ... existing fields
  layoutRules?: {
    defaultSlideType?: SlideLayout;
    preferredImageStyle?: string;
    cardDimensions?: string;
  };
  preview?: {
    thumbnail: string;
    description: string;
  };
}
```

---

## 📊 Comparison Table

| Feature | Gamma.app | Our System | Priority |
|---------|-----------|------------|----------|
| **Theme Selection** | ✅ String-based (`themeName`) | ✅ Object-based (structured) | ✅ Good |
| **Text Modes** | ✅ generate/condense/preserve | ❌ Not implemented | 🔴 High |
| **Text Tone** | ✅ Multiple keywords | ❌ Not implemented | 🟡 Medium |
| **Text Audience** | ✅ Custom audience | ❌ Not implemented | 🟡 Medium |
| **Text Amount** | ✅ brief/medium/detailed/extensive | ❌ Not implemented | 🟡 Medium |
| **Card Dimensions** | ✅ fluid/16x9/4x3 | ❌ Not implemented | 🟡 Medium |
| **Additional Instructions** | ✅ Free-form (1-500 chars) | ❌ Not implemented | 🔴 High |
| **Image Generation** | ✅ Multiple sources + styles | ⚠️ Basic (background only) | 🟡 Medium |
| **Structured Input** | ✅ `\n---\n` delimiters | ❌ Not implemented | 🟡 Medium |
| **Speaker Notes** | ❌ Not mentioned | ✅ Implemented | ✅ Good |
| **Multiple Layouts** | ⚠️ Card-based only | ✅ 10+ layout types | ✅ Good |
| **Mindmap Support** | ❌ Not mentioned | ✅ Full support | ✅ Good |

---

## 🎯 Implementation Priority

### **High Priority** (Implement First)
1. **Text Mode Selection** - Critical for user control
2. **Additional Instructions** - High user value, easy to implement

### **Medium Priority** (Implement Next)
3. **Text Options** (tone, audience, amount) - Better AI output
4. **Card Dimensions** - Better layout control
5. **Structured Input** - Better user control

### **Low Priority** (Nice to Have)
6. **Image Generation Options** - Requires image generation service
7. **Enhanced Theme System** - Polish and refinement

---

## 🔧 Technical Implementation Notes

### 1. **Updating GenerationSettings Interface**
```typescript
// src/components/presentation/PresentationWizardModal.tsx
export interface GenerationSettings {
  slideCount: number;
  theme: string;
  background: 'gradient' | 'solid' | 'image';
  generateNotes: boolean;
  
  // NEW FIELDS
  textMode?: 'generate' | 'condense' | 'preserve';
  textOptions?: {
    amount?: 'brief' | 'medium' | 'detailed' | 'extensive';
    tone?: string;
    audience?: string;
    language?: string;
  };
  cardOptions?: {
    dimensions?: 'fluid' | '16x9' | '4x3';
  };
  imageOptions?: {
    source?: 'aiGenerated' | 'unsplash' | 'pictographic' | 'none';
    style?: string;
  };
  additionalInstructions?: string;
}
```

### 2. **Updating AI Prompts**
```typescript
// In PresentationGenerator.ts
private buildStructurePrompt(
  editorAnalysis: ContentAnalysis,
  mindmapAnalysis: MindmapAnalysis | null,
  options: GenerateOptions
): string {
  const textMode = options.textMode || 'generate';
  const tone = options.textOptions?.tone || 'professional';
  const audience = options.textOptions?.audience || '';
  const amount = options.textOptions?.amount || 'medium';
  const instructions = options.additionalInstructions || '';

  return `
You are a presentation expert. Generate a ${amount} presentation with a ${tone} tone.
${audience ? `Target audience: ${audience}` : ''}
${instructions ? `Additional instructions: ${instructions}` : ''}

Text processing mode: ${textMode}
${textMode === 'preserve' ? 'Preserve exact text from source.' : ''}
${textMode === 'condense' ? 'Summarize and condense content.' : ''}
${textMode === 'generate' ? 'Expand and enhance content.' : ''}

// ... rest of prompt
  `;
}
```

### 3. **Updating Slide Generation**
```typescript
// In PresentationGenerator.ts
private async generateSlideContent(
  suggestion: SlideSuggestion,
  options: GenerateOptions
): Promise<SlideContent> {
  const textMode = options.textMode || 'generate';
  const tone = options.textOptions?.tone || 'professional';
  const amount = options.textOptions?.amount || 'medium';

  const prompt = `
Generate slide content for: "${suggestion.title}"

Mode: ${textMode}
Tone: ${tone}
Detail level: ${amount}
${options.additionalInstructions ? `Instructions: ${options.additionalInstructions}` : ''}

// ... rest of prompt
  `;

  // Generate based on textMode
  if (textMode === 'preserve') {
    // Use exact content from source
  } else if (textMode === 'condense') {
    // Summarize content
  } else {
    // Generate/expand content
  }
}
```

---

## 📝 Example: Enhanced Wizard UI

```typescript
// Enhanced PresentationWizardModal with Gamma-inspired options

<div className="space-y-6">
  {/* Existing: Slide Count, Theme, Background */}
  
  {/* NEW: Text Mode */}
  <div className="space-y-2">
    <Label>Text Processing Mode</Label>
    <Select value={textMode} onValueChange={setTextMode}>
      <SelectItem value="generate">
        <div>
          <div className="font-medium">Generate & Expand</div>
          <div className="text-xs text-muted-foreground">
            AI will rewrite and expand your content
          </div>
        </div>
      </SelectItem>
      <SelectItem value="condense">
        <div>
          <div className="font-medium">Condense & Summarize</div>
          <div className="text-xs text-muted-foreground">
            AI will summarize dense content
          </div>
        </div>
      </SelectItem>
      <SelectItem value="preserve">
        <div>
          <div className="font-medium">Preserve Exact Text</div>
          <div className="text-xs text-muted-foreground">
            Keep your text as-is, only structure it
          </div>
        </div>
      </SelectItem>
    </Select>
  </div>

  {/* NEW: Text Options (Collapsible) */}
  <Collapsible>
    <CollapsibleTrigger>
      <Label>Text Customization</Label>
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-3 mt-2">
      <div>
        <Label className="text-sm">Tone</Label>
        <Input
          placeholder="e.g., 'professional, inspiring'"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-sm">Audience</Label>
        <Input
          placeholder="e.g., 'outdoors enthusiasts'"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-sm">Detail Level</Label>
        <Select value={textAmount} onValueChange={setTextAmount}>
          <SelectItem value="brief">Brief</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="detailed">Detailed</SelectItem>
        </Select>
      </div>
    </CollapsibleContent>
  </Collapsible>

  {/* NEW: Additional Instructions */}
  <div className="space-y-2">
    <Label>Additional Instructions (Optional)</Label>
    <Textarea
      placeholder="E.g., 'Make headings catchy', 'Use bullet points', 'Keep it concise'"
      value={additionalInstructions}
      onChange={(e) => setAdditionalInstructions(e.target.value)}
      maxLength={500}
      rows={3}
    />
    <p className="text-xs text-muted-foreground">
      {additionalInstructions.length}/500 characters
    </p>
  </div>

  {/* NEW: Card Dimensions */}
  <div className="space-y-2">
    <Label>Slide Dimensions</Label>
    <Select value={cardDimensions} onValueChange={setCardDimensions}>
      <SelectItem value="fluid">Fluid (Responsive)</SelectItem>
      <SelectItem value="16x9">16:9 (Widescreen)</SelectItem>
      <SelectItem value="4x3">4:3 (Standard)</SelectItem>
    </Select>
  </div>
</div>
```

---

## 🎓 Key Takeaways

### What Gamma Does Well
1. **Simple Theme Selection** - String-based, easy to use
2. **Text Processing Modes** - Gives users control
3. **Granular Text Options** - Tone, audience, amount
4. **Additional Instructions** - Flexible customization
5. **Card Dimensions** - Layout control
6. **Structured Input** - User control over structure

### What We Do Well
1. **Structured Themes** - More flexible than Gamma
2. **Multiple Layout Types** - More variety than cards
3. **Mindmap Support** - Unique feature
4. **Speaker Notes** - Not in Gamma
5. **Diagram Support** - Mermaid integration

### What We Should Adopt
1. ✅ **Text Processing Modes** - High value, easy to implement
2. ✅ **Additional Instructions** - High value, easy to implement
3. ✅ **Text Options** - Better AI output
4. ✅ **Card Dimensions** - Better layout control
5. ✅ **Structured Input** - Better user control

---

## 🚦 Next Steps

1. **Review this document** with the team
2. **Prioritize features** based on user needs
3. **Implement Phase 1** (Text Mode + Additional Instructions)
4. **Test with users** and gather feedback
5. **Iterate** based on feedback
6. **Implement Phase 2** (Text Options + Card Dimensions)

---

## 📚 References

- **Gamma.app API Docs**: https://developers.gamma.app
- **Our Presentation Generator**: `src/services/presentation/PresentationGenerator.ts`
- **Our Presentation Wizard**: `src/components/presentation/PresentationWizardModal.tsx`
- **Our Themes**: `src/services/presentation/PresentationThemes.ts`

