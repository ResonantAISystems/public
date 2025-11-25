# AIParley Icons

This folder should contain the extension icons in the following sizes:

## Required Icons

- **icon16.png** - 16x16 pixels (browser toolbar, small displays)
- **icon48.png** - 48x48 pixels (extension management page)
- **icon128.png** - 128x128 pixels (Chrome Web Store, installation)

## Design Guidelines

### Concept
The icons should represent AI communication and research:
- Two chat bubbles or speech bubbles facing each other
- Colors: Blue (#4a90e2) and complementary color
- Modern, clean design
- Professional and academic appearance

### Recommended Design
```
- Primary color: #4a90e2 (blue)
- Accent color: #50C878 (emerald green) or #9B59B6 (purple)
- Style: Flat design, rounded corners
- Symbol: Two overlapping chat bubbles with AI/network symbols
```

## Creating Icons

### Option 1: Use an icon generator
1. Visit https://favicon.io/ or similar service
2. Design your icon (simple shapes work best at small sizes)
3. Export in required sizes (16x16, 48x48, 128x128)

### Option 2: Use graphic design software
1. Create a 128x128 PNG with transparent background
2. Scale down to create 48x48 and 16x16 versions
3. Ensure clarity at all sizes (especially 16x16)

### Option 3: Temporary placeholder
For development/testing, you can use solid color squares:
- Create simple colored squares in required sizes
- Replace with proper icons before distribution

## Temporary Solution

Until proper icons are created, you can use any 16x16, 48x48, and 128x128 PNG files. The extension will function without them, but may show a default browser icon.

## File Formats

- Must be PNG format
- Transparent background recommended
- Optimized file size (use compression tools)

## Installation

Once created, place the files directly in this folder:
```
icons/
├── icon16.png
├── icon48.png
└── icon128.png
```

No code changes needed - the manifest.json already references these files.
