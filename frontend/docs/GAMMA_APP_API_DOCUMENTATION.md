# Gamma.app API Documentation

## Overview

Gamma.app is an AI-powered platform for generating presentations, documents, and social media content. The Gamma Generate API allows developers to programmatically create content using AI, with extensive customization options for text, images, layout, and sharing.

**Official Documentation:** https://developers.gamma.app

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [API Endpoint](#api-endpoint)
3. [Authentication](#authentication)
4. [Request Parameters](#request-parameters)
5. [Response Format](#response-format)
6. [Examples](#examples)
7. [Use Cases](#use-cases)

---

## Getting Started

### Base URL
```
https://public-api.gamma.app/v0.2
```

### API Key
You need an API key to authenticate requests. Include it in the `X-API-KEY` header.

---

## API Endpoint

### POST /v0.2/generations

Creates a gamma (presentation, document, or social media post) based on provided text and configuration options.

**Endpoint:** `https://public-api.gamma.app/v0.2/generations`

**Method:** `POST`

**Content-Type:** `application/json`

---

## Authentication

Include your API key in the request headers:

```http
X-API-KEY: sk-gamma-xxxxxxxx
```

---

## Request Parameters

### Required Parameters

#### `inputText` (string)
- **Description:** Text content used to generate the gamma
- **Character Limit:** 1-750,000 characters
- **Examples:**
  - Simple: `"Ways to use AI for productivity"`
  - Structured: Use `\n---\n` to split content into cards
  ```json
  "# Section 1\n* Point 1\n* Point 2\n---\n# Section 2\n* Point 3"
  ```

### Optional Parameters

#### Core Generation Options

##### `textMode` (string)
- **Default:** `"generate"`
- **Options:**
  - `"generate"` - Rewrite and expand the input text
  - `"condense"` - Summarize the input text
  - `"preserve"` - Retain exact text, with potential structuring
- **Example:**
  ```json
  "textMode": "generate"
  ```

##### `format` (string)
- **Default:** `"presentation"`
- **Options:**
  - `"presentation"` - Create a presentation deck
  - `"document"` - Create a document
  - `"social"` - Create social media content
- **Example:**
  ```json
  "format": "presentation"
  ```

##### `themeName` (string)
- **Description:** Gamma theme to use for visual styling (colors, fonts)
- **Default:** Workspace default theme
- **Example:**
  ```json
  "themeName": "Night Sky"
  ```

##### `numCards` (integer)
- **Description:** Number of cards to generate when `cardSplit` is `"auto"`
- **Range:** 1-60
- **Default:** 10
- **Example:**
  ```json
  "numCards": 10
  ```

##### `cardSplit` (string)
- **Default:** `"auto"`
- **Options:**
  - `"auto"` - Automatically split content (uses `numCards`)
  - `"inputTextBreaks"` - Use `\n---\n` delimiters in `inputText` to split cards
- **Example:**
  ```json
  "cardSplit": "auto"
  ```

##### `additionalInstructions` (string)
- **Description:** Extra specifications for content and layout customization
- **Character Limit:** 1-500
- **Example:**
  ```json
  "additionalInstructions": "Make the card headings humorous and catchy"
  ```

##### `exportAs` (string)
- **Description:** Additional file types for saving (in addition to Gamma URL)
- **Options:** `"pdf"`, `"pptx"`
- **Note:** Links for exported files may expire
- **Example:**
  ```json
  "exportAs": "pdf"
  ```

#### Text Options (`textOptions` object)

##### `amount` (string)
- **Description:** Detail level of text per card (when `textMode` is `"generate"` or `"condense"`)
- **Options:** `"brief"`, `"medium"`, `"detailed"`, `"extensive"`
- **Example:**
  ```json
  "textOptions": {
    "amount": "detailed"
  }
  ```

##### `tone` (string)
- **Description:** Mood or voice of generated text (when `textMode` is `"generate"`)
- **Character Limit:** 1-500
- **Can accept multiple keywords:** Separate with commas
- **Examples:**
  ```json
  "textOptions": {
    "tone": "neutral"
  }
  ```
  ```json
  "textOptions": {
    "tone": "professional, upbeat, inspiring"
  }
  ```

##### `audience` (string)
- **Description:** Target audience for tailoring output (when `textMode` is `"generate"`)
- **Character Limit:** 1-500
- **Can accept multiple keywords:** Separate with commas
- **Examples:**
  ```json
  "textOptions": {
    "audience": "outdoors enthusiasts, adventure seekers"
  }
  ```
  ```json
  "textOptions": {
    "audience": "seven year olds"
  }
  ```

##### `language` (string)
- **Description:** Language for generated gamma (regardless of input text language)
- **Default:** `"en"`
- **Example:**
  ```json
  "textOptions": {
    "language": "en"
  }
  ```

#### Image Options (`imageOptions` object)

##### `source` (string)
- **Description:** Origin of images for the gamma
- **Options:**
  - `"aiGenerated"` - AI-generated images
  - `"pictographic"` - Pictographic icons
  - `"unsplash"` - Unsplash photos
  - `"giphy"` - Giphy GIFs
  - Various web options
  - `"placeholder"` - Placeholder images
  - `"noImages"` - No images
- **Example:**
  ```json
  "imageOptions": {
    "source": "aiGenerated"
  }
  ```

##### `model` (string)
- **Description:** AI model to use for image generation (when `source` is `"aiGenerated"`)
- **Default:** Gamma selects automatically
- **Examples:** `"flux-1-pro"`, `"imagen-4-pro"`, `"gamma-v1.0"`
- **Example:**
  ```json
  "imageOptions": {
    "source": "aiGenerated",
    "model": "flux-1-pro"
  }
  ```

##### `style` (string)
- **Description:** Artistic style of AI-generated images
- **Optional but recommended** for stylistic consistency
- **Can accept multiple words:** Separate with commas
- **Example:**
  ```json
  "imageOptions": {
    "source": "aiGenerated",
    "model": "flux-1-pro",
    "style": "minimal, black and white, line art"
  }
  ```
  ```json
  "imageOptions": {
    "source": "aiGenerated",
    "model": "imagen-4-pro",
    "style": "photorealistic"
  }
  ```

#### Card Options (`cardOptions` object)

##### `dimensions` (string)
- **Description:** Aspect ratio of generated cards
- **Options:** Vary based on `format` setting
- **Default:** `"fluid"` (for presentation and document formats)
- **Example:**
  ```json
  "cardOptions": {
    "dimensions": "16x9"
  }
  ```
  ```json
  "cardOptions": {
    "dimensions": "fluid"
  }
  ```

#### Sharing Options (`sharingOptions` object)

##### `workspaceAccess` (string)
- **Description:** Access level for members within your workspace
- **Options:**
  - `"noAccess"` - No access
  - `"view"` - View only
  - `"comment"` - View and comment
  - `"edit"` - View, comment, and edit
  - `"fullAccess"` - Full access (view, comment, edit, share)
- **Example:**
  ```json
  "sharingOptions": {
    "workspaceAccess": "comment"
  }
  ```

##### `externalAccess` (string)
- **Description:** Access level for members outside your workspace
- **Options:**
  - `"noAccess"` - No access
  - `"view"` - View only
  - `"comment"` - View and comment
  - `"edit"` - View, comment, and edit
- **Example:**
  ```json
  "sharingOptions": {
    "externalAccess": "noAccess"
  }
  ```

---

## Response Format

### Success Response (200)

```json
{
  "generationId": "xxxxxxxxxxx"
}
```

**Fields:**
- `generationId` (string) - Unique identifier for the generated gamma

### Error Responses

- **400** - Bad Request (invalid parameters)
- **401** - Unauthorized (invalid or missing API key)

---

## Examples

### Basic Example

```bash
curl --request POST \
     --url https://public-api.gamma.app/v0.2/generations \
     --header 'Content-Type: application/json' \
     --header 'X-API-KEY: sk-gamma-xxxxxxxx' \
     --data '{
       "inputText": "Best hikes in the United States",
       "format": "presentation"
     }'
```

### Advanced Example

```bash
curl --request POST \
     --url https://public-api.gamma.app/v0.2/generations \
     --header 'Content-Type: application/json' \
     --header 'X-API-KEY: sk-gamma-xxxxxxxx' \
     --data '{
       "inputText": "Best hikes in the United States",
       "textMode": "generate",
       "format": "presentation",
       "themeName": "Oasis",
       "numCards": 10,
       "cardSplit": "auto",
       "additionalInstructions": "Make the titles catchy",
       "exportAs": "pdf",
       "textOptions": {
         "amount": "detailed",
         "tone": "professional, inspiring",
         "audience": "outdoors enthusiasts, adventure seekers",
         "language": "en"
       },
       "imageOptions": {
         "source": "aiGenerated",
         "model": "imagen-4-pro",
         "style": "photorealistic"
       },
       "cardOptions": {
         "dimensions": "fluid"
       },
       "sharingOptions": {
         "workspaceAccess": "view",
         "externalAccess": "noAccess"
       }
     }'
```

### Structured Content Example

```json
{
  "inputText": "# The Final Frontier: Deep Sea Exploration\n* Less than 20% of our oceans have been explored\n* Deeper than 1,000 meters remains largely mysterious\n* More people have been to space than to the deepest parts of our ocean\n---\n# Technological Breakthroughs\n* Advanced submersibles capable of withstanding extreme pressure\n* ROVs (Remotely Operated Vehicles) with HD cameras and sampling tools\n* Autonomous underwater vehicles for extended mapping missions\n* Deep-sea communication networks enabling real-time data transmission\n---\n# Ecological Discoveries\n* Unique ecosystems thriving without sunlight\n* Hydrothermal vent communities using chemosynthesis\n* Creatures with remarkable adaptations: bioluminescence, pressure resistance\n* Thousands of new species discovered annually\n---\n# Scientific & Economic Value\n* Understanding climate regulation and carbon sequestration\n* Pharmaceutical potential from deep-sea organisms\n* Mineral resources and rare earth elements\n* Insights into extreme life that could exist on other planets\n---\n# Future Horizons\n* Expansion of deep-sea protected areas\n* Sustainable exploration balancing discovery and conservation\n* Technological miniaturization enabling broader coverage\n* Citizen science initiatives through shared deep-sea data",
  "format": "presentation",
  "cardSplit": "inputTextBreaks",
  "textMode": "preserve"
}
```

---

## Use Cases

### 1. Quick Presentation Generation
Generate a presentation from a simple topic:
```json
{
  "inputText": "Introduction to Machine Learning",
  "format": "presentation",
  "numCards": 8
}
```

### 2. Document Creation
Create a detailed document:
```json
{
  "inputText": "Your document content here...",
  "format": "document",
  "textOptions": {
    "amount": "extensive",
    "tone": "academic, formal"
  }
}
```

### 3. Social Media Content
Generate social media posts:
```json
{
  "inputText": "Product launch announcement",
  "format": "social",
  "textOptions": {
    "tone": "exciting, engaging"
  }
}
```

### 4. Custom Styled Content
Create content with specific visual style:
```json
{
  "inputText": "Your content",
  "themeName": "Night Sky",
  "imageOptions": {
    "source": "aiGenerated",
    "style": "minimal, modern"
  }
}
```

### 5. Multi-language Support
Generate content in different languages:
```json
{
  "inputText": "Your content",
  "textOptions": {
    "language": "es"
  }
}
```

---

## Best Practices

1. **Input Text Quality:** Provide clear, structured input text for best results
2. **Card Splitting:** Use `\n---\n` delimiters for precise control over card boundaries
3. **Image Styles:** Specify `style` in `imageOptions` for consistent visual appearance
4. **Text Mode Selection:**
   - Use `"generate"` for creative expansion
   - Use `"condense"` for summaries
   - Use `"preserve"` when exact text must be maintained
5. **Sharing Options:** Set appropriate access levels based on your use case
6. **Export Formats:** Use `exportAs` when you need downloadable files (PDF, PPTX)

---

## Integration Notes

- **API Version:** v0.2
- **Rate Limits:** Check official documentation for current rate limits
- **Async Processing:** Generation may take time; use `generationId` to track status
- **File Expiration:** Exported file links (`exportAs`) may expire
- **Theme Availability:** Available themes depend on your workspace

---

## Resources

- **Official API Documentation:** https://developers.gamma.app
- **API Reference:** https://developers.gamma.app/docs/reference/generate-a-gamma
- **How It Works Guide:** https://developers.gamma.app/docs/how-does-the-generations-api-work

---

## Summary

Gamma.app's Generate API provides a powerful way to create AI-generated presentations, documents, and social media content programmatically. With extensive customization options for text, images, layout, and sharing, it's suitable for a wide range of use cases from quick content generation to fully customized branded materials.

**Key Features:**
- ✅ Multiple output formats (presentation, document, social)
- ✅ AI-powered text generation and expansion
- ✅ AI-generated images with style control
- ✅ Customizable themes and layouts
- ✅ Multi-language support
- ✅ Export to PDF and PPTX
- ✅ Granular sharing and access control

