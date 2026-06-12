# Quiet Core Sudoku

A calm, Apple-native-feeling Sudoku game built with Vite, React, TypeScript, Vitest, Playwright, and Vercel.

Production:

- https://sudoku-eight-ashen.vercel.app

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run e2e
npm run build
```

## GitHub Actions Deployment

The repository deploys to Vercel from `.github/workflows/deploy.yml` on every push to `main`.

Required GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project IDs for this app are:

- `VERCEL_ORG_ID`: `team_rcs8sELKlToYGbkoZIQtbuyL`
- `VERCEL_PROJECT_ID`: `prj_P0HG0bnpp7OURDTiXu2ekIgq5ivg`

Create a Vercel access token from Vercel account settings, then add it as the `VERCEL_TOKEN` repository secret.

Useful commands:

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID --body "team_rcs8sELKlToYGbkoZIQtbuyL"
gh secret set VERCEL_PROJECT_ID --body "prj_P0HG0bnpp7OURDTiXu2ekIgq5ivg"
```
