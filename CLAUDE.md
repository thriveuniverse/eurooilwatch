# EuroOilWatch — Claude Code Context

## Project overview
EuroOilWatch is a Next.js 14 site that tracks EU fuel reserves, pump prices, and supply risk signals across European countries. Data is fetched from Eurostat, the EC Oil Bulletin, and Brent crude feeds, then committed to the repo and served statically. Hosted on Netlify.

## Tech stack
- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Email**: Resend (broadcasts + subscriber management)
- **Hosting**: Netlify (triggered by GitHub push)
- **Data pipeline**: GitHub Actions cron → fetch scripts → commit to `data/`

## Key directories
- `app/` — Next.js pages and API routes
- `components/` — React UI components
- `lib/` — data loading (`data.ts`), types (`types.ts`), country config (`countries.ts`), news (`news.ts`)
- `scripts/` — data fetch and newsletter scripts (run via `npx tsx`)
- `data/` — committed JSON data files updated daily by CI
- `newsletters/outbox/` — drop `.md` files here to trigger send
- `newsletters/sent/` — archive of sent newsletters (moved by CI after send)
- `.github/workflows/` — two workflows: `update-data.yml` and `send-newsletter.yml`

## npm scripts
| Script | What it does |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run fetch:stocks` | Fetch EU oil stock data from Eurostat |
| `npm run fetch:prices` | Fetch EU fuel prices from EC Oil Bulletin |
| `npm run fetch:brent` | Fetch Brent crude price |
| `npm run fetch:all` | Run all three fetch scripts |
| `npm run analyze` | Generate AI analysis (requires `ANTHROPIC_API_KEY`) |
| `npm run update` | `fetch:all` + `analyze` |
| `npm run send:newsletter` | Send all `.md`/`.html` files in `newsletters/outbox/` via Resend |
| `npm run setup:resend` | One-time script to create Resend segment and topic |

## GitHub Actions workflows

### update-data.yml
Runs daily at 05:00 UTC and Thursdays at 16:00 UTC (after EC Oil Bulletin publishes). Fetches data, generates analysis, commits to `data/`, then triggers Netlify rebuild via build hook.

### send-newsletter.yml
Triggers when any `.md` or `.html` file is pushed to `newsletters/outbox/`. Sends via Resend, then commits the moved file to `newsletters/sent/`.

## GitHub secrets required
| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_SEGMENT_ID` | Resend Audience/Segment ID for subscribers |
| `RESEND_TOPIC_ID` | Resend Topic ID (unsubscribe preferences) |
| `RESEND_FROM_ADDRESS` | e.g. `EuroOilWatch <briefing@eurooilwatch.com>` |
| `ANTHROPIC_API_KEY` | For AI analysis generation |
| `NETLIFY_BUILD_HOOK` | Netlify deploy hook URL |

## Newsletter workflow
1. Write a `.md` file with frontmatter `subject:` and drop it in `newsletters/outbox/`
2. Commit and push
3. GitHub Actions sends the broadcast via Resend and moves the file to `newsletters/sent/`

Example newsletter file:
```markdown
---
subject: EU Fuel Reserves — Weekly Briefing #1
---

## This week

Your content here...
```

## API routes
- `POST /api/subscribe` — adds a subscriber to Resend (uses `RESEND_SEGMENT_ID` + `RESEND_TOPIC_ID`)
- `GET /api/brent` — returns latest Brent crude price

## Local development
Copy `.env.local.example` to `.env.local` and fill in:
```
RESEND_API_KEY=
RESEND_SEGMENT_ID=
RESEND_TOPIC_ID=
RESEND_FROM_ADDRESS=
ANTHROPIC_API_KEY=
```
