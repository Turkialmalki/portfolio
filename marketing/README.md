# Share cards

Ready-to-post images for every service on `/services`, in English and Arabic.
Grab them from `cards/` — nothing here is part of the website build, and
nothing here is deployed. It is a folder of finished PNGs plus the press that
prints them.

```
cards/en/  01-resume-review.png … 07-complete-package.png   1080 × 1350 @2× (2160 × 2700)
           00-all-services.png    the whole menu, one image  1080 × 1350 @2×
           00-banner.png          link preview / X / header  1200 ×  630 @2×
cards/ar/  the same eight, right-to-left, priced in SAR
cards/index.json  every card with its price and file path, for a post queue
```

1080 × 1350 is the tallest image Instagram and LinkedIn will show without
cropping, so these fill the most feed real estate available. The banner is the
standard OG/Twitter-card ratio.

## Reprinting them

```bash
node marketing/build-cards.mjs
```

Prices are **read out of `src/config/careerServices.ts`** at print time, not
copied into this folder. Change a price there, re-run this, and every poster
that quotes it is reprinted — a card can never advertise a figure the checkout
no longer charges. If that file's shape ever changes, the script throws rather
than printing a stale number.

Needs Playwright's Chromium; it falls back to the Google Chrome already on the
machine, so a fresh clone does not need a browser download. If `playwright`
isn't resolvable from the repo:

```bash
PLAYWRIGHT=/path/to/node_modules/playwright node marketing/build-cards.mjs
```

Editing: copy lives in `data.mjs`, the drawings live in `sketches.mjs`, layout
lives in `build-cards.mjs`. The sketches are HTML and CSS — no image assets to
lose, and they re-render at any size in either language.

## One thing to know before you post

The dashboard card shows **sample figures** (1.4M revenue, 5.2% conversion,
68% retention). They are what a dashboard looks like, not results anyone has
been promised. Don't caption that card with them as if they were a client
outcome. Same for the "38% ATS compatible" note on the review card — it is the
example from the site's own scene.

Public Speaking prints **Coming soon** and carries no price, because it has no
product. Post it to build interest; the link still goes to /services, where the
only action on that service is a contact link.

## Work cards — proof, not offers

```bash
node marketing/build-work.mjs        # → cards/work/
```

The service cards say what you sell; these say what you have already built.

```
01-alrajhi-bank … 05-lean-technologies   one poster per case study
00-selected-work                         all five on one image
folio-home / -projects / -services       REAL screenshots of the live site (Arabic)
   …-en                                  the same three in English
dashboard-executive / -product / -operations   sample dashboards
```

Titles, roles, years and tools are parsed out of `src/data/projects.ts`, so
posters and case-study pages can't disagree. Project imagery is the same file
the site serves. The `folio-*` cards actually navigate to
`https://www.turkialmalki.com` and screenshot it — desktop at 1440×900 and
phone at 390×780 — so they can never show a design that has been replaced.
Point them somewhere else with `SITE=https://staging.example.com`.

**Outcome figures are switched off, on purpose.** `src/data/projects.ts` does
not currently line up: the entry titled "Alrajhi Bank" carries BaseBox's
outcomes (`Setup Time −78%`, `Teams Onboarded 12+`, `Screens Delivered 40+`).
Inside a case-study page that's a data bug; on a poster it would be a numeric
claim printed under a real bank's name and sent to strangers. So the posters
print only what is unambiguous — project, role, year, tools, real screenshot.
Once those outcomes are verified per project:

```bash
SHOW_OUTCOMES=1 node marketing/build-work.mjs
```

**The three dashboards are demonstrations, not results.** Every figure in them
is invented, which is why each carries a visible `SAMPLE DATA` mark. They show
what the Report & Dashboard service produces. Never caption them as a client's
numbers.

## Captions to start from

Each card carries the price and the URL already, so a caption only has to do
the part the image can't.

**01 Resume Review — $5 / 19 ريال**
> Most CVs are rejected by software before a person reads them. $5, 48 hours,
> and you'll know exactly why yours is. → turkialmalki.com/services

**02 Resume Writing — $30 / 113 ريال**
> "Responsible for managing the technical team" says nothing. Every line of
> your CV should say what changed because you were there. Full rewrite in 3–4
> days. → turkialmalki.com/services

**03 Public Speaking — coming soon**
> Structure, delivery, slides. Coming soon — reply or message me if you want
> the first session.

**04 LinkedIn Optimization — $30 / 113 ريال**
> Recruiters search. Your profile either comes back or it doesn't. 3 days to
> fix that. → turkialmalki.com/services

**05 MVP / Portfolio — $250 / 939 ريال**
> You've been describing the idea for months. In 5–7 days it can have a URL.
> Designed, built, shipped — code is yours. → turkialmalki.com/services

**06 Report & Dashboard — $100 / 376 ريال**
> Your numbers already exist. They're just spread across six spreadsheets.
> One screen, built on your real data. → turkialmalki.com/services

**07 Complete Package — $399 / 1,499 ريال**
> CV, LinkedIn, speaking, product and reporting — bought separately that's
> $415, and they'd still tell five different stories. This tells one.
> → turkialmalki.com/services

**00 All services**
> Everything I offer, with prices, on one image. Pick what you need.
> → turkialmalki.com/services

**Work cards**

> **Selected work** — Banking, fintech, open banking, enterprise. Five case
> studies with the full working: problem, research, decisions, outcomes.
> → turkialmalki.com/projects

> **The portfolio** — I build the thing I'm asking you to trust me with. The
> site itself is the sample. → turkialmalki.com

> **Dashboards** — Your numbers already exist; they're just spread across six
> spreadsheets. This is what one screen looks like. (Sample data.)
> → turkialmalki.com/services
