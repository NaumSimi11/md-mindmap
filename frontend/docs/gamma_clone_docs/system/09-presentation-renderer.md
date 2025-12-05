# Presentation Renderer — Export & Present

## Purpose
Turn scrollable block document into slides, live presentation, or embeddable web pages.

## Modes
- Slide mode (paged)  
- Scroll mode (continuous)  
- Embed (responsive web component)

## Slide breaking rules
- Break on top-level section blocks or explicit "pageBreak" flag
- Auto-scale typography to fit target aspect ratio
- Provide per-slide animations (fade, slide-up)

## Export formats
- PDF (server-side rendering via Puppeteer)
- PPTX (node-pptx)
- HTML embed

## Accessibility
- Generate ARIA labels for blocks
- Support keyboard navigation
