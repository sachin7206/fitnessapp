# Asset Placeholders

This directory contains placeholder files for app assets.

## Required Assets

For production, you'll need:

### Icons
- `icon.png` - 1024x1024 app icon
- `adaptive-icon.png` - 1024x1024 Android adaptive icon
- `favicon.png` - 48x48 web favicon

### Splash Screen
- `splash.png` - 1284x2778 splash screen

### Exercise Media
- Exercise videos (MP4 format)
- Exercise thumbnails (JPG/PNG, 400x400)

## Temporary Solution

For now, create simple placeholder images using any image editor or download free fitness icons from:
- https://www.flaticon.com/
- https://icons8.com/
- https://iconscout.com/

Or use these commands to create simple colored placeholders:

```bash
# Install ImageMagick if needed: brew install imagemagick

# Create icon placeholder
convert -size 1024x1024 xc:#FF6B35 -gravity center -pointsize 72 -fill white -annotate +0+0 "FW" icon.png

# Create adaptive icon
convert -size 1024x1024 xc:#FF6B35 -gravity center -pointsize 72 -fill white -annotate +0+0 "FW" adaptive-icon.png

# Create favicon
convert -size 48x48 xc:#FF6B35 -gravity center -pointsize 24 -fill white -annotate +0+0 "FW" favicon.png

# Create splash screen
convert -size 1284x2778 xc:#FFFFFF -gravity center -pointsize 96 -fill #FF6B35 -annotate +0+0 "Fitness\nWellness" splash.png
```

