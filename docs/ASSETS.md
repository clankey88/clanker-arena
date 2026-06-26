# Clanker Arena — Asset Generation Guide

## Style Reference

Use this prompt as the **prefix** for every image generation to maintain consistency:

> **STYLE ANCHOR:**
> Urban cyberpunk-lite aesthetic — dark charcoal backgrounds (`#1F1F23`), acid green (`#D2FF00`) accents, muted gold (`#FFC107`) premiums, bright red (`#FF3344`) warnings. Flat panel UI with subtle borders (`rgba(255,255,255,0.08)`), soft drop shadows (`0px 12px 32px rgba(0,0,0,0.6)`), dot-matrix halftone textures. Bold condensed geometric sans-serif typography (Teko/Barlow Condensed), heavy uppercase headers. Ribbon-style slanted headers with clip-path, pill-shaped primary buttons (`border-radius: 99px`), rarity gradients (grey/green/blue/purple/gold). Clean, polished, semi-transparent overlays with glow effects on active states. No painted fantasy, no medieval, no organic/earthy textures.
>
> **Reference image:** (use the last generated image as visual anchor)

---

## Asset List

### 1. Logo & Brand

| File | Description | Prompt Addition |
|------|-------------|-----------------|
| `static/logo.svg` | Wordmark "CLANKER ARENA" with icon | Condensed geometric sans-serif wordmark "CLANKER ARENA" in acid green `#D2FF00` on transparent, bold heavy weight, with a simple angular gear/signal icon in muted gold, no serifs, clean vector, no background |

### 2. Backgrounds

| File | Description | Prompt Addition |
|------|-------------|-----------------|
| `static/bg-arena.jpg` | Dark arena background for route pages | Dark charcoal `#1F1F23` background with very subtle halftone dot pattern overlay, faint acid green glow top-left, 1920x1080, flat design, no 3D, no painted elements |
| `static/bg-panel.png` | 1px tileable dark panel texture | Solid `#1F1F23` with `rgba(255,255,255,0.03)` subtle grain, 1px repeatable, flat |

### 3. Team Bot Avatars (simple flat vector avatars)

| File | Prompt Addition |
|------|-----------------|
| `static/avatars/bot-blaze.png` | Flat vector avatar, simple rounded robot face, orange `#FF6B35` primary, dark charcoal background, minimal geometric shapes, clean lines, 256x256 |
| `static/avatars/bot-tide.png` | Flat vector avatar, simple rounded robot face, teal `#4ECDC4` primary, dark charcoal background, minimal geometric shapes, 256x256 |
| `static/avatars/bot-punch.png` | Flat vector avatar, simple rounded robot face, pink `#FF3D7F` primary, dark charcoal background, minimal geometric shapes, 256x256 |
| `static/avatars/bot-void.png` | Flat vector avatar, simple rounded robot face, purple `#9B5DE5` primary, dark charcoal background, minimal geometric shapes, 256x256 |
| `static/avatars/bot-frost.png` | Flat vector avatar, simple rounded robot face, blue `#00BFFF` primary, dark charcoal background, minimal geometric shapes, 256x256 |
| `static/avatars/bot-gold.png` | Flat vector avatar, simple rounded robot face, gold `#FFD700` primary, dark charcoal background, minimal geometric shapes, 256x256 |
| `static/avatars/default.png` | Flat avatar placeholder, grey `#6B7280` circle with "?" icon, dark charcoal background, 256x256 |

### 4. Card Artwork (16 cards — cyberpunk-lite game tiles)

| File | Prompt Addition |
|------|-----------------|
| `static/cards/heal.png` | Dark charcoal panel `#1F1F23`, acid green cross icon, subtle `rgba(255,255,255,0.08)` border, 128x180 |
| `static/cards/bigheal.png` | Dark panel, bright green syringe icon, white border `rgba(255,255,255,0.08)`, 128x180 |
| `static/cards/speed.png` | Dark panel, cyan speed lines / arrow icon, subtle border, 128x180 |
| `static/cards/turbo.png` | Dark panel, orange flame burst icon, subtle border, 128x180 |
| `static/cards/damage.png` | Dark panel, red cracked fist icon, subtle border, 128x180 |
| `static/cards/shield.png` | Dark panel, blue shield icon with metallic edge, subtle border, 128x180 |
| `static/cards/stun.png` | Dark panel, yellow spiral / stun stars icon, subtle border, 128x180 |
| `static/cards/adrenaline.png` | Dark panel, pink heart with pulse line icon, subtle border, 128x180 |
| `static/cards/lucky.png` | Dark panel, gold clover icon on muted gold background, subtle border, 128x180 |
| `static/cards/barrier.png` | Dark panel, blue crystal dome icon, subtle border, 128x180 |
| `static/cards/ironskin.png` | Dark panel, grey armor plate icon, subtle border, 128x180 |
| `static/cards/slowfield.png` | Dark panel, brown sludge / honey drip icon, subtle border, 128x180 |
| `static/cards/rapidreload.png` | Dark panel, spinning gear icon with arrows, subtle border, 128x180 |
| `static/cards/focus.png` | Dark panel, crosshair / target icon in cyan, subtle border, 128x180 |
| `static/cards/berserk.png` | Dark panel, red angry face / fangs icon, subtle border, 128x180 |
| `static/cards/secondwind.png` | Dark panel, sunrise / refresh icon in gold, subtle border, 128x180 |

### 5. Mode Badges

| File | Prompt Addition |
|------|-----------------|
| `static/modes/fronts.png` | Grid icon 3x3 squares, acid green on dark charcoal, flat vector, 64x64 |
| `static/modes/koth.png` | Crown icon, muted gold on dark charcoal, flat vector, 64x64 |
| `static/modes/ffa.png` | Storm / crossed swords icon, bright red on dark charcoal, flat vector, 64x64 |

### 6. Economy & UI Icons

| File | Prompt Addition |
|------|-----------------|
| `static/icons/coin.png` | Flat coin icon with "C" letter, muted gold `#FFC107` on transparent, 48x48 |
| `static/icons/streak.png` | Flat flame icon, acid green `#D2FF00` on transparent, 48x48 |
| `static/icons/trophy.png` | Flat trophy icon, muted gold on transparent, 48x48 |
| `static/icons/medal.png` | Flat medal icon, muted gold with red ribbon, 48x48 |
| `static/icons/check.png` | Flat checkmark in circle, acid green on transparent, 48x48 |
| `static/icons/close.png` | Flat X in circle, bright red on transparent, 48x48 |

### 7. 3D Textures (Three.js arena)

| File | Prompt Addition |
|------|-----------------|
| `static/textures/ground.jpg` | Dark grey `#2A2A2E` with grid lines in `rgba(255,255,255,0.05)`, top-down orthographic, tileable, 512x512 |
| `static/textures/wall.jpg` | Dark charcoal `#1F1F23` with horizontal panel lines in `rgba(255,255,255,0.08)`, tileable, 512x512 |
| `static/textures/particle.png` | Soft white circle on transparent, feathered edges, 64x64, PNG with alpha |

### 8. Illustrations

| File | Prompt Addition |
|------|-----------------|
| `static/illustrations/tournament-banner.jpg` | Wide banner, dark charcoal background, acid green geometric accent lines, muted gold trophy icon center, flat vector style, 1200x400 |
| `static/illustrations/empty-economy.jpg` | Dark panel with muted gold coin icon and "0" text overlay, minimalist, 400x300 |
| `static/illustrations/winner-podium.jpg` | Three-tier podium with gold/silver/bronze blocks, acid green confetti dots, dark charcoal background, 600x400 |

---

## Generation Workflow

1. **Generate Style Anchor first** — use the full STYLE ANCHOR prompt to create one hero image (e.g., tournament banner or team avatar).
2. **Use that image as reference** for all subsequent generations. Every prompt = STYLE ANCHOR + specific Prompt Addition section above.
3. **Settings:** Square/cropped per spec above. No text in the images (except logo).
4. **Post-processing:** Crop to spec, convert to PNG with transparency for icons/avatars/cards.
