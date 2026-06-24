# Kivra Logo System

The favicon symbol in `img.png` is final. Do not alter, redraw, crop, mask, skew, or recolor the symbol geometry.

## Assets

- `img.png`: finalized favicon symbol
- `horizontal-lockup.svg`: icon plus wordmark
- `compact-lockup.svg`: stacked icon plus wordmark
- `wordmark-only.svg`: wordmark only

## Wordmark

Use Geist SemiBold first, then Inter SemiBold as fallback.

```css
font-family: Geist, Inter, ui-sans-serif, system-ui, sans-serif;
font-weight: 600;
letter-spacing: -0.03em;
```

The wordmark is monochrome and inherits `currentColor`.

## Spacing

Use the favicon rendered size as `I`.

- Horizontal lockup icon size: `I`
- Horizontal icon-to-wordmark gap: `0.3I`
- Compact lockup icon-to-wordmark gap: `0.45I`
- Minimum clear space around lockups: `0.5I`

## Color

Use monochrome only.

- Light background: black wordmark/symbol when the source symbol supports it
- Dark background: white wordmark/symbol when the source symbol supports it

Do not use gradients, shadows, textures, glows, or brand-color treatments.
