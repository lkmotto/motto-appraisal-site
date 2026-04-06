# Motto Appraisal Service — Website

Production-ready website for Motto Appraisal Service, a licensed DFW real estate appraisal firm.

## Stack

- **HTML5** — Semantic, accessible markup
- **CSS** — Single `styles.css` with CSS custom properties, no frameworks
- **JavaScript** — Vanilla JS, ~6KB, no dependencies
- **Fonts** — Inter (Google Fonts) + JetBrains Mono (Google Fonts)

## Pages

| File | Page | Description |
|------|------|-------------|
| `index.html` | Home | Hero, services overview, social proof, AVM comparison, newsletter, recent posts |
| `services.html` | Services | Detailed service cards with use cases |
| `about.html` | About | Luke Motto bio, stats, appraiser perspective |
| `newsletter.html` | Newsletter | Newsletter info, sample issue, past issues grid |
| `contact.html` | Contact | Tally form, Calendly embed, contact info, service area |
| `privacy.html` | Privacy Policy | Full GDPR/CCPA-compliant privacy policy |

## Deployment

### Static Hosting (Netlify, Vercel, S3)

No build step required. Deploy the entire directory as-is.

```bash
# Netlify CLI
netlify deploy --dir=. --prod

# Or drag & drop in Netlify dashboard
```

### Custom Domain

Update these references when assigning a custom domain:
1. `sitemap.xml` — Change all `https://mottoappraisal.com/` URLs
2. `robots.txt` — Update sitemap URL
3. Schema.org JSON-LD in `index.html` and `contact.html`
4. OG meta tags on all pages

## Embeds to Configure

### Beehiiv Newsletter
Find the element with `id="beehiiv-embed"` on:
- `index.html` (newsletter section)
- `newsletter.html` (subscribe section)

Replace the placeholder content with your Beehiiv embed code. Example:
```html
<script src="https://embeds.beehiiv.com/YOUR-PUBLICATION-ID" async></script>
```

### Tally Form
Find `id="tally-embed"` on `contact.html`. Replace with:
```html
<iframe data-tally-src="https://tally.so/embed/YOUR-FORM-ID?alignLeft=1&hideTitle=1&transparentBackground=1" width="100%" height="500" frameborder="0" title="Contact Form"></iframe>
<script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s)}</script>
```

### Calendly
Find `id="calendly-embed"` on `contact.html`. Replace with:
```html
<div class="calendly-inline-widget" data-url="https://calendly.com/YOUR-LINK?background_color=0F1629&text_color=F0F0F0&primary_color=00A0DE" style="min-width:320px;height:500px;"></div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

### Google Tag Manager
Uncomment the GTM snippets in `index.html` `<head>` and `<body>`:
1. Replace `GTM-XXXXXXX` with your container ID
2. Copy the same snippets to all other HTML files

## Framer Migration Guide

This site is designed to translate directly into Framer. Here's how:

### 1. Setup
- Create a new Framer project
- Set the site background to `#0A0E1A`
- Add Inter from Google Fonts
- Add JetBrains Mono from Google Fonts

### 2. Design Tokens → Framer Variables
Create these color variables in Framer:
| Variable | Value |
|----------|-------|
| Ivory (Near-White) | `#F0F0F0` |
| Navy Dark | `#0A0E1A` |
| Electric Blue | `#00A0DE` |
| Blue-Grey | `#B0BEC5` |
| Cool Slate | `#90A4AE` |
| Navy Card | `#0F1629` |
| Navy Border | `#1E2D45` |
| Navy Surface | `#0F1629` |

### 3. Typography Styles
Create these text styles:
| Name | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Hero | Inter | 48-88px (responsive) | 900 | Ivory |
| H2 | Inter | 32-56px (responsive) | 900 | Ivory |
| H3 | Inter | 18-24px (responsive) | 700 | Ivory |
| Body | Inter | 16-18px | 400 | Off White |
| Label | JetBrains Mono | 12-14px | 400 | Slate |
| Stat | JetBrains Mono | Various | 700 | Electric Blue |

### 4. Components to Build
1. **Navigation** — Fixed, glassmorphism blur background. Logo + links + CTA button.
2. **Service Card** — Dark card with border, number label, title, description, arrow link. Hover: blue glow.
3. **Data Point** — Mono number + label + optional source. For the stats/data sections.
4. **Post Card** — Date, title, excerpt, read more link.
5. **Issue Card** — Issue number, title, description.
6. **Footer** — 4-column grid: brand, services, company, connect.

### 5. Page-by-Page
- Recreate each section as a Framer component
- Use Stack layouts (vertical/horizontal) to match the grid
- Set max-width to 1200px for content areas
- Use Framer's built-in scroll animations for fade-in effects

### 6. Embeds in Framer
For Beehiiv, Tally, and Calendly:
1. Add an "Embed" component in Framer
2. Paste the HTML embed code
3. Set the embed to fill its container width
4. Match the background styling with the dark theme

### 7. Interactions
- Navigation: Use Framer's scroll-triggered opacity change
- Cards: Use hover state variants with translateY(-2px) and border-color change
- Fade-in: Use Framer's "While in View" animation with opacity 0→1 and y 20→0

### 8. SEO in Framer
- Set page titles and descriptions in Page Settings
- Add OG images via Page Settings → Social Image
- Paste Schema.org JSON-LD in Page Settings → Custom Code → Head

## Publishing via Framer Server API

Framer launched a **Server API** (February 2026, free beta) at [framer.com/developers](https://framer.com/developers). This enables programmatic site management — the missing piece for the newsletter-to-blog pipeline.

### How It Works

1. **Install the package:**
   ```bash
   npm install framer-api
   ```

2. **Create an API key** in your Framer project → Site Settings → API Keys.

3. **Connect via WebSocket:**
   ```javascript
   import { FramerAPI } from 'framer-api';

   const api = new FramerAPI({
     apiKey: process.env.FRAMER_API_KEY,
     siteId: 'your-site-id',
   });

   await api.connect(); // Opens WebSocket channel
   ```

4. **Sync CMS collections** (e.g., blog posts from Beehiiv):
   ```javascript
   await api.cms.upsertItem('blog-posts', {
     slug: 'why-your-zestimate-dropped-15k',
     title: 'Why Your Zestimate Dropped $15K Overnight',
     body: markdownContent,
     publishedAt: new Date().toISOString(),
   });
   ```

5. **Publish changes:**
   ```javascript
   await api.publish(); // Deploys the updated site
   ```

### Newsletter Pipeline (Planned)

This is how the newsletter pipeline will eventually auto-publish to the blog:

1. New issue published on Beehiiv → webhook fires
2. Serverless function receives webhook, extracts content
3. Content is formatted and pushed to Framer CMS via the Server API
4. Framer auto-publishes the updated blog page
5. No manual Framer editing required

The Server API uses a WebSocket channel for real-time communication and supports updating canvas elements, syncing CMS collections, and triggering publishes — all programmatically.

## Technical Notes

### CSS Architecture
- Single file with clear section comments
- All values reference CSS custom properties
- 4px spacing system
- Fluid typography with `clamp()`
- Mobile-first responsive (breakpoints: 768px, 1200px)
- No `!important` except `prefers-reduced-motion`

### JavaScript
- Intersection Observer for scroll animations
- No framework dependencies
- ~6KB unminified
- Event delegation where practical
- Passive scroll listeners for performance

### Accessibility
- Semantic HTML5 elements
- ARIA labels on interactive elements
- Focus-visible styles
- Skip navigation not needed (nav is fixed/first)
- Keyboard-accessible mobile menu (Escape to close)
- `prefers-reduced-motion` respected

### Performance
- No build step required
- Two font families (Google Fonts CDN with preconnect)
- CSS-only animations where possible
- Passive scroll listeners
- Images: none (all SVG/inline). Add WebP/AVIF when adding photos.

## Brand Assets

### Logo
The SVG logo is inline in the HTML — an "M" lettermark inside a rounded rectangle with a electric-blue-accented baseline. The logo uses `currentColor` for adaptability and is defined at `viewBox="0 0 36 36"`.

### Colors
```
IVORY         = #F0F0F0
NAVY_DARK     = #0A0E1A
ELECTRIC_BLUE = #00A0DE
BLUE_GREY     = #B0BEC5
COOL_SLATE    = #90A4AE
```

### Fonts
- Headings: Inter (900, 700)
- Body: Inter (400, 500, 600)
- Data/Labels: JetBrains Mono (400, 500, 700)
