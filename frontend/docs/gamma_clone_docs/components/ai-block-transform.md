# AI Block Transform — Feature Spec

## Purpose
Transform one block type into another using AI + heuristics.

## Flow
- User selects target type
- Frontend sends transform request to layout engine
- Engine returns transformed block JSON + warnings
- UI previews change and applies on confirm

## Safety
- Provide undo token
- Provide split suggestions if content too long
