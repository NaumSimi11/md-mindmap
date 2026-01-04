# Standalone Icons Feature

## Overview
Added the ability to insert **pure icons** (logos, tech stack icons) **without wrapper boxes** into mindmaps.

## What's New

### 1. **StandaloneIconNode Component**
Location: `frontend/src/components/mindmap/StandaloneIconNode.tsx`

**Features:**
- ✅ Pure icon rendering (no box, no border, no title text)
- ✅ Invisible connection handles (appear on hover)
- ✅ Glow effect when selected
- ✅ Configurable size (default: 48px)
- ✅ Optional custom colors
- ✅ Smooth animations and transitions

**Visual Comparison:**

```
IconNode (old):                StandaloneIconNode (new):
┌─────────────────┐            
│  🐳              │                   🐳
│  Docker          │            (just the icon!)
└─────────────────┘            
```

---

## Usage

### From Shape Libraries Panel

1. Open the **Shapes** panel (left sidebar)
2. Expand the **"Standalone Icons"** category
3. Click any icon to add it to the canvas

**Available Icons:**
- **Frontend:** React, Vue, Angular
- **Backend:** Node.js, Python
- **Languages:** TypeScript, JavaScript
- **Cloud:** AWS, Google Cloud, Azure
- **DevOps:** Docker, Kubernetes, Git, GitHub, GitLab
- **Databases:** PostgreSQL, MongoDB, Redis
- **Tools:** Nginx, Figma

---

### Programmatically

```typescript
// Add a standalone Docker icon
addStandaloneIcon(
  'logos:docker-icon',  // Iconify icon ID
  'Docker',             // Title (tooltip)
  undefined,            // Color (optional)
  48                    // Size in pixels
);
```

---

## Technical Details

### Node Type Registration

```typescript
// MindmapStudio2.tsx
const nodeTypes = {
  mindNode: Studio2MindNode,
  milestone: Studio2MilestoneNode,
  aws: AwsNode,
  icon: IconNode,
  standaloneIcon: StandaloneIconNode, // ← New!
};
```

### Data Structure

```typescript
interface StandaloneIconNodeData {
  icon: string;    // Iconify icon ID (e.g., 'logos:react')
  color?: string;  // Custom color (optional)
  size?: number;   // Icon size in pixels (default: 48)
  title?: string;  // Tooltip text (not displayed)
}
```

### Shape Library Entry

```typescript
{
  id: 'standalone-docker',
  name: 'Docker',
  icon: 'logos:docker-icon',
  category: 'Standalone Icons',
  nodeType: 'standaloneIcon',
  data: { icon: 'logos:docker-icon', size: 48 }
}
```

---

## Differences: IconNode vs StandaloneIconNode

| Feature | IconNode | StandaloneIconNode |
|---------|----------|-------------------|
| **Visual** | Box + Icon + Title | Icon only |
| **Size** | 160px min width | 48px (configurable) |
| **Border** | Yes (2px solid) | No |
| **Background** | White box | Transparent |
| **Title Display** | Yes (visible) | No (tooltip only) |
| **Handles** | Always visible | Invisible (hover to show) |
| **Use Case** | Labeled services/components | Logos, decorative elements |

---

## Examples

### Tech Stack Diagram
```
     ┌─────────────┐
     │   Frontend  │
     └──────┬──────┘
            │
     ⚛️ React   🎨 Figma
            │
     ┌──────┴──────┐
     │   Backend   │
     └──────┬──────┘
            │
     🐍 Python  🐳 Docker
            │
     ┌──────┴──────┐
     │  Database   │
     └──────┬──────┘
            │
     🐘 PostgreSQL
```

### Cloud Architecture
```
     ☁️ AWS
       │
   ┌───┴───┐
   │       │
 🔷 EC2   📦 S3
   │
 🐳 Docker
   │
 ☸️ Kubernetes
```

---

## Adding More Icons

### 1. Find an icon on [Iconify](https://icon-sets.iconify.design/)

Example: `logos:nextjs-icon`

### 2. Add to `ShapeLibrariesPanel.tsx`

```typescript
{
  id: 'standalone-nextjs',
  name: 'Next.js',
  icon: 'logos:nextjs-icon',
  category: 'Standalone Icons',
  nodeType: 'standaloneIcon',
  data: { icon: 'logos:nextjs-icon', size: 48 }
},
```

### 3. Done! The icon will appear in the panel.

---

## Styling & Customization

### Change Icon Size
```typescript
addStandaloneIcon('logos:react', 'React', undefined, 64); // 64px instead of 48px
```

### Change Icon Color
```typescript
addStandaloneIcon('tabler:database', 'Database', '#3b82f6', 48); // Blue color
```

### Selection Glow
The icon automatically gets an indigo glow when selected:
```css
filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))
```

---

## Benefits

1. ✅ **Cleaner diagrams** - No unnecessary boxes around logos
2. ✅ **Better visual hierarchy** - Icons don't compete with labeled nodes
3. ✅ **Flexible sizing** - Icons can be any size
4. ✅ **Native colors** - Logos use their official brand colors
5. ✅ **Still connectable** - Can draw edges to/from standalone icons
6. ✅ **Lightweight** - Smaller footprint on canvas

---

## Future Enhancements

- [ ] Icon size presets (small: 32px, medium: 48px, large: 64px)
- [ ] Icon rotation
- [ ] Icon opacity control
- [ ] Batch icon insertion (add multiple at once)
- [ ] Custom icon upload (SVG)
- [ ] Icon animation effects (pulse, bounce)

---

## Files Modified

1. **Created:**
   - `frontend/src/components/mindmap/StandaloneIconNode.tsx`

2. **Modified:**
   - `frontend/src/pages/MindmapStudio2.tsx`
     - Added `StandaloneIconNode` import
     - Added to `nodeTypes`
     - Added `addStandaloneIcon()` function
     - Updated `onAddShape` handler
   
   - `frontend/src/components/mindmap/ShapeLibrariesPanel.tsx`
     - Added `'standaloneIcon'` to `nodeType` union
     - Added 20 standalone icon entries
     - Expanded "Standalone Icons" category by default

---

## Version
- **Added:** January 4, 2026
- **Author:** AI Assistant
- **Status:** ✅ Production Ready

