# Clanker Arena — Asset Generation Guide

## Style Reference

Use this prompt as the **prefix** for every image generation to maintain consistency:

> **STYLE ANCHOR:**
> Painted fantasy-sports aesthetic — warm saturated colors, thick painterly brushwork, soft rim lighting. Mix of arcade-energy (like Pixar sports movies) + classic fantasy illustration (rounded shapes, hand-painted textures, soft shadows). Zero neon, zero chrome, zero holograms, zero tech grids. Everything looks like it's made of stone, wood, leather, canvas, and warm metals (brass, copper, gold). Rich sienna, deep indigo, warm gold, emerald, terracotta, cream — slightly desaturated like an old sports poster. Hand-lettered feel, vintage fight-poster energy. No cyberpunk, no sci-fi.
>
> **Reference image:** (use the last generated image as visual anchor for colors, brush style, and lighting)
>
> **DO NOT include:** cyberpunk, neon, chrome, holograms, tech grids, glitch effects, sci-fi elements, futuristic UI, angular tech shapes, dark edgy filters.

---

## Asset List

### 1. Logo & Brand

| File | Description | Prompt Addition |
|------|-------------|-----------------|
| `static/logo.svg` | Wordmark "CLANKER ARENA" with a chunky gear/claw icon | Hand-lettered wordmark "CLANKER ARENA" in warm gold and deep indigo, chunky brass gear with claw marks, vintage fight-poster style, transparent background, vector |

### 2. Backgrounds

| File | Description | Prompt Addition |
|------|-------------|-----------------|
| `static/bg-arena.jpg` | Dark arena background for route pages | Dark painted stone arena interior, warm torch lighting, deep indigo shadows, textured stone walls, painterly style, 1920x1080 |
| `static/bg-panel.png` | 1px tileable dark panel texture | Tileable dark aged-canvas texture, very subtle weave, warm dark brown-black, 1px repeatable |

### 3. Team Bot Avatars (chunky spherical bots, one big eye)

| File | Prompt Addition |
|------|-----------------|
| `static/avatars/bot-blaze.png` | Chunky round clay-colored bot, fired orange terracotta, one big expressive eye, hand-painted gouache style, thick outlines, warm lighting, 256x256 |
| `static/avatars/bot-tide.png` | Chunky round bot, glazed teal ceramic, one big expressive eye, hand-painted gouache style, thick outlines, 256x256 |
| `static/avatars/bot-punch.png` | Chunky round bot, rough terracotta rose, one big expressive eye, hand-painted gouache style, thick outlines, 256x256 |
| `static/avatars/bot-void.png` | Chunky round bot, dark polished obsidian with subtle purple reflections, one big eye, hand-painted gouache style, 256x256 |
| `static/avatars/bot-frost.png` | Chunky round bot, carved ice-blue stone, one big expressive eye, hand-painted gouache style, thick outlines, 256x256 |
| `static/avatars/bot-gold.png` | Chunky round bot, hammered warm brass, one big expressive eye, hand-painted gouache style, thick outlines, 256x256 |
| `static/avatars/default.png` | Silhouette of a round bot, dark grey, question mark, placeholder style, 256x256 |

### 4. Card Artwork (16 cards — tavern game tile style)

| File | Prompt Addition |
|------|-----------------|
| `static/cards/heal.png` | Parchment game tile, hand-painted miniature of a glowing green cross / bandage wrap, woodcut border, brass corner rivets, 128x180 |
| `static/cards/bigheal.png` | Parchment tile, hand-painted syringe with glowing green liquid, woodcut border, brass rivets, 128x180 |
| `static/cards/speed.png` | Parchment tile, painted wind swirls / cheetah impression, warm golden streaks, woodcut border, 128x180 |
| `static/cards/turbo.png` | Parchment tile, painted explosion lines and flame trails, woodcut border, brass rivets, 128x180 |
| `static/cards/damage.png` | Parchment tile, painted cracked fist / broken shield, orange glow, woodcut border, 128x180 |
| `static/cards/shield.png` | Parchment tile, painted iron shield with brass trim, woodcut border, brass rivets, 128x180 |
| `static/cards/stun.png` | Parchment tile, painted swirling spiral / dazed stars, purple tones, woodcut border, 128x180 |
| `static/cards/adrenaline.png` | Parchment tile, painted heart with speed lines, warm red-pink, woodcut border, 128x180 |
| `static/cards/lucky.png` | Parchment tile, painted four-leaf clover with gold sparkles, woodcut border, brass rivets, 128x180 |
| `static/cards/barrier.png` | Parchment tile, painted crystal dome / force field as translucent blue glass, woodcut border, 128x180 |
| `static/cards/ironskin.png` | Parchment tile, painted iron armor plate with rivets, dark steel, woodcut border, 128x180 |
| `static/cards/slowfield.png` | Parchment tile, painted mud / thick honey dripping, brown-gold, woodcut border, 128x180 |
| `static/cards/rapidreload.png` | Parchment tile, painted spinning gear with speed arrows, warm bronze, woodcut border, 128x180 |
| `static/cards/focus.png` | Parchment tile, painted magnifying glass / crosshair target, gold trim, woodcut border, 128x180 |
| `static/cards/berserk.png` | Parchment tile, painted raging beast face / fangs, dark crimson, woodcut border, brass rivets, 128x180 |
| `static/cards/secondwind.png` | Parchment tile, painted sunrise over a resting figure, warm peach and gold, woodcut border, 128x180 |

### 5. Mode Badges

| File | Prompt Addition |
|------|-----------------|
| `static/modes/fronts.png` | Painted tile grid icon — 3x3 squares in warm colors, like a board game, 64x64 |
| `static/modes/koth.png` | Painted crown on a hill icon, warm gold and green, painterly, 64x64 |
| `static/modes/ffa.png` | Painted storm cloud with lightning bolt, dark indigo, painterly, 64x64 |

### 6. Economy & UI Icons

| File | Prompt Addition |
|------|-----------------|
| `static/icons/coin.png` | Painted gold coin with a gear emblem, warm brass, painterly, 48x48 |
| `static/icons/streak.png` | Painted flame icon, warm orange-yellow, painterly style, 48x48 |
| `static/icons/trophy.png` | Painted trophy cup with handles, warm gold, hand-painted, 48x48 |
| `static/icons/medal.png` | Painted medal with ribbon, bronze and red, painterly, 48x48 |
| `static/icons/check.png` | Painted checkmark in a circle, warm green, hand-painted, 48x48 |
| `static/icons/close.png` | Painted X in a circle, warm red, hand-painted, 48x48 |

### 7. 3D Textures (Three.js arena)

| File | Prompt Addition |
|------|-----------------|
| `static/textures/ground.jpg` | Hand-painted stone floor tiles, warm grey-brown, subtle wear, top-down orthographic, tileable, 512x512 |
| `static/textures/wall.jpg` | Hand-painted stone brick wall, warm brown-grey, mortar lines, tileable, 512x512 |
| `static/textures/particle.png` | Soft round brush stroke, white on transparent, soft edges, 64x64, PNG with alpha |

### 8. Tournament & Economy Illustrations

| File | Prompt Addition |
|------|-----------------|
| `static/illustrations/tournament-banner.jpg` | Wide illustration of a fantasy sports arena with banners and crowd, painterly, warm lighting, 1200x400 |
| `static/illustrations/empty-economy.jpg` | Empty treasure chest with coins scattered, painted, warm lighting, 400x300 |
| `static/illustrations/winner-podium.jpg` | Painted winner podium with gold/silver/bronze, confetti, warm celebration lighting, 600x400 |

---

## Generation Workflow

1. **Generate Style Anchor first** — use the full STYLE ANCHOR prompt to create one high-quality hero image (e.g., the tournament banner or a team bot).
2. **Use that image as reference** for all subsequent generations. Every prompt = STYLE ANCHOR + specific Prompt Addition.
3. **Settings:** 4K if available, square/cropped per spec above. No text in the images (except logo).
4. **Post-processing:** Crop to spec, convert to PNG with transparency for icons/avatars/cards.
