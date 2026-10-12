# Verse of the Day Website: Technical Specification

Version 2.0 | October 12, 2026 | Status: Final

## 1. Objective

Build a simple, fast, mobile-first website that shows a Bible verse of the day the moment it loads, and lets visitors share that verse in two ways:

- **To chats:** WhatsApp, Messenger, Instagram DMs, email, Telegram and similar apps.
- **As a post or story:** X (Twitter), Facebook, Instagram Stories/Posts and WhatsApp Status, mainly through a generated verse image.

**Success criteria**

- The verse is visible in under 2 seconds on a mobile connection.
- A user can share the verse in two taps or fewer on mobile.
- The site works with no login, no database and no backend server.

## 2. Scope

**In scope (MVP)**

- Daily verse display
- Native share and direct share links
- Verse image generator (story and post sizes)
- Copy text and download image
- Open Graph tags for link previews
- Responsive light and dark design

**Out of scope (for now)**

- User accounts, favorites or history
- Push notifications or email subscriptions
- Multiple languages and translations
- Native mobile apps
- Direct posting to Instagram or WhatsApp Status (not possible from a website)

## 3. Features

| # | Feature | Priority | Description |
| --- | --- | --- | --- |
| F1 | Verse of the day | Must | Same verse for everyone on a given date, picked from 50 themed categories (KJV) |
| F2 | Native share | Must | Opens the phone's share sheet via the Web Share API, sharing text, link and image |
| F3 | Direct share links | Must | WhatsApp, X, Facebook, Telegram and email links as desktop fallback |
| F4 | Verse image generator | Must | Renders the verse on a canvas, exports PNG |
| F5 | Image formats | Must | Story/Status 1080×1920 and Post 1080×1080 |
| F6 | Copy text | Must | One-tap copy of the verse and reference |
| F7 | Download image | Must | Saves PNG so users can upload to Instagram or WhatsApp Status manually |
| F8 | Background themes | Should | 3 to 5 minimal styles in neutral tones (for example soft white, warm sand, charcoal) |
| F9 | Open Graph and Twitter cards | Should | Rich link previews when the site URL is shared |
| F10 | Dark mode | Should | Light and dark themes with a manual toggle; defaults to the system setting |
| F11 | PWA (installable) | Could | Add to home screen, works offline |
| F12 | Previous and next day | Could | Browse other days' verses |

## 4. How It Works

### 4.1 User flow

1. User opens the site.
2. JavaScript reads today's date and calculates the day of year (1 to 366).
3. The script picks the day's category and verse from `verses.json`.
4. The verse and reference are shown on screen, and the canvas image is generated in the background.
5. User taps **Share**.
   - **Mobile with Web Share support:** the native share sheet opens with the image and text. The user picks WhatsApp, Instagram, Messenger, Stories, Status, email and so on.
   - **Desktop or unsupported browser:** a menu shows direct links (WhatsApp, X, Facebook, email), plus Copy and Download.
6. For stories and posts, the user shares the image from the share sheet, or downloads it and uploads it inside the app.

### 4.2 Verse selection logic

- **Categories:** 50 categories in five groups (Spiritual Connection & Faith, Emotional Support & Healing, Wisdom & Life Guidance, Purpose & Identity, Intellectual & Historical Knowledge), 10 per group, each with a one-line description.
- **Verses:** about 7 KJV verses per category (366 days ÷ 50), chosen for fit with the category and reviewed before launch.
- **Randomness:** a one-time script shuffles the categories so none repeats within a 50-day cycle, then rotates through each category's verses. The result is saved in `verses.json`, so every user sees the same verse on the same date and the schedule can be reviewed.
- **Timing:** day index = day of year minus 1, taken in the user's local timezone, so the verse changes at each user's local midnight.
- **Display:** the category appears as a small label above the verse (for example "Peace"), with the reference and "KJV" below it.
- **Not recommended:** picking randomly in the browser with the date as a seed. It is simpler but can repeat a category on consecutive days and is harder to review.

### 4.3 Image generation

- Uses the HTML5 Canvas API in the browser, with no server involved.
- Steps: set canvas size, draw the background (gradient or image), wrap the verse text to fit, draw the reference and site name, then export with `canvas.toBlob()`.
- Text wrapping and auto font sizing keep long verses inside safe margins (for stories, keep key content away from the top and bottom 250px, where Instagram overlays its UI).
- The blob is converted to a `File` so it can be passed to `navigator.share({ files: [...] })`.

### 4.4 Sharing matrix

| Destination | Method | Notes |
| --- | --- | --- |
| WhatsApp, Messenger, Telegram, Instagram DM, email (mobile) | Web Share API | One button covers all apps installed on the device |
| WhatsApp (desktop) | `https://wa.me/?text=` | Opens WhatsApp Web or app |
| X (Twitter) | `https://twitter.com/intent/tweet?text=&url=` | Text can be prefilled |
| Facebook post | `https://www.facebook.com/sharer/sharer.php?u=` | Link only; Facebook ignores prefilled text and uses the page's Open Graph preview |
| Email | `mailto:?subject=&body=` | Text only |
| Instagram Story/Post | Share image via native sheet, or download and upload manually | No web API to open the Instagram composer |
| WhatsApp Status | Share image via native sheet, or download and upload manually | No web API for Status |

## 5. Tech Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Markup, style, logic | HTML5, CSS3, vanilla JavaScript (ES modules) | No build step, tiny and fast |
| Styling | Plain CSS with CSS variables (optional Tailwind later) | Easy theming and dark mode |
| Image rendering | Canvas API | Native, no dependency |
| Sharing | Web Share API Level 2 (files) plus URL intent links | Native sheet plus fallback |
| Fonts | Google Fonts (one serif for verses, one sans for UI) | Readable, good-looking cards |
| Data | Static `verses.json` | KJV text stored in the file at build time. No database needed |
| Hosting | Cloudflare Pages (first choice) or GitHub Pages | Free plan, HTTPS, no server to run, free subdomain |
| Analytics (optional) | Cloudflare Web Analytics (free), or none | Privacy-friendly |
| Version control | Git and GitHub | Standard workflow |

**Libraries:** none required for the MVP. Optional: `html-to-image` (if styling the share card in HTML instead of canvas), Workbox (for PWA caching).

**APIs:** none needed at runtime. The KJV text is fetched once at build time (for example from the free, keyless bible-api.com) and saved in the data file.

## 6. Architecture

The site is fully static and client-side:

- **Browser:** loads `index.html`, `styles.css`, `app.js` and `verses.json` from the CDN.
- **app.js modules:** `verse.js` (date and selection), `image.js` (canvas), `share.js` (Web Share and fallback links), `ui.js` (rendering and events).
- **No backend, no database, no cookies.**

### Suggested project structure

```
/verse-of-the-day
  index.html
  /css/styles.css
  /js/app.js, verse.js, image.js, share.js, ui.js
  /data/verses.json
  /assets/backgrounds/, icons/, og-image.png
  manifest.webmanifest   (optional PWA)
  service-worker.js      (optional PWA)
```

## 7. Data Model

```json
{
  "day": 1,
  "group": "Emotional Support & Healing",
  "category": "Peace",
  "ref": "Philippians 4:6-7",
  "translation": "KJV",
  "text": "<KJV text added at build time>"
}
```

The array has 366 entries (including Feb 29), about 7 per category. The `text` field is filled from the public-domain KJV text at build time, so verse wording is never typed by hand.

## 8. Link Previews (SEO and Open Graph)

- Add `og:title`, `og:description`, `og:image`, `og:url` and `twitter:card` (summary\_large\_image).
- Because the site is static, the preview shows a **default** image and description, not that day's verse.
- Possible later upgrade: a serverless function (such as Cloudflare Workers, free tier) that renders a per-day preview image and page, so shared links show the actual verse.

## 9. Non-Functional Requirements

- **Performance:** page under 200 KB excluding fonts, Lighthouse score above 90.
- **Compatibility:** latest two versions of Chrome, Safari, Edge, Firefox. Share API features degrade gracefully.
- **Accessibility:** WCAG AA contrast, semantic HTML, keyboard-operable buttons, alt text for generated images.
- **Privacy:** no personal data collected. If analytics are added, use cookieless tools.
- **Security:** HTTPS only (required by the Web Share API), strict Content Security Policy.

## 10. Content and Licensing

- The King James Version (KJV) is in the public domain in the United States, so it is free to display, share and use in images, with no permission or fee.
- In the United Kingdom, the Crown holds a patent on printing the KJV. It matters for print publishing rather than a website, but check it if you ever print or publish in the UK.
- Add a short credit line in the footer, such as "Scripture: King James Version, public domain".
- Always display the reference and "KJV" on the card.
- The KJV uses older English ("thee", "thou") and writes God's name as "LORD". A modern-English public-domain option such as the WEB can be added later as a toggle.
- Copyrighted translations (NIV, ESV, NLT) are out of scope, which keeps the project free to run.

## 11. Milestones

| Phase | Deliverable | Estimate |
| --- | --- | --- |
| 1 | Verse list (366 KJV verses across 50 categories) and selection logic | 1 to 2 days |
| 2 | Landing page UI, responsive and dark mode | 1 to 2 days |
| 3 | Canvas image generator and themes | 2 days |
| 4 | Share buttons, native share and fallbacks | 1 day |
| 5 | Open Graph tags, testing on real devices, deploy | 1 day |
| 6 | Optional: PWA, per-day previews, analytics | 2 to 3 days |

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Web Share with files unsupported on some browsers | Users cannot share the image directly | Fallback to Download image and Copy text |
| Instagram and WhatsApp Status have no direct web API | Extra manual step | Explain clearly in the UI with a tip such as "Download, then add to your story" |
| Translation licensing | Low, since KJV is public domain | None needed: KJV is public domain in the US. Keep a credit line in the footer |
| Facebook ignores prefilled text | Weaker Facebook post | Rely on Open Graph preview and image sharing |
| Timezone differences | Verse changes at different moments worldwide | Accepted by design: the verse changes at each user's local midnight |

## 13. Final Decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Translation | KJV (King James Version), public domain, free to use and share |
| 2 | When the verse changes | At each user's local midnight |
| 3 | Verse source | 50 categories in five groups, about 7 KJV verses each; the verse list is prepared during the build |
| 4 | Visual style | Minimal, neutral colors, with light and dark themes |
| 5 | Link previews | Default (one generic preview image) for now; per-day previews can come later |
| 6 | Hosting and domain | Free plan on Cloudflare Pages or GitHub Pages, with the free subdomain; no paid services |

All decisions are settled and nothing blocks the build. A modern-English translation toggle (WEB) is a possible later addition.
