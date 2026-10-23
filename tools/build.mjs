// Build for Vercel: copies the site into public/ and fingerprints CSS and JS.
//
// Every page references /assets/css/style.css, /assets/js/main.js and the
// vendored Lenis. Here each reference gets ?v=<content hash>, so those files can
// be cached for a year (see vercel.json): a changed file gets a new URL, an
// unchanged one is never downloaded twice. No dependencies; run with
// `node tools/build.mjs`.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'public');

// Everything the site serves; repo files (README, tools, vercel.json) stay out.
const FILES = ['robots.txt', 'sitemap.xml', 'llms.txt', 'site.webmanifest'];
const DIRS = ['assets'];
const pages = readdirSync(root).filter(f => f.endsWith('.html'));

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of [...FILES, ...pages]) cpSync(join(root, f), join(out, f));
for (const d of DIRS) cpSync(join(root, d), join(out, d), { recursive: true });

const FINGERPRINT = ['/assets/css/style.css', '/assets/js/main.js', '/assets/js/vendor/lenis-1.1.13.min.js'];
const hash = p => createHash('sha256').update(readFileSync(join(root, p))).digest('hex').slice(0, 10);
const versions = Object.fromEntries(FINGERPRINT.map(p => [p, hash(p)]));

for (const page of pages) {
  let html = readFileSync(join(out, page), 'utf8');
  for (const [p, v] of Object.entries(versions)) {
    // "/assets/css/style.css" with or without an existing ?v=..., in href or src
    const re = new RegExp(`(["'])${p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:\\?v=[\\w-]+)?\\1`, 'g');
    html = html.replace(re, `$1${p}?v=${v}$1`);
  }
  writeFileSync(join(out, page), html);
}

// Fail the deploy rather than ship a page that still points at an unversioned file.
for (const page of pages) {
  const html = readFileSync(join(out, page), 'utf8');
  for (const p of FINGERPRINT) {
    if (html.includes(`"${p}"`)) throw new Error(`${page}: ${p} was not fingerprinted`);
  }
}
if (!existsSync(join(out, 'index.html'))) throw new Error('index.html missing from build');
console.log('Built public/ with', pages.length, 'pages:', versions);
