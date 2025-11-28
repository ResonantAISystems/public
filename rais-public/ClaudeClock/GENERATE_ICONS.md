# How to Generate PNG Icons

Chrome has issues with SVG icons in extensions. Follow these steps to create PNG icons:

## Quick Method (Browser)

1. Open `generate-icons.html` in your browser
2. Right-click on each canvas image
3. Select "Save image as..."
4. Save as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
5. Place the PNG files in the GhostClock folder
6. Reload the extension in Chrome

## Alternative Method (If you have ImageMagick or similar)

```bash
# Convert SVG to PNG (if you have ImageMagick installed)
magick icon16.svg icon16.png
magick icon48.svg icon48.png
magick icon128.svg icon128.png
```

## After Creating PNG Icons

1. Remove the extension from Chrome
2. Click "Load unpacked" again
3. Select the GhostClock folder
4. The icons should now display correctly
