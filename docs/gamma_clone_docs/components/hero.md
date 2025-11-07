# Hero Block — Implementation Spec

## Purpose
Single message banner with big headline, subhead, and primary CTA.

## JSON contract
{
 "type":"hero",
 "content":{"title":"...","subtitle":"...","cta":{"label":"...","url":"..."},"background":{"image":"..."}}
}

## Rendering
- Full-bleed background
- Centered container with max-width
- Gradient overlay for contrast
