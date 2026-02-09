# Mobile App Icons

The mobile app icons are sourced from the web app's icons and resized to meet Expo's requirements.

## Icon Sources

All icons are based on the web app's icons located in `../web/public/`:

- **Main Icon** (`icon.png`, `adaptive-icon.png`, `splash-icon.png`): 
  - Source: `../web/public/android-chrome-512x512.png`
  - Resized from 512x512 to 1024x1024 using high-quality LANCZOS resampling
  
- **Favicon** (`favicon.png`):
  - Source: `../web/public/favicon-32x32.png`
  - Kept at 32x32 (original size)

## Expo Requirements

- **icon.png**: 1024x1024px - Main app icon
- **adaptive-icon.png**: 1024x1024px - Android adaptive icon (foreground)
- **splash-icon.png**: 1024x1024px - Icon shown in splash screen
- **favicon.png**: 32x32px - Web favicon

## Updating Icons

If the web app icons are updated, regenerate mobile icons by running:

```python
from PIL import Image

# Upscale to 1024x1024
img = Image.open("../web/public/android-chrome-512x512.png")
resized = img.resize((1024, 1024), Image.Resampling.LANCZOS)
resized.save("icon.png", "PNG", optimize=True)
resized.save("adaptive-icon.png", "PNG", optimize=True)
resized.save("splash-icon.png", "PNG", optimize=True)

# Copy favicon
favicon = Image.open("../web/public/favicon-32x32.png")
favicon.save("favicon.png", "PNG", optimize=True)
```

Or use the included script: `python3 /tmp/resize_icon.py`
