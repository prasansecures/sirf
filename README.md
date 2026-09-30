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

The site is plain static files, so Vercel serves it as-is: no build step, no framework. `vercel.json` adds clean URLs, security headers and caching for `assets/`.

1. In Vercel: **Add New → Project → Import** the `prasansecures/sirf` GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory empty. Deploy.
3. **Settings → Git → Production Branch**: set it to the branch that holds the site.
4. **Settings → Domains**: add `sirf.website` (and `www.sirf.website`, redirecting to it). Vercel shows the DNS records to add at your domain registrar:
   - `sirf.website`: an **A** record pointing to the IP Vercel shows.
   - `www`: a **CNAME** pointing to the target Vercel shows.
   HTTPS is issued automatically once DNS resolves.

After that, every push to the production branch redeploys the site automatically.

## Before launch: things to fill in

| What | Where |
| --- | --- |
| Booking link (`prasan-singh/sirfyou`) | `CAL_LINK` in `assets/js/main.js` (used by the pop-up and the contact section) |
| Contact email (currently `hello@sirf.website`) | `index.html` (3 places), `assets/js/main.js` (mailto in the form handler) |
| Instagram / LinkedIn URLs | footer in `index.html` |
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
5. **What we do:** six services. Only the one in the centre of the screen is in focus; the others blur.
6. **What's in the name?:** सिर्फ़ / صرف, "Sirf means *only*."
7. **Fit check:** "You'll enjoy working with us if you're…", pinned while scrolling, showing one of seven persona lines at a time. It's followed by "…and probably won't if you" with animated strike-throughs. Below that, "Sounds like you? Let's talk" sits on a soft red glow. Hovering over it opens a frosted-glass pop-up on the page with the cal.com booking calendar inside; clicking, tapping or picking a date keeps it open, and ×, Esc or a click outside closes it. On phones it slides up as a sheet. The calendar is loaded into the pop-up in the background once a visitor scrolls near this spot, so it opens ready. Nothing ever redirects or opens a new tab.
8. **Method:** Listen, Commit, Craft, Deliver; the time promise ("sirf 6 hours of your month"); then "Numbers we'll put in writing" (5 clients max, 1 thing in focus per client, 0 handoffs, 100% senior eyes).
9. **Contact:** "Tell us the one thing." with a **Book a call | Send a brief** switch: the cal.com calendar on light glass (default), or the brief form.
10. **Ticker and footer:** a "Focus mode: on · Half-done deliverables shipped: 0…" ticker, then a giant wordmark with a red glow.

**Liquid glass details (iOS-style):** the nav lifts into a floating glass capsule once you scroll; "Focus mode: on", the scroll cue, service tags, form chips, Fit check label/counter/slider, step numbers and the pledge cards sit on glass; the marquee is a band of red glass with a slow light sweep; सिर्फ़ / صرف and the word "sirf" have shine on the letters themselves (glossy fill, a highlight gliding across, a soft glow hugging the glyphs); buttons press in slightly when tapped. The shared glass values are the `--glass-*` variables in `style.css`.

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) from jsDelivr; if it fails to load, the page falls back to native scrolling. The Devanagari and Urdu fonts load without blocking the page and are subset to just the glyphs used. Motion respects `prefers-reduced-motion`. Without JavaScript, every section falls back to static content.
