# Wealth Tracker PWA Design

Date: 2026-06-05
Status: Approved for planning

## Goal

Build a mobile-first progressive web app for personal wealth tracking. The app helps one person manually update asset values every day, see total net worth, and track unrealized profit and loss without bank or broker integrations.

The app will be designed first for iPhone 17 portrait use and will remain responsive for smaller iPhones, tablets, and desktop browsers.

## Product Scope

Version 1 is a Firebase-backed PWA deployed from GitHub to Vercel. It uses Google login, stores each user's data in Cloud Firestore, uses Firestore's offline cache for local resilience, and supports manual export/import backup.

Included in v1:

- One main currency for the whole app.
- Google login through Firebase Auth.
- Per-user Cloud Firestore storage.
- Manual asset setup and daily value updates.
- Market assets with quantity, average cost, and manually entered current price.
- Non-market assets with manually entered current value.
- Liabilities with manually entered balance.
- Daily snapshots of total net worth and asset values.
- Unrealized P/L calculations per asset and for the whole portfolio.
- Mobile-first dashboard, assets, update, reports, and settings screens.
- JSON export/import backup.
- PWA install support for iPhone Safari.

Excluded from v1:

- Bank sync.
- Broker sync.
- Multi-user support.
- Tax reports.
- Full transaction ledger.
- Multi-currency conversion.

## Architecture

The app will use:

- React, Vite, and TypeScript.
- PWA manifest and service worker.
- Firebase Auth with Google sign-in.
- Cloud Firestore for assets, snapshots, and settings.
- Firestore offline persistence for browser-side cache.
- A chart library for mobile-friendly reports.
- Vercel for hosting and deployment from GitHub.

The app code will live at the repository root:

```text
wealth-tracker/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  public/
    manifest.webmanifest
    icons/
  src/
    app/
    components/
    db/
    features/
    styles/
    utils/
  docs/
```

Firebase access will be isolated behind small auth and data modules so UI features do not call Firebase APIs directly.

Firestore data will be scoped by authenticated user:

```text
users/{userId}
  settings/main
  assets/{assetId}
  snapshots/{snapshotId}
```

Firebase config values will come from Vercel environment variables. They should not be hardcoded as private secrets, although Firebase web config is not treated as a server secret. Security depends on Firebase Auth and Firestore security rules.

## Core Screens

### Dashboard

The dashboard is the first screen. It focuses on the daily wealth status:

- Total net worth.
- Change versus previous snapshot.
- Total unrealized P/L and percent.
- Mini net worth trend chart.
- Asset allocation summary.
- Top assets by current value.
- Primary action: Update Today.

### Assets

The assets screen manages holdings and liabilities:

- List assets grouped by type.
- Add, edit, archive, or delete assets.
- Support asset types: cash, stock, fund, crypto, property, other, liability.
- For market assets, store quantity, average cost, and latest manual price.
- For non-market assets, store latest manual current value.
- For liabilities, store balance as a negative contribution to net worth.

### Daily Update

The update screen is optimized for one-hand daily entry:

- Shows active assets in a compact list.
- Market assets accept current price.
- Non-market assets accept current value.
- Liabilities accept current balance.
- Saving creates or updates the snapshot for the selected date.
- The app recalculates total value and unrealized P/L after save.

### Reports

Reports help the user understand wealth movement:

- Net worth over time.
- Unrealized P/L by asset.
- Total unrealized P/L trend.
- Asset allocation by type.
- Daily, weekly, and monthly change.
- Best and worst assets by unrealized P/L.

### Settings

Settings cover app-level preferences and data portability:

- Main currency.
- Export JSON backup.
- Import JSON backup.
- PWA install guidance.
- Data reset with confirmation.

## Data Model

### Asset

```ts
type Asset = {
  id: string;
  name: string;
  type: "cash" | "stock" | "fund" | "crypto" | "property" | "other" | "liability";
  quantity?: number;
  averageCost?: number;
  currentPrice?: number;
  currentValue?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Snapshot

```ts
type Snapshot = {
  id: string;
  date: string;
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  items: SnapshotItem[];
  createdAt: string;
  updatedAt: string;
};
```

### SnapshotItem

```ts
type SnapshotItem = {
  assetId: string;
  value: number;
  costBasis?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  quantity?: number;
  price?: number;
};
```

### Settings

```ts
type Settings = {
  mainCurrency: string;
};
```

## Calculations

Market asset current value:

```text
quantity * currentPrice
```

Market asset cost basis:

```text
quantity * averageCost
```

Unrealized P/L:

```text
currentValue - costBasis
```

Unrealized P/L percent:

```text
(unrealizedPL / costBasis) * 100
```

Net worth:

```text
totalAssets - totalLiabilities
```

If cost basis is missing or zero, unrealized P/L percent is not shown rather than dividing by zero.

## Mobile Design

The app is optimized for iPhone 17 portrait use:

- Bottom tab navigation: Dashboard, Assets, Update, Reports, Settings.
- Large financial numbers with compact supporting labels.
- One primary action per screen.
- Touch targets at least 44px high.
- Safe-area spacing for iOS home indicator.
- Responsive layout that expands to a centered app shell on tablet and desktop.

Visual direction:

- Calm finance-app styling.
- Light background.
- High contrast number hierarchy.
- Green for gains, red for losses, neutral gray for unchanged values.
- Compact cards and lists with no nested card layouts.
- Charts designed for quick scanning, not dense analysis.

## Error Handling

The app should prevent invalid data entry:

- Required asset names.
- Non-negative quantity, average cost, price, and value inputs.
- Confirmation before destructive actions.
- Import validation before replacing or merging local data.
- Clear empty states for no assets, no snapshots, and no report data.
- Authentication-required state for signed-out users.
- User-scoped Firestore reads and writes only.

Firestore rules should allow each signed-in user to access only their own document tree:

```text
users/{userId}/...
```

where `request.auth.uid == userId`.

## Testing And Verification

Implementation should verify:

- Asset value calculations.
- Unrealized P/L calculations.
- Snapshot creation and update behavior.
- Google sign-in and sign-out flow.
- User-scoped Firestore read/write behavior.
- JSON export/import round trip.
- PWA installability basics.
- Offline reload after first visit.
- Mobile layout on iPhone-sized viewport.
- Responsive layout on desktop.

## Future Extensions

The design leaves room for:

- CSV export.
- Transaction ledger.
- Multi-currency support.
- Automatic market price integrations.
- Broker or bank connections.
