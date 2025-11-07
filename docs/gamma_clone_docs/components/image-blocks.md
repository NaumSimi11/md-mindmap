# Image Block — Implementation Spec

## Purpose
Single image with caption and optional credit.

## JSON contract
{
 "type":"image",
 "content":{"url":"...","caption":"...","credit":"..."},
 "style":{"fit":"cover|contain"}
}

## Rendering
- Use object-fit for cover
- Provide focal point control UI
