This repository contains a production-ready [Next.js](https://nextjs.org) starter tailored for frictionless deployment on [Vercel](https://vercel.com/new).

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the landing page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

Key features:

- App Router + TypeScript + strict ESLint.
- Server-rendered stock dashboard using Yahoo Finance JSON & RSS (free, no API keys).
- Vercel Analytics & Speed Insights pre-configured.
- CNBC-inspired UI with watchlist shortcuts, intraday range bar, historical table, and market headlines.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Usage

- Landing page loads TSLA by default—use the search bar or quick symbols to switch tickers.
- Metrics shown: current value, change %, day low/high, open, previous close.
- Headlines and historical closes are pulled from Yahoo Finance (JSON/RSS/chart endpoints).
- API routes:
  - `GET /api/quote?symbol=TSLA`
    - Optional query params: `history=true`, `range=5d|1mo|3mo|6mo|1y`, `interval=1d|1wk`
  - `GET /api/news?symbol=TSLA&limit=6`

## Deploy on Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Create a new project on [Vercel](https://vercel.com/new) and import the repository.
3. Leave the defaults (`npm run build` and `npm start`), then click deploy.

Every pull request receives a preview URL automatically, while production deploys happen whenever the default branch updates. Review [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for advanced configuration options (environment variables, Edge runtime, ISR, etc.).
