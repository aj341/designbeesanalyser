# DesignBees Lead Magnet UI Kit
### Reference document for building new interactive HTML lead magnets

Use this document to build new DesignBees lead magnets that are visually consistent with the existing suite. Paste this into a new conversation and say "build a new lead magnet using the DesignBees UI Kit".

---

## Brand Colours

| Name | Hex | Usage |
|---|---|---|
| Pure Black | `#000000` | Nav, footer, CTA section, brief header, section badges |
| Honey Gold | `#F6BE38` | Primary CTA buttons, accents, name strips |
| Propolis Brown | `#A49362` | Logo secondary colour, subtle labels |
| Beeswax Cream | `#F3EFD6` | Section backgrounds, trigger bars, name strips |
| Midnight Drone | `#282B30` | Hover states on black elements |
| Forest Hive | `#4D7B1B` | Secondary buttons, progress bars, timeline deadlines |
| Action Green | `#05C84B` | Stats numbers, active nav pills, checkboxes, cover tag, progress complete |
| Wild Mint | `#6CB9A6` | Email asset group tag |
| Lavender Bloom | `#D2C4DE` | Social asset group tag |
| Nectar Tint | `#D2DEC6` | Completed task/phase backgrounds |
| Drone Grey | `#BFBFBF` | Placeholder text, disabled states, empty labels |

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Headings / UI labels | Poppins | 700 (Bold) | 40px cover h1, 22px section h2, 14–16px subheadings |
| Section badges / pills | Poppins | 600 (SemiBold) | 10–13px |
| Body copy | Questrial | 400 | 13–15px |
| Form inputs | Questrial | 400 | 14px |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Questrial&display=swap" rel="stylesheet">
```

**Critical font colour rules:**
- All text must be **pure black or pure white only** — never use muted greys like `#666` or `rgba` greys for body text
- Section badge text: white on black background, or black on Honey Gold
- Subtle helper text (e.g. form hints): `color:var(--propolis-brown)` or `color:var(--drone-grey)` — only for de-emphasised labels, never body copy

---

## Logo

The logo is an image file (transparent PNG). Always use the actual image — never recreate it with text/spans.

```html
<!-- Nav -->
<a href="#cover" class="nav-logo">
  <img src="[BASE64 OR URL]" alt="DesignBees" style="height:28px;width:auto;display:block;">
</a>

<!-- Footer -->
<img src="[BASE64 OR URL]" alt="DesignBees" style="height:22px;width:auto;display:block;">

<!-- Brief card header -->
<img src="[BASE64 OR URL]" alt="DesignBees" style="height:26px;width:auto;display:block;margin-bottom:5px;">
```

Embed the logo as a base64 data URI so the file is fully self-contained with no external dependencies.

---

## Layout Structure

Every lead magnet follows this page structure:

```
Fixed Nav (pure black, 58px)
Reading Progress Bar (honey gold → action green gradient)
Cover Section
[Content Sections]
CTA Section (pure black)
Footer (pure black)
Autosave Toast (bottom right)
```

Max content width: `900px`, centred, white background, `box-shadow: 0 0 80px rgba(0,0,0,0.1)`.

---

## Nav

```css
.nav {
  position:fixed; top:0; left:0; right:0; z-index:100;
  background:var(--pure-black); height:58px;
  display:flex; align-items:center; justify-content:space-between; padding:0 40px;
  border-bottom:1px solid rgba(246,190,56,0.12);
}
```

- **Logo**: left-aligned image
- **Nav pills**: centre — link to each section, active state uses Action Green pill `background:rgba(5,200,75,0.15); color:var(--action-green)`
- **CTA button**: right — Forest Hive background, hover to Action Green

---

## Cover Section

```css
.cover {
  background:var(--pure-black); padding:72px 64px 64px;
  position:relative; overflow:hidden; min-height:420px;
  display:flex; flex-direction:column; justify-content:flex-end;
}
```

**Background decorations:**
- `cover-bg1`: top-right circle blob — `background:var(--honey-gold); opacity:0.07`
- `cover-bg2`: bottom-centre circle blob — `background:var(--forest-hive); opacity:0.08`
- `cover-hex`: top-right double hexagon SVG outline — `opacity:0.08`

**Tag (always Action Green):**
```css
.cover-tag {
  background:rgba(5,200,75,0.1); border:1px solid rgba(5,200,75,0.25);
  color:var(--action-green);
  font-family:'Poppins',sans-serif; font-weight:600;
  font-size:10px; letter-spacing:2px; text-transform:uppercase;
  padding:6px 14px; border-radius:20px; margin-bottom:24px;
  display:inline-flex; align-items:center; gap:8px;
}
.cover-tag-dot { width:6px; height:6px; background:var(--action-green); border-radius:50%; }
```

**Bottom row** — byline left, stats right:
```html
<div class="cover-bottom">
  <div class="cover-byline">Brought to you by <strong>DesignBees</strong> — Australian Unlimited Graphic Design</div>
  <div class="cover-stats">
    <div class="cover-stat">
      <div class="cover-stat-num">X</div>
      <div class="cover-stat-label">Label</div>
    </div>
  </div>
</div>
```

**Stats numbers:** `font-size:44px; font-weight:700; color:var(--action-green)`
**Stats labels:** `font-size:11px; color:rgba(255,255,255,0.45); text-transform:uppercase; letter-spacing:1px; margin-top:12px`

---

## Content Sections

```css
.section { border-bottom:1px solid #f0ece2; }
.section-header { padding:44px 64px 0; display:flex; align-items:flex-start; gap:16px; margin-bottom:28px; }
.section-body { padding:0 64px 44px; }
```

**Section badge** (phase/section label):
```css
.section-badge {
  font-family:'Poppins',sans-serif; font-weight:700; font-size:10px;
  letter-spacing:1.5px; text-transform:uppercase;
  background:var(--pure-black); color:var(--honey-gold);
  padding:5px 14px; border-radius:20px; white-space:nowrap; margin-top:4px;
}
```

For the Campaign Brief badge use: `background:var(--honey-gold); color:var(--pure-black)`

---

## Form Fields

```css
.field label {
  font-family:'Poppins',sans-serif; font-weight:600;
  font-size:11px; letter-spacing:1px; text-transform:uppercase;
  color:var(--pure-black);
}
.field input, .field textarea {
  font-family:'Questrial',sans-serif; font-size:14px; color:var(--pure-black);
  background:#fafaf7; border:1.5px solid #e0dbd0; border-radius:8px; padding:11px 14px;
  transition:border-color 0.2s, background 0.2s; outline:none; width:100%;
}
.field input:focus, .field textarea:focus {
  border-color:var(--honey-gold); background:#fffef8;
}
```

- Use `<textarea rows="2">` for multi-line fields (goal, audience, descriptions)
- Use `<input type="text">` for single-line fields
- Use `<input type="date">` for date pickers
- Grid layout: `display:grid; grid-template-columns:1fr 1fr; gap:16px`

---

## Accordion / Phase Pattern

```css
.phase { border:1.5px solid #eee; border-radius:12px; margin-bottom:12px; overflow:hidden; }
.phase.completed { border-color:var(--nectar-tint); background:#f8fdf5; }
.phase-header { display:flex; align-items:center; gap:14px; padding:16px 20px; cursor:pointer; }
.phase-num {
  width:36px; height:36px; border-radius:50%;
  background:#eee; color:var(--pure-black);
  font-family:'Poppins',sans-serif; font-weight:700; font-size:13px;
  display:flex; align-items:center; justify-content:center;
}
.phase.completed .phase-num { background:var(--action-green); color:white; }
```

- First phase/accordion open by default
- Toggle with `max-height:0` → `max-height:600px` transition
- Deadline pills: default `background:#f0ece2; color:var(--propolis-brown)`, set state `background:rgba(5,200,75,0.12); color:var(--forest-hive)`

---

## Checklist / Asset Items

```css
.asset-item {
  display:flex; align-items:flex-start; gap:10px; padding:11px 14px;
  border-radius:8px; cursor:pointer; border:1.5px solid transparent;
  background:#fafaf7;
}
.asset-item:hover { border-color:#e0dbd0; background:var(--beeswax-cream); }
.asset-item.ticked { background:#f0fbf3; border-color:var(--nectar-tint); }
.asset-item.ticked .asset-label { text-decoration:line-through; color:var(--drone-grey); }
```

Checkbox uses SVG tick that animates in with `cubic-bezier(0.34,1.56,0.64,1)`.

**Asset group colour tags:**
```css
.gtag-social { background:var(--lavender-bloom); }  /* #D2C4DE */
.gtag-email  { background:var(--wild-mint); }        /* #6CB9A6 */
.gtag-ads    { background:var(--honey-gold); }       /* #F6BE38 */
.gtag-web    { background:#F4B8A0; }                 /* coral */
```

---

## Buttons

**Primary CTA (Honey Gold):**
```css
.btn-gold {
  display:inline-flex; align-items:center; gap:8px;
  background:var(--honey-gold); color:var(--pure-black);
  font-family:'Poppins',sans-serif; font-weight:700; font-size:14px;
  padding:14px 32px; border-radius:10px; text-decoration:none;
  transition:background 0.2s, transform 0.15s;
}
.btn-gold:hover { background:#ffd060; transform:translateY(-2px); }
```

**Secondary / Forest Hive (nav CTA):**
```css
background:var(--forest-hive); color:white;
/* hover → */ background:var(--action-green);
```

**Generate Brief trigger button:** Honey Gold background, black text, arrow icon, same sizing as btn-gold.

---

## Generated Brief Output

The brief is revealed by a trigger bar between the last content section and the CTA. Structure:

```
Trigger bar (beeswax cream bg, honey gold bottom border, generate button right-aligned)
Brief section (hidden until generated)
  └── Brief card
        ├── Header (pure black bg, logo image, date, "Ready for designer" green badge)
        ├── Campaign name strip (beeswax cream bg, honey gold bottom border)
        ├── Overview grid (2-col: goal, audience, launch date, asset count)
        ├── Brand direction grid (2-col: voice, style, colours, fonts — separate cells)
        ├── Timeline strip (4 phase cards with deadlines)
        ├── Asset pills grouped by channel
        └── Actions footer (Print, Copy to Clipboard, Refresh)
```

**Key brief rules:**
- Brief header background: `var(--pure-black)`
- Name strip: `background:var(--beeswax-cream); border-bottom:2px solid var(--honey-gold)`
- Grid dividers: `1px` lines at `#eee`
- Asset pills: `background:#f0f0f0; border:1px solid #e0dbd0` with Action Green dot `::before`
- "Ready for designer" badge: `background:rgba(5,200,75,0.2); color:var(--action-green)`
- Copy to clipboard exports plain text with all sections labelled
- Print mode hides everything except the brief card

---

## Progress Tracker Bar

Sits between cover and first content section:

```css
.progress-tracker {
  background:var(--beeswax-cream); border-bottom:2px solid var(--honey-gold);
  padding:18px 64px;
  display:flex; align-items:center; justify-content:space-between;
}
```

Progress bar gradient: `linear-gradient(90deg, var(--forest-hive), var(--action-green))`

Status pill states:
- `0` ticked → Drone Grey — "Not started"
- `< half` → Propolis Brown — "In progress"
- `< total` → Forest Hive — "Almost there!"
- `= total` → Action Green — "All [items] selected!"

---

## CTA Section

```css
.cta-section {
  background:var(--pure-black); padding:72px 64px;
  position:relative; overflow:hidden;
}
```

- Eyebrow label: `color:var(--honey-gold); font-size:10px; letter-spacing:2px; text-transform:uppercase`
- Headline: white, `font-size:30px`, key words in `color:var(--honey-gold)` via `<em>`
- Primary CTA: `btn-gold` class
- Secondary link: ghost style `color:rgba(255,255,255,0.45)` with bottom border
- Pricing note: `color:rgba(255,255,255,0.3); font-size:11px`
- Feature bullets: Action Green dot, `color:rgba(255,255,255,0.4)` text

---

## Naming Convention for Phases/Sections

- Always call them **Phases** (not Parts) — Phase 1, Phase 2, Phase 3, Phase 4
- Section badges show: "Phase 1", "Phase 2" etc.
- CTA section eyebrow: "Phase 4 — Next Steps" (or equivalent final phase)

---

## Autosave Toast

```css
.save-toast {
  position:fixed; bottom:24px; right:24px; z-index:200;
  background:var(--pure-black); color:white;
  font-family:'Poppins',sans-serif; font-weight:600; font-size:12px;
  padding:10px 20px; border-radius:30px;
  display:flex; align-items:center; gap:8px;
  box-shadow:0 4px 20px rgba(0,0,0,0.3);
  opacity:0; transform:translateY(8px);
  transition:opacity 0.3s, transform 0.3s;
}
.save-toast.show { opacity:1; transform:translateY(0); }
.save-dot { width:8px; height:8px; background:var(--action-green); border-radius:50%; }
```

Triggers on any form input, checkbox tick, or date change. Shows for 2 seconds.

---

## Reading Progress Bar

```css
.reading-progress {
  position:fixed; top:58px; left:0; height:3px; width:0%;
  background:linear-gradient(90deg, var(--honey-gold), var(--action-green));
  z-index:99; transition:width 0.1s;
}
```

Updated on `window.scroll` — `(scrollY / (scrollHeight - innerHeight)) * 100`

---

## Existing Lead Magnets in Suite

1. **designbees-checklist.html** — 15-point workflow checklist
2. **designbees-top5-mistakes.html** — Top 5 Design Mistakes guide
3. **designbees-campaign-planner.html** — Marketing Campaign Design Planner (interactive, with generated brief output)

---

## Key Rules Summary

1. **Never recreate the logo in text** — always use the image
2. **Nav, footer, CTA, brief header = pure black** `#000000`
3. **Cover background = pure black** with honey gold blob top-right
4. **Cover tag = always Action Green** `#05C84B`
5. **Font colours = black or white only** — no muted greys for body text
6. **Section badges = black background, honey gold text** (except Brief badge = honey gold bg, black text)
7. **Primary CTA = Honey Gold** background with bold black text
8. **Stats numbers = Action Green**
9. **Call sections "Phases"** not Parts
10. **Single HTML file** — all CSS and JS inline, Google Fonts via CDN, logo as base64
11. **Brief output** = always includes: campaign name strip, overview grid, brand direction (colours AND fonts as separate cells), timeline, asset pills, print + copy actions
