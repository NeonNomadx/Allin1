# NeonNomad / Allin1 Gaming News

A mobile-first gaming room news dashboard built with static HTML, CSS and JavaScript. No build tools, frontend secrets or API keys are required.

## Features

- Cyan, pink and lavender gaming-room scene with a featured monitor carousel and interactive console filters.
- Live headlines, attributed publisher images, keyword search and a browser-local reading list.
- Dedicated Rockstar Games news and merchandise/store reporting with official store links.
- Real review headlines, click-to-load official YouTube trailers and publisher-verified release dates.
- Monthly release calendar, calendar-day countdowns and an `.ics` calendar download.
- Ambient-light toggle, reduced-motion support, paused background animations when hidden, iPhone safe-area spacing, swipeable mobile cards, loading skeletons, errors and cached-feed fallback.

## Run locally

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Serve over HTTP; browser fetches of JSON do not work from a `file:` URL.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes `dist/` on pushes to `main`. If GitHub cannot enable Pages automatically, select **Settings → Pages → Source: GitHub Actions**, then rerun the deployment workflow. Links and asset paths are relative and support a repository subpath. A root index also forwards to `dist/` for branch-based Pages hosting if you prefer Deploy from a branch → main → /(root).

The existing owner-private preview is hosted through Sites; GitHub and Sites publication are separate deployments.

## News and privacy

News is fetched from Eurogamer, Eurogamer Reviews, Push Square, Xbox Wire, Nintendo Life and RockstarINTEL using the public RSS2JSON endpoint. The Rockstar merchandise watch uses the publisher's `?s=merch&feed=rss2` search feed, filtered for merchandise/store headlines. These are independent reports, not a live inventory tracker. Prices and stock are viewed in the official Rockstar Store.

Feeds refresh on open, manual refresh and every 15 minutes while the tab is visible. RSS2JSON is a third-party service with its own caching, availability and usage limits; failed sources keep their previous cached stories with a Cached label. No guarantee of instant updates is implied.

Bookmarks, motion preference and cached headlines stay in localStorage on this browser. They do not sync across devices. Clearing browser data removes them. YouTube embeds only load after Play; external images and feeds load from their original hosts.

## Releases and trailers

`dist/editorial.json` holds curated release dates, official publisher source links and official-channel trailer IDs. Verification date is displayed in the site. Update this file when publisher plans change; this is not a live release calendar API. Countdowns measure calendar days to scheduled dates and do not claim exact regional unlock times. Past dates are labelled as passed.

## Project files

- `dist/index.html`: semantic page structure and controls.
- `dist/style.css`: retained styles and original pastel design.
- `dist/neon.css`: responsive neon-room design, safe areas, accessibility and motion rules.
- `dist/app.js`: feeds, filtering, carousel, bookmarks and Rockstar hub.
- `dist/news-utils.js`: date parsing, topic classification and failed-source cache handling.
- `dist/extras.js`: trailers, releases, calendar export, reviews and motion control.
- `dist/editorial.json`: sourced editorial data.
- `dist/assets/neon-room.webp`: optimized generated backdrop based on the supplied visual direction.

The original screenshot was supplied in chat, not as a repository asset. It is the layout reference; the background is original generated room artwork with real HTML controls layered above it.
