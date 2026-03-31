# 🛢️ EuroOilWatch

**European Fuel Reserve & Price Monitor**

Live EU fuel reserve tracking, price monitoring, and AI-powered energy security analysis across 27 European countries.

🌐 [eurooilwatch.com](https://eurooilwatch.com)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Test that data APIs are reachable
npx tsx scripts/test-eurostat-api.ts

# 3. Fetch all data (stocks, prices, crude)
npm run fetch:all

# 4. Generate AI analysis (requires API key)
ANTHROPIC_API_KEY=sk-ant-xxx npm run analyze

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the dashboard with live data.

---

## Project Structure

```
eurooilwatch/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Main dashboard
│   ├── layout.tsx          # Root layout (header, footer)
│   ├── country/[code]/     # Country detail pages (/country/fr)
│   ├── prices/             # Price comparison & heatmap (Phase 2)
│   ├── methodology/        # How the data works
│   └── about/              # About page
├── components/             # React components
│   ├── StatusBanner.tsx    # Hero status line + traffic light
│   ├── ReserveGauge.tsx    # SVG circular gauge
│   ├── PriceTicker.tsx     # Brent + EU price cards
│   ├── CountryGrid.tsx     # EU27 country overview cards
│   └── AnalysisPanel.tsx   # AI-generated analysis display
├── lib/                    # Shared code
│   ├── types.ts            # TypeScript types for all data
│   ├── countries.ts        # EU27 country codes, names, Eurostat mappings
│   └── data.ts             # Server-side data loader
├── scripts/                # Data pipeline scripts
│   ├── test-eurostat-api.ts      # API validation (run FIRST)
│   ├── fetch-eurostat-stocks.ts  # Oil stock levels from Eurostat
│   ├── fetch-oil-bulletin.ts     # Fuel prices from EC Oil Bulletin
│   ├── fetch-brent.ts            # Brent crude price
│   └── generate-analysis.ts      # AI analysis via Claude API
├── data/                   # JSON data files (committed to repo)
│   ├── stocks.json
│   ├── prices.json
│   ├── brent.json
│   └── analysis.json
└── .github/workflows/
    └── update-data.yml     # Automated daily data pipeline
```

---

## npm Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run test:api` | Validate all data source APIs are reachable |
| `npm run fetch:stocks` | Fetch oil stock levels from Eurostat |
| `npm run fetch:prices` | Fetch fuel prices from EC Oil Bulletin |
| `npm run fetch:brent` | Fetch Brent crude price |
| `npm run fetch:all` | Run all three fetchers |
| `npm run analyze` | Generate AI analysis (needs ANTHROPIC_API_KEY) |
| `npm run update` | fetch:all + analyze (the full pipeline) |

---

## Data Pipeline

The data pipeline runs automatically via GitHub Actions (`.github/workflows/update-data.yml`):

- **Daily at 06:00 UTC** — fetch all data sources
- **Thursdays at 16:00 UTC** — extra run after EC Oil Bulletin publishes
- **Manual trigger** — via GitHub Actions UI

The pipeline commits updated JSON files to the repo, which triggers a Netlify/Vercel rebuild.

### Required Secrets (GitHub → Settings → Secrets)

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Claude API key for AI analysis generation |

---

## Deployment

### Netlify (recommended — matches mytenancycheck setup)

1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables if needed
5. Connect domain: eurooilwatch.com

### Vercel (alternative)

1. Import GitHub repo
2. Framework: Next.js (auto-detected)
3. Connect domain

---

## Data Sources

| Data | Source | Frequency | Lag |
|------|--------|-----------|-----|
| Oil stock levels | [Eurostat nrg_stk_oilm](https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM) | Monthly | ~2 months |
| Fuel prices | [EC Weekly Oil Bulletin](https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en) | Weekly (Thu) | Same week |
| Brent crude | Yahoo Finance / market APIs | Daily | Real-time |
| AI analysis | Claude (Anthropic) | On data update | Minutes |

---

## Phase Roadmap

- [x] **Phase 1** — MVP dashboard with gauges, prices, AI analysis, country grid
- [ ] **Phase 2** — Price heatmap, historical charts, gas storage (AGSI+), email alerts
- [ ] **Phase 3** — Vessel tracking, scenario modelling, API access, localisation

---

## Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · Recharts · Eurostat API · Claude API

---

## License

Data sourced from Eurostat and the European Commission under their open data re-use policies.
