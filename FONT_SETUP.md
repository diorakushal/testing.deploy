# FF Meta Pro Book Font Setup

The "blockbook" branding text now uses **FF Meta Pro Book** font.

## Font Files Required

To use FF Meta Pro Book, you need to add the font files to:
```
frontend/public/fonts/
```

Required font files:
- `FFMetaPro-Book.woff2` (preferred)
- `FFMetaPro-Book.woff` (fallback)
- `FFMetaPro-Book.ttf` (fallback)

## Where to Get FF Meta Pro Book

FF Meta Pro is a commercial font from FontFont. You can:
1. Purchase a license from [FontFont](https://www.fontfont.com/fonts/ff-meta-pro)
2. If you already have a license, extract the font files and place them in the `frontend/public/fonts/` directory

## Alternative: Using Web Fonts

If you prefer to use a web font service, you can:
1. Upload the font to a service like [Fonts.com](https://www.fonts.com/) or [MyFonts](https://www.myfonts.com/)
2. Update the `@font-face` declaration in `frontend/app/globals.css` to use the web font URL

## Current Implementation

The font is already configured in:
- `frontend/app/globals.css` - Font-face declaration
- All "blockbook" branding text in:
  - Header.tsx
  - Sidebar.tsx
  - login/page.tsx
  - signup/page.tsx
  - [username]/page.tsx

The font will fallback to system fonts if the font files are not available.
