# sirf. — One thing at a time.

Landing page for **sirf.website**, a media & content house.

Plain static site with no framework and no build step: one HTML file, one stylesheet and one small script (~8 KB).

```
index.html            page markup and copy
assets/css/style.css  brand tokens, layout, motion
assets/js/main.js     scroll interactions, form, cursor
assets/img/           favicon, touch icon, OG image, logo mark
```

## Run locally

```sh
npx serve .        # or: python3 -m http.server
```

## Deploy (Vercel)

The site is plain static files, so Vercel serves it as-is: no build step, no framework. `vercel.json` adds clean URLs and security headers. Images are cached for 30 days; CSS and JS are revalidated on every visit, so each deploy shows up immediately.

1. In Vercel: **Add New → Project → Import** the `prasansecures/sirf` GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory empty. Deploy.
3. **Settings → Git → Production Branch**: set it to the branch that holds the site.
4. **Settings → Domains**: add `sirf.website` (and `www.sirf.website`, redirecting to it). Vercel shows the DNS records to add at your domain registrar:
   - `sirf.website`: an **A** record pointing to the IP Vercel shows.
   - `www`: a **CNAME** pointing to the target Vercel shows.
   HTTPS is issued automatically once DNS resolves.

After that, every push to the production branch redeploys the site automatically.

**Analytics:** Vercel Web Analytics and Speed Insights are wired in `index.html` and only load on `sirf.website` or `*.vercel.app`. Turn them on in the Vercel project (the **Analytics** and **Speed Insights** tabs) to start collecting.

## SEO & answer engines (AEO)

- **One canonical address:** `https://www.sirf.website/`. The bare domain redirects there. If you make the bare domain primary in Vercel instead, update the canonical, `og:url`, structured data, `robots.txt`, `sitemap.xml` and `llms.txt` to match.
- **Head:** title, a 152-character description (141 on `/faq`), canonical, robots directive, Open Graph and Twitter cards with image size and alt text.
- **Structured data (JSON-LD `@graph`):** `Organization` (founder, contact, services as an `OfferCatalog`), `WebSite`, `WebPage` and `FAQPage`. The FAQ lives on its own page, `faq.html` (served at `/faq`), linked subtly from the contact section and the footer. Its `FAQPage` data mirrors the visible answers word for word, which Google requires: edit both together.
- **Crawlers:** `robots.txt` allows everyone and explicitly allows AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and others). `sitemap.xml` lists `/` and `/faq`. `llms.txt` is a plain-text summary for AI assistants.
- **Performance:** fonts are self-hosted from `assets/fonts/` (same files and subsets Google Fonts serves), with the two above-the-fold fonts preloaded and cached for a year. Only the tiny Hindi/Urdu subsets still come from Google, loaded without blocking. The first-visit intro is kept short so the main content shows quickly. PNGs are palette-compressed.
- **Also:** one `h1` (with a screen-reader/crawler line naming what sirf. is), `site.webmanifest`, and a `noindex` 404 page.

**After deploying:**
1. Open [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `sirf.website`, and verify it with the DNS TXT record it gives you (added where you manage DNS).
2. Submit `https://www.sirf.website/sitemap.xml` under **Sitemaps**.
3. Use **URL Inspection** on `https://www.sirf.website/` and click **Request indexing**.
4. Optional: do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters), which can import from Search Console. Bing also feeds ChatGPT search.
5. Check the structured data at [Google's Rich Results Test](https://search.google.com/test/rich-results).
6. Every time the site's content changes, update `<lastmod>` in `sitemap.xml`.

## Backlink strategy

Aim for a few links from relevant, real places, not volume. Don't buy links and don't use link farms, PBNs or mass directory submissions. Google discounts or penalises them, and a five-client studio doesn't need them. Work through these in order:

1. **Owned profiles (week 1).** Put `https://www.sirf.website` on the founder's LinkedIn (website field, Featured section, headline or About), a LinkedIn company page, Instagram/YouTube/X bios, Behance or Dribbble, and Crunchbase. Use the same name, email and description everywhere, so search engines and AI assistants connect them to one entity. Then add the company profile URLs as a `"sameAs": [...]` list on the `Organization` (`#org`) in the JSON-LD in `index.html`. The founder's LinkedIn is already on the `Person`.
2. **Google Business Profile.** Create one for sirf. (service-area business, category "Marketing agency"). It's the strongest free local-trust signal and appears in Maps and AI answers.
3. **Curated agency directories (month 1).** Clutch, GoodFirms, DesignRush, Sortlist and The Manifest. Ask two or three clients for reviews there. Quality is high and each sends a real link.
4. **Client work, co-published (ongoing).** For every finished project, ask the client to credit "Personal branding by sirf." with a link on their site, newsletter or LinkedIn post. Publish the case study on sirf.website first and add it to `sitemap.xml`. This is the most natural link you can earn.
5. **Founder-led authority (monthly).** Appear on podcasts and newsletters about founders, creators, D2C and personal branding (show notes link back). Write guest posts or op-eds on personal branding for startup and marketing publications (YourStory, Inc42, Entrackr, Medium publications, Substack collaborations). Answer journalist requests on Qwoted, Featured or HARO-style services.
6. **Linkable assets (quarterly).** Publish one genuinely useful page on the site, for example "The founder's LinkedIn profile checklist", a personal-branding playbook, or a small study ("we audited 100 founder profiles"). People link to resources, not service pages. Each becomes a new URL in the sitemap and an internal link from the homepage and FAQ.
7. **Communities and events.** Talk at founder meetups, accelerator demo days and creator events (event pages link to speakers). Partner with VCs and accelerators on a "founder brand" session for their portfolio.

Track progress in Search Console under **Links**. Five to ten relevant referring domains in the first quarter is a strong start for a niche studio.

## Before launch: things to fill in

| What | Where |
| --- | --- |
| Booking link (`prasan-singh/sirfyou`) | `CAL_LINK` in `assets/js/main.js` (used by the pop-up and the contact section) |
| Contact email (currently `sirfconvos@gmail.com`) | `index.html` (3 places), `assets/js/main.js` (mailto in the form handler) |
| LinkedIn (currently the founder, `linkedin.com/in/prasan-singh`); add Instagram back when ready | footer in `index.html` |
| Form backend (optional) | the form opens the visitor's email app. To collect submissions instead, point it at Formspree, Basin or a serverless function. |

## Brand

| Token | Hex |
| --- | --- |
| Black | `#000000` |
| Ink | `#1C1C1C` |
| Red | `#922115` |
| Paper | `#F4F2EE` |

Type: League Spartan (headlines and body), with Instrument Serif italic for accent words.

## Page structure

0. **Intro:** the sirf. wordmark and red dot, shown once per browser session. It's skipped when the visitor has reduce-motion turned on.
1. **Hero:** dictionary definition of *sirf* (Hindi/Urdu for "only"), with "One thing / *at a time*" and the red dot dropping in.
2. **Marquee:** the disciplines.
3. **Manifesto:** words light up as you scroll.
4. **Who we work with:** "Five clients. *Never a sixth.*" plus four client types. Edit the types in `index.html` (`.who__grid`).
5. **What we do:** seven services. Only the one in the centre of the screen is in focus; the others blur.
6. **What's in the name?:** सिर्फ़ / صرف, "Sirf means *only*."
7. **Fit check:** "You'll enjoy working with us if you're…", pinned while scrolling, showing one of six persona lines at a time. It's followed by "…and probably won't if you" with animated strike-throughs. Below that, "Sounds like you? Let's talk" sits on a soft red glow. Hovering over it opens a frosted-glass pop-up on the page with the cal.com booking calendar inside; clicking, tapping or picking a date keeps it open, and ×, Esc or a click outside closes it. On phones it slides up as a sheet. The calendar is loaded into the pop-up in the background once a visitor scrolls near this spot, so it opens ready. Nothing ever redirects or opens a new tab.
8. **Method:** Listen, Commit, Craft, Deliver; the time promise ("sirf 6 hours of your month"); then "Numbers we'll put in writing" (5 clients max, 1 thing in focus per client, 0 handoffs, 100% senior eyes).
9. **Contact:** "Tell us the one thing." with a **Book a call | Send a brief** switch: the cal.com calendar on light glass (default), or the brief form.
10. **Ticker and footer:** a "Focus mode: on · Half-done deliverables shipped: 0…" ticker, then a giant wordmark with a red glow.

**Liquid glass details (iOS-style):** the nav lifts into a floating glass capsule once you scroll; the scroll cue, service tags, form chips, Fit check label/counter/slider and step numbers sit on glass; buttons press in slightly when tapped. The shared glass values are the `--glass-*` variables in `style.css`.

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) from jsDelivr; if it fails to load, the page falls back to native scrolling. The Devanagari and Urdu fonts load without blocking the page and are subset to just the glyphs used. Motion respects `prefers-reduced-motion`. Without JavaScript, every section falls back to static content.
