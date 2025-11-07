# Gallery Component — Implementation Spec

## Purpose
Grid of images with masonry-like behavior.

## JSON contract
{
 "type":"gallery",
 "content":{"images":[{"url":"...","caption":"..."}]},
 "style":{"columns":3,"gap":8}
}

## Rendering
- Use CSS grid with auto-placement
- Lightbox on click
- Lazy load
