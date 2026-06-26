# UI Design System: "Urban Cyberpunk-Lite"

This document provides a comprehensive breakdown of the design variables, CSS properties, and component recipes needed to recreate the provided UI.

## 1. Color Palette

### Primary Colors
* **Background (Panels)**: Dark Charcoal/Off-Black `#1F1F23`
* **Background (App/World overlay shadow)**: `rgba(0, 0, 0, 0.4)`
* **Accent (Primary Action / Headers)**: Acid Green `#D2FF00`
* **Accent (Warning / Negative)**: Bright Red `#FF3344`
* **Accent (Premium/Currency)**: Muted Gold `#FFC107`

### Typography Colors
* **Primary Text**: White `#FFFFFF`
* **Secondary Text (Descriptions/Levels)**: Light Grey `#9CA3AF`
* **Disabled/Inactive Text**: Darker Grey `#6B7280`
* **Accent Text**: Acid Green `#D2FF00` (Used for "Invited" status, active prices)

### Rarity Gradients (Item Slots Backgrounds)
* **Common (Grey)**: `linear-gradient(180deg, #5D6068 0%, #303236 100%)`
* **Uncommon (Green)**: `linear-gradient(180deg, #5DBE4B 0%, #295F20 100%)`
* **Rare (Blue)**: `linear-gradient(180deg, #4A90E2 0%, #1C406B 100%)`
* **Epic (Purple)**: `linear-gradient(180deg, #9B51E0 0%, #46206B 100%)`
* **Legendary (Yellow/Gold)**: `linear-gradient(180deg, #F5A623 0%, #7A500C 100%)`

---

## 2. Geometry & Borders

### Border Radii
* **Main Panels (Windows)**: `16px` (`border-radius: 16px;`)
* **Primary Action Buttons (Pill shape)**: `99px` (`border-radius: 99px;`)
* **Secondary Buttons / Tags**: `8px` (`border-radius: 8px;`)
* **Item Slots / Loot Boxes**: `12px` (`border-radius: 12px;`)
* **Input Fields**: `8px` (`border-radius: 8px;`)

### Borders & Outlines
* **Main Panel Border**: A very subtle, semi-transparent lighter grey stroke to pop it off the background.
    * `border: 1px solid rgba(255, 255, 255, 0.08);`
* **Active Input Field Border ("Type the name...")**:
    * `border: 1px solid #D2FF00;`
* **Inactive/Default Inner Container Border**:
    * `border: 1px solid rgba(255, 255, 255, 0.15);`

---

## 3. Layer Effects & Shadows

### Drop Shadows
To separate the UI from the 3D game background, use soft, widespread drop shadows.
* **Main Panel Shadow**:
    * `box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.6);`
* **Button Hover/Active Shadow (Acid Green Elements)**:
    * `box-shadow: 0px 4px 12px rgba(210, 255, 0, 0.3);`

### Glow Effects
Used sparingly on active states (like the search bar or selected tabs).
* **Inner/Outer Glow on Input**:
    * `box-shadow: 0 0 0 1px #D2FF00, inset 0 0 8px rgba(210, 255, 0, 0.1);`

---

## 4. Textures & Backgrounds

### The "Dot Matrix" Halftone Pattern
In the "Invite to the Gang" panel, there is a subtle dot pattern. You can recreate this using a radial-gradient mask in CSS.

```css
.panel-halftone {
    background-color: #1F1F23;
    background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 6px 6px;
    /* To make it fade out like in the image, use a mask */
    mask-image: linear-gradient(to bottom right, black 20%, transparent 80%);
    -webkit-mask-image: linear-gradient(to bottom right, black 20%, transparent 80%);
}
```

## 5. Typography

**Font Family**: A bold, modern, condensed geometric sans-serif (e.g., Teko, Barlow Condensed, or Rajdhani for headers; Inter or Roboto for body text).

**Header Style:**
- `font-weight: 900;` (Black/Heavy)
- `text-transform: uppercase;`
- `letter-spacing: -0.5px;`

**Body Style:**
- `font-weight: 500;` (Medium)
- `letter-spacing: 0.2px;`
- `line-height: 1.4;`

## 6. Component Recipes

### The Slanted "Ribbon" Header
The vibrant acid-green headers stick out from the panels and have a distinct slanted right edge.

CSS approach using `clip-path`:

```css
.ribbon-header {
    background-color: #D2FF00;
    color: #111111;
    display: inline-block;
    padding: 12px 32px 12px 20px;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 20px;
    /* Top-left: 0 0, Top-right: 100% 0, Bottom-right: slanted in, Bottom-left: 0% 100% */
    clip-path: polygon(0 0, 100% 0, 92% 100%, 0% 100%);
    /* Negative margin to pull it outside the parent container */
    margin-left: -12px;
    margin-top: 16px;
}
```

### Main Pill Button ("GO SOLO" / "INVITE")

```css
.btn-primary {
    background-color: #D2FF00;
    color: #111111;
    border-radius: 99px;
    padding: 12px 32px;
    font-weight: 800;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
    transition: transform 0.1s, filter 0.1s;
}

.btn-primary:hover {
    filter: brightness(1.1);
    transform: scale(1.02);
}
```

### "PVP" Warning Tag

```css
.tag-warning {
    background-color: #FF3344;
    color: white;
    border-radius: 99px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    border: 2px solid #1F1F23; /* Creates the cut-out effect if layered over another element */
}
```
