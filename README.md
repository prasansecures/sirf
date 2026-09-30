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

## Deploy

Drop the folder on any static host (Netlify, Vercel, Cloudflare Pages or GitHub Pages) and point `sirf.website` at it.

## Before launch: things to fill in

| What | Where |
| --- | --- |
| Contact email (currently `hello@sirf.website`) | `index.html` (3 places), `assets/js/main.js` (mailto in the form handler) |
| Instagram / LinkedIn URLs | footer in `index.html` |
| Showreel | set `data-src` on `.reel__frame` to a video file or YouTube/Vimeo embed URL. When it's empty, the button reads "Reel on request" and links to the contact form. |
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
4. **What we do:** six services. Only the one in the centre of the screen is in focus; the others blur.
5. **What's in the name?:** सिर्फ़ / صرف, "Sirf means *only*."
6. **Fit check:** "You'll enjoy working with us if you're…", pinned while scrolling, showing one persona line at a time. It's followed by "…and probably won't if you" with animated strike-throughs.
7. **Method:** Listen, Commit, Craft, Deliver, then "Numbers we'll put in writing."
8. **Reel:** a showreel slot with a handwritten "Showreel 2026" note.
9. **Contact:** "Tell us the one thing." brief form.
10. **Ticker and footer:** a "Focus mode: on · Half-done deliverables shipped: 0…" ticker, then a giant wordmark with a red glow.

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) from jsDelivr; if it fails to load, the page falls back to native scrolling. The Devanagari and Urdu fonts load without blocking the page and are subset to just the glyphs used. Motion respects `prefers-reduced-motion`. Without JavaScript, every section falls back to static content.
