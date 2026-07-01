# Wealth Tracker Project Status

Last updated: 2026-06-30

This document is a handoff note for the next AI agent session. It summarizes the current product, architecture, data model, deployment setup, and implementation decisions.

## Product Goal

Wealth Tracker is a mobile-first Progressive Web App for manually tracking personal investable wealth.

The app intentionally does not connect to broker, bank, stock, index, or crypto APIs. The user manually enters all asset values, debt balances, and daily snapshots.

Primary metric:

```text
Investable Wealth = total investable assets - total liabilities
```

Important product rule:

- Count investable assets such as cash, funds, stocks, crypto, gold, and other investments.
- Do not count personal-use car value as wealth.
- Do count car loans and other debts as liabilities.
- Historical snapshots are records of the past and should not be changed automatically when current assets are edited.

## Current Tech Stack

- React 18
- TypeScript
- Vite
- Firebase Auth with Google login
- Cloud Firestore
- Vite PWA plugin
- Recharts
- Lucide React icons
- Vitest
- Plain global CSS in `src/styles/global.css`

Main commands:

```bash
npm run dev
npm test -- --run
npm run build
```

## Deployment

GitHub repository:

```text
https://github.com/sorat-ges/wealth-tracker.git
```

Vercel URL:

```text
https://wealth-tracker-fawn.vercel.app/
```

Vercel project settings:

- Framework preset: Vite
- Root directory: `./`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: default or `npm install`

Required Vercel environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

The current local `.env.local` has the Firebase values. Do not hardcode Firebase config into source files.

Firebase Auth setup:

- Google provider enabled.
- Add the Vercel domain to Firebase Auth authorized domains:

```text
wealth-tracker-fawn.vercel.app
```

## Firestore Structure

All user data is scoped below the authenticated Firebase user id:

```text
users/{uid}
users/{uid}/settings/main
users/{uid}/assets/{assetId}
users/{uid}/liabilities/{liabilityId}
users/{uid}/snapshots/{snapshotId}
```

Repository functions live in:

```text
src/data/wealthRepository.ts
```

Important repository behavior:

- `saveAsset`, `saveLiability`, `saveSnapshot`, and `saveSettings` use `setDoc(..., { merge: true })`.
- `removeUndefinedFields()` recursively removes `undefined` before Firestore writes because Firestore rejects `undefined`.
- `subscribeSnapshots()` orders snapshots by `date` ascending.

Expected Firestore rule direction:

```text
Users can only read/write their own users/{uid}/... documents.
```

## Data Model

Types are in:

```text
src/domain/types.ts
```

Asset types:

```ts
type AssetType = "cash" | "stock" | "fund" | "crypto" | "gold" | "other";
```

Liability types:

```ts
type LiabilityType = "carLoan" | "homeLoan" | "personalLoan" | "creditCard" | "otherDebt";
```

Current `Asset` supports both old unit-based fields and the newer total-value workflow:

```ts
type Asset = {
  id: string;
  name: string;
  type: AssetType;
  quantity?: number;
  averageCost?: number;
  costBasis?: number;
  currentPrice?: number;
  currentValue?: number;
  annualReturnRate?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Current preferred workflow for market assets is total input:

```text
costBasis = total money invested
currentValue = total current value
```

Example for gold DCA:

```text
name: Gold DCA
type: gold
costBasis: 14000
currentValue: 15100
```

Old unit-based data is still supported by fallback logic:

```text
value = quantity * currentPrice
costBasis = quantity * averageCost
```

Deposit-style cash assets can optionally store:

```text
annualReturnRate = expected yearly return percent
annualReturn = currentValue * annualReturnRate / 100
```

This expected annual return is reported separately. It is not included in unrealized P/L.

## Domain Helpers

`src/domain/calculations.ts`

- Calculates snapshot summary.
- Calculates unrealized P/L.
- Uses `currentValue` and `costBasis` first.
- Falls back to unit-based fields when needed.

`src/domain/assets.ts`

- `getAssetValue(asset)`: current value with fallback.
- `getAssetCostBasis(asset)`: cost basis with fallback.
- `getAssetAnnualReturn(asset)`: expected annual return for cash/deposit assets.
- `getDepositAnnualReturnRows(assets)`: active cash assets with positive annual return, sorted by return descending.
- `getTotalDepositAnnualReturn(assets)`: total expected annual return across active cash/deposit assets.
- `groupAssetsByType(assets)`: active assets grouped by type and sorted by current value descending inside each group.
- `createUpdatedAsset(asset, values, now)`: updates current asset while preserving `id` and `createdAt`.

`src/domain/allocation.ts`

- Sorts allocation rows by value descending.

`src/domain/snapshots.ts`

- `updateSnapshotTotals()` edits snapshot totals without touching captured asset/liability rows.

`src/domain/liabilities.ts`

- `createUpdatedLiability(liability, values, now)`: updates current liability while preserving `id` and `createdAt`.

## App Structure

Root app:

```text
src/app/App.tsx
```

Auth:

```text
src/features/auth/AuthGate.tsx
src/firebase/auth.ts
src/firebase/config.ts
src/firebase/firestore.ts
```

Main tabs:

```text
dashboard -> src/features/dashboard/Dashboard.tsx
assets    -> src/features/assets/AssetsScreen.tsx
update    -> src/features/update/UpdateScreen.tsx
reports   -> src/features/reports/ReportsScreen.tsx
settings  -> src/features/settings/SettingsScreen.tsx
```

Tab definitions:

```text
src/app/navigation.ts
```

Shared controlled money input:

```text
src/components/MoneyInput.tsx
```

`MoneyInput` behavior:

- On focus: shows raw editable number, for example `27828.58`.
- On blur: formats with commas and removes unnecessary `.00`, for example `27,828.58` or `292,509`.
- `toNumber()` parses formatted comma values before saving.

## Current Feature Set

### Authentication

- Google login through Firebase Auth.
- Signed-in user sees Thai UI.

### Dashboard

File:

```text
src/features/dashboard/Dashboard.tsx
```

Shows:

- Investable wealth hero with a premium background gradient and a glassmorphism change badge compared with the last non-today snapshot.
- Total investable assets, liabilities, unrealized P/L, and expected annual return, each featuring high-quality Lucide icons.
- Asset allocation horizontal segmented bar chart (Option 2) optimized for mobile, which avoids text overlapping issues and stretches across the full panel width. It uses an expanded 12-color palette.
- Asset list displayed in a neat, space-saving 2-column grid underneath the allocation bar.
- Recent snapshots list.

Recent fixes:

- Allocation list is sorted by value descending.
- Allocation percentages use ratio formatting correctly, e.g. `0.10` becomes `10.00%`, not `0.10%`.
- Fixed the wealth change calculation to compare with the previous snapshot once today's snapshot is saved.
- Fixed todayId timezone date mismatch bug (uses local year/month/date string instead of UTC, which caused the "+฿0" bug when UTC and local timezones differed).

### Assets Screen

File:

```text
src/features/assets/AssetsScreen.tsx
```

Supports:

- Add assets.
- Add liabilities.
- Assets grouped into panels by type.
- Assets sorted by current value descending inside each group.
- Edit asset from list using pencil icon.
- Delete asset using trash icon with a browser `window.confirm` dialog prompt to avoid accidental deletes.
- Edit asset master only. Existing snapshots are not modified.
- Edit liability from list using pencil icon and inline form.
- Delete liability using trash icon with a browser `window.confirm` dialog prompt.
- Displays asset group subtotals and the total liabilities subtotal alongside item counts inside each card category header.

Current asset input behavior:

- For `stock`, `fund`, `crypto`, and `gold`: enter `เงินลงทุนรวม` and `มูลค่าปัจจุบันรวม`.
- For `cash`: enter `มูลค่าปัจจุบัน` and optionally `ผลตอบแทนต่อปี (%)`.
- For `other`: enter `มูลค่าปัจจุบัน`.
- Cash rows with a positive annual return rate show expected yearly return.
- If adding an asset with the same normalized name and same type, it updates the existing asset instead of creating a duplicate.

### Update Screen

File:

```text
src/features/update/UpdateScreen.tsx
```

Supports:

- Select snapshot date (defaults to local `todayId()`).
- Enter current total value for each asset.
- Enter current balance for each liability.
- Save daily snapshot.
- Saving a snapshot also updates current asset/liability master values.

Important:

- Date input CSS was fixed to avoid overflow on mobile.

### Reports Screen

File:

```text
src/features/reports/ReportsScreen.tsx
```

Shows:

- Investable wealth trend area chart.
- Expected annual deposit return summary and per-deposit rows.
- Unrealized P/L as a mobile-friendly ranking list instead of a bar chart.
- Snapshot history list.

Supports:

- Edit snapshot totals.
- Delete snapshots.

Snapshot edit behavior:

- Edits only the snapshot document.
- Does not modify current asset/liability master records.
- Does not modify other snapshots.

### Settings Screen

File:

```text
src/features/settings/SettingsScreen.tsx
```

Supports:

- Main currency setting.
- JSON backup export/import.
- AI analysis portfolio copy: generates a clean Markdown text summary containing wealth overview, active assets breakdown with P/L and returns, liabilities, and snapshot history, then writes it directly to the clipboard.
- Sign out.

### Privacy / Incognito Mode

- Toggle button (Eye/EyeOff icon) placed in the global top header.
- Uses `isPrivate` state (persisted to `localStorage`) to mask all monetary figures (e.g. balances, totals, chart tooltip values) across the Dashboard, Assets Screen, Update Screen, and Reports Screen with `••••`.

## PWA Status

PWA config:

```text
vite.config.ts
public/manifest.webmanifest
```

Current icon set:

```text
public/icons/icon.svg
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/apple-touch-icon.png
```

Chosen icon direction:

```text
Pulse / Wealth
```

If the installed icon does not refresh on mobile, uninstall the PWA and install it again after Vercel redeploys.

## Styling Notes

Global CSS:

```text
src/styles/global.css
```

Current visual direction:

- Mobile-first.
- Max app shell width around iPhone scale.
- Emerald/gold finance palette.
- Cards use 8px radius.
- Bottom tab navigation uses emerald selected state.
- Buttons use emerald primary, green-tinted secondary/icon, and red-tinted danger.
- Native select controls are styled in closed state with custom chevron. Open picker UI is native OS and cannot be fully controlled with CSS.

Important recent CSS fixes:

- Date inputs no longer overflow panel on mobile.
- Dropdown controls were restyled.
- `box-sizing` includes pseudo-elements.
- Inputs/selects use `min-width: 0` and `max-width: 100%`.

## Current Git Status

Last known pushed state:

```text
origin/main is pushed through 172e5e3 fix: use local date string for todayId to resolve timezone mismatch on change metric
```

Recent important commits:

```text
172e5e3 fix: use local date string for todayId to resolve timezone mismatch on change metric
6af6ee4 feat: add delete confirmation group subtotals and privacy incognito mode
69345e2 feat: add copy wealth summary to clipboard for AI analysis
42b238e style: align and center loading screen container horizontally and vertically
7b66e16 style: replace donut chart with horizontal segmented bar allocation chart
cb2a889 style: optimize asset allocation donut chart with grouping and center label
```

Always run:

```bash
git status --short
git log --oneline -5
```

before starting the next task.

## Verification Baseline

Before claiming work is complete, run:

```bash
npm test -- --run
npm run build
```

Current baseline at last documentation update:

```text
10 test files passed
20 tests passed
production build passed
```

Vite still warns that some chunks are larger than 500 kB. This is currently known and not blocking.

## Known Constraints and Decisions

- Do not add third-party financial API integrations in v1.
- Do not treat personal-use car value as investable wealth.
- Do keep car loan debt as liability.
- Do not mutate historical snapshots when editing current assets.
- Keep Thai UI copy unless user asks otherwise.
- Prefer existing patterns and global CSS over adding a new UI library.
- Use Firestore user-scoped paths only.
- For Vercel, all Firebase env vars must use `VITE_` prefix.

## Good Next Feature Candidates

- **Asset "Archive / Deactivate" Toggle**: Allow users to deactivate sold-out assets instead of deleting them. This hides them from the active list and the daily Update Screen input forms, but preserves their historical name metadata for past snapshots and reporting.
- **Target Asset Allocation & Rebalancing**: Allow users to set target percentages for each asset class (e.g. cash 20%, stock 50%, gold 10%, crypto 20%) and display rebalancing alerts showing how much the current portfolio deviates from the target.
- **Wealth Growth Projection Simulator**: Add a simulator tool (compound interest math calculator) that predicts future wealth growth in 5, 10, or 20 years based on target expected returns (CAGR) and monthly savings contributions.
- **Multi-Currency Support**: Support adding assets in foreign currencies (e.g. USD stocks) where users can input the current exchange rate during daily updates, auto-converting to the main display currency (THB) for reports and dashboards.
- **Vercel deployment & CI**: Add Vercel deployment status checks or GitHub Actions for test validation.
- **Bundle Optimization**: Split vendor chunks if bundle size warnings become a priority.
