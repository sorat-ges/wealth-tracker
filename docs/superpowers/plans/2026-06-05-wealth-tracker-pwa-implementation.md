# Wealth Tracker PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React/Vite PWA for manual wealth tracking with Google login, Firestore persistence, unrealized P/L reporting, and Vercel deployment readiness.

**Architecture:** The app is a client-side PWA hosted by Vercel. Firebase Auth provides Google sign-in, Firestore stores each user's manually entered data under `users/{uid}`, and feature modules consume typed repository functions instead of calling Firebase directly. Phase 1 does not call third-party stock, index, crypto, fund, broker, bank, or market-data APIs; every asset price and value is entered by the user. The UI is optimized for iPhone portrait with responsive desktop expansion.

**Tech Stack:** React, Vite, TypeScript, Firebase Web SDK, Firestore, CSS modules or plain CSS, Recharts, Vitest, Testing Library, vite-plugin-pwa.

---

## File Structure

- Create `package.json`: scripts, dependencies, and dev dependencies.
- Create `index.html`: Vite app entry.
- Create `vite.config.ts`: React, Vitest, and PWA configuration.
- Create `tsconfig.json`, `tsconfig.node.json`: TypeScript config.
- Create `.gitignore`: Node, build, local env files.
- Create `.env.example`: Firebase variable names without secret values.
- Create `public/manifest.webmanifest`: installable PWA metadata.
- Create `public/icons/icon.svg`: simple app icon.
- Create `src/main.tsx`: React bootstrap.
- Create `src/app/App.tsx`: app shell, auth gate, tab navigation.
- Create `src/app/navigation.ts`: tab definitions.
- Create `src/styles/global.css`: tokens, layout, controls, mobile-first styles.
- Create `src/firebase/config.ts`: Firebase app initialization from env.
- Create `src/firebase/auth.ts`: Google sign-in/sign-out helpers.
- Create `src/firebase/firestore.ts`: Firestore instance and offline persistence.
- Create `src/domain/types.ts`: shared domain types.
- Create `src/domain/calculations.ts`: value, cost basis, net worth, and P/L math.
- Create `src/domain/calculations.test.ts`: focused calculation tests.
- Create `src/data/wealthRepository.ts`: user-scoped Firestore CRUD and subscriptions.
- Create `src/data/wealthRepository.test.ts`: repository path and payload tests with mocked Firebase calls.
- Create `src/features/auth/AuthGate.tsx`: signed-out state and Google login.
- Create `src/features/dashboard/Dashboard.tsx`: overview cards and charts.
- Create `src/features/assets/AssetsScreen.tsx`: asset list and asset form.
- Create `src/features/update/UpdateScreen.tsx`: daily manual update flow.
- Create `src/features/reports/ReportsScreen.tsx`: charts and P/L breakdowns.
- Create `src/features/settings/SettingsScreen.tsx`: currency, backup, restore, sign out.
- Create `src/utils/format.ts`: currency, percent, and date formatters.
- Create `src/utils/backup.ts`: JSON export/import validation helpers.
- Create `src/utils/backup.test.ts`: backup round-trip tests.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "wealth-tracker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "firebase": "^11.1.0",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "vite-plugin-pwa": "^0.21.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create Vite entry files**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#f7f8f4" />
    <title>Wealth Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Add TypeScript and Vite config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Wealth Tracker",
        short_name: "Wealth",
        description: "Manual wealth tracking with daily snapshots and unrealized P/L.",
        theme_color: "#f7f8f4",
        background_color: "#f7f8f4",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    globals: true
  }
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Add environment and ignore files**

Create `.env.example`:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Create `.gitignore`:

```text
node_modules
dist
.DS_Store
.env
.env.local
.env.*.local
```

- [ ] **Step 5: Create minimal app shell**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="screen-kicker">Wealth Tracker</p>
        <h1>Track your net worth every day.</h1>
        <p>Google login, Firestore sync, daily snapshots, and unrealized profit/loss reports.</p>
      </section>
    </main>
  );
}
```

Create `src/styles/global.css`:

```css
:root {
  color: #172019;
  background: #f7f8f4;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #f7f8f4;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding: max(24px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom));
}

.hero-panel {
  display: grid;
  gap: 16px;
  padding-top: 32px;
}

.screen-kicker {
  margin: 0;
  color: #637067;
  font-size: 0.82rem;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: 2.25rem;
  line-height: 1.05;
  letter-spacing: 0;
}

p {
  margin: 0;
  color: #637067;
  line-height: 1.55;
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 8: Commit**

Run:

```bash
git add .gitignore .env.example index.html package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts src
git commit -m "feat: scaffold React PWA"
```

## Task 2: Firebase Foundation

**Files:**
- Create: `src/firebase/config.ts`
- Create: `src/firebase/auth.ts`
- Create: `src/firebase/firestore.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create Firebase config module**

Create `src/firebase/config.ts`:

```ts
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const firebaseApp = initializeApp(firebaseConfig);

export async function initializeAnalytics() {
  if (await isSupported()) {
    return getAnalytics(firebaseApp);
  }
  return null;
}
```

- [ ] **Step 2: Create auth helper**

Create `src/firebase/auth.ts`:

```ts
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";
import { firebaseApp } from "./config";

export const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}
```

- [ ] **Step 3: Create Firestore helper**

Create `src/firebase/firestore.ts`:

```ts
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { firebaseApp } from "./config";

export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

- [ ] **Step 4: Add local env for development**

Create `.env.local` manually with the Firebase config values:

```text
VITE_FIREBASE_API_KEY=AIzaSyB6_aCG60n3EUYl7FvqQ9opRxtXzgCbisg
VITE_FIREBASE_AUTH_DOMAIN=wealth-tracker-625e5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wealth-tracker-625e5
VITE_FIREBASE_STORAGE_BUCKET=wealth-tracker-625e5.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=234074884153
VITE_FIREBASE_APP_ID=1:234074884153:web:afea944de11e6f496525e8
VITE_FIREBASE_MEASUREMENT_ID=G-ZY1D3B8935
```

Expected: `.env.local` exists locally and is ignored by git.

- [ ] **Step 5: Verify Firebase imports**

Run: `npm run build`

Expected: build completes without Firebase import errors.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/firebase src/app/App.tsx
git commit -m "feat: add Firebase foundation"
```

## Task 3: Domain Model And Calculations

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/calculations.ts`
- Create: `src/domain/calculations.test.ts`

- [ ] **Step 1: Add domain types**

Create `src/domain/types.ts`:

```ts
export type AssetType = "cash" | "stock" | "fund" | "crypto" | "property" | "other" | "liability";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  quantity?: number;
  averageCost?: number;
  currentPrice?: number;
  currentValue?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SnapshotItem = {
  assetId: string;
  value: number;
  costBasis?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  quantity?: number;
  price?: number;
};

export type Snapshot = {
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

export type Settings = {
  mainCurrency: string;
};
```

- [ ] **Step 2: Write failing calculation tests**

Create `src/domain/calculations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateAssetSnapshotItem, calculateSnapshotSummary } from "./calculations";
import type { Asset } from "./types";

describe("wealth calculations", () => {
  it("calculates market asset value and unrealized P/L", () => {
    const asset: Asset = {
      id: "asset-1",
      name: "ETF",
      type: "fund",
      quantity: 10,
      averageCost: 100,
      currentPrice: 125,
      active: true,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z"
    };

    expect(calculateAssetSnapshotItem(asset)).toEqual({
      assetId: "asset-1",
      value: 1250,
      costBasis: 1000,
      unrealizedPL: 250,
      unrealizedPLPercent: 25,
      quantity: 10,
      price: 125
    });
  });

  it("treats liabilities as negative net worth contribution", () => {
    const assets: Asset[] = [
      {
        id: "cash",
        name: "Cash",
        type: "cash",
        currentValue: 5000,
        active: true,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z"
      },
      {
        id: "loan",
        name: "Loan",
        type: "liability",
        currentValue: 1200,
        active: true,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z"
      }
    ];

    expect(calculateSnapshotSummary(assets)).toMatchObject({
      totalAssets: 5000,
      totalLiabilities: 1200,
      totalNetWorth: 3800
    });
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- src/domain/calculations.test.ts`

Expected: FAIL because `src/domain/calculations.ts` does not exist.

- [ ] **Step 4: Implement calculations**

Create `src/domain/calculations.ts`:

```ts
import type { Asset, SnapshotItem } from "./types";

const marketTypes = new Set<Asset["type"]>(["stock", "fund", "crypto"]);

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getCurrentValue(asset: Asset) {
  if (marketTypes.has(asset.type)) {
    return roundMoney((asset.quantity ?? 0) * (asset.currentPrice ?? 0));
  }
  return roundMoney(asset.currentValue ?? 0);
}

function getCostBasis(asset: Asset) {
  if (!marketTypes.has(asset.type)) {
    return undefined;
  }
  return roundMoney((asset.quantity ?? 0) * (asset.averageCost ?? 0));
}

export function calculateAssetSnapshotItem(asset: Asset): SnapshotItem {
  const value = getCurrentValue(asset);
  const costBasis = getCostBasis(asset);
  const unrealizedPL = costBasis && costBasis > 0 ? roundMoney(value - costBasis) : undefined;
  const unrealizedPLPercent =
    unrealizedPL !== undefined && costBasis && costBasis > 0 ? roundMoney((unrealizedPL / costBasis) * 100) : undefined;

  return {
    assetId: asset.id,
    value,
    costBasis,
    unrealizedPL,
    unrealizedPLPercent,
    quantity: asset.quantity,
    price: asset.currentPrice
  };
}

export function calculateSnapshotSummary(assets: Asset[]) {
  const activeAssets = assets.filter((asset) => asset.active);
  const items = activeAssets.map(calculateAssetSnapshotItem);
  const totalLiabilities = roundMoney(
    activeAssets.filter((asset) => asset.type === "liability").reduce((sum, asset) => sum + getCurrentValue(asset), 0),
  );
  const totalAssets = roundMoney(
    activeAssets.filter((asset) => asset.type !== "liability").reduce((sum, asset) => sum + getCurrentValue(asset), 0),
  );
  const totalUnrealizedPL = roundMoney(items.reduce((sum, item) => sum + (item.unrealizedPL ?? 0), 0));
  const totalCostBasis = roundMoney(items.reduce((sum, item) => sum + (item.costBasis ?? 0), 0));

  return {
    items,
    totalAssets,
    totalLiabilities,
    totalNetWorth: roundMoney(totalAssets - totalLiabilities),
    totalUnrealizedPL,
    totalUnrealizedPLPercent: totalCostBasis > 0 ? roundMoney((totalUnrealizedPL / totalCostBasis) * 100) : 0
  };
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- src/domain/calculations.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain
git commit -m "feat: add wealth calculations"
```

## Task 4: Firestore Repository

**Files:**
- Create: `src/data/wealthRepository.ts`
- Create: `src/data/wealthRepository.test.ts`

- [ ] **Step 1: Create repository tests**

Create `src/data/wealthRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getUserPath, getAssetPath, getSnapshotPath, getSettingsPath } from "./wealthRepository";

describe("wealthRepository paths", () => {
  it("scopes all data below users/{uid}", () => {
    expect(getUserPath("uid-1")).toBe("users/uid-1");
    expect(getSettingsPath("uid-1")).toBe("users/uid-1/settings/main");
    expect(getAssetPath("uid-1", "asset-1")).toBe("users/uid-1/assets/asset-1");
    expect(getSnapshotPath("uid-1", "2026-06-05")).toBe("users/uid-1/snapshots/2026-06-05");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/data/wealthRepository.test.ts`

Expected: FAIL because `src/data/wealthRepository.ts` does not exist.

- [ ] **Step 3: Implement repository**

Create `src/data/wealthRepository.ts`:

```ts
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type { Asset, Settings, Snapshot } from "../domain/types";

export function getUserPath(uid: string) {
  return `users/${uid}`;
}

export function getSettingsPath(uid: string) {
  return `${getUserPath(uid)}/settings/main`;
}

export function getAssetPath(uid: string, assetId: string) {
  return `${getUserPath(uid)}/assets/${assetId}`;
}

export function getSnapshotPath(uid: string, snapshotId: string) {
  return `${getUserPath(uid)}/snapshots/${snapshotId}`;
}

export async function loadSettings(uid: string): Promise<Settings> {
  const snapshot = await getDoc(doc(db, getSettingsPath(uid)));
  return snapshot.exists() ? (snapshot.data() as Settings) : { mainCurrency: "THB" };
}

export async function saveSettings(uid: string, settings: Settings) {
  await setDoc(doc(db, getSettingsPath(uid)), settings, { merge: true });
}

export function subscribeAssets(uid: string, callback: (assets: Asset[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid), "assets"), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as Asset));
  });
}

export async function saveAsset(uid: string, asset: Asset) {
  await setDoc(doc(db, getAssetPath(uid, asset.id)), asset, { merge: true });
}

export async function deleteAsset(uid: string, assetId: string) {
  await deleteDoc(doc(db, getAssetPath(uid, assetId)));
}

export function subscribeSnapshots(uid: string, callback: (snapshots: Snapshot[]) => void): Unsubscribe {
  const snapshotsQuery = query(collection(db, getUserPath(uid), "snapshots"), orderBy("date", "asc"));
  return onSnapshot(snapshotsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as Snapshot));
  });
}

export async function saveSnapshot(uid: string, snapshot: Snapshot) {
  await setDoc(doc(db, getSnapshotPath(uid, snapshot.id)), snapshot, { merge: true });
}
```

- [ ] **Step 4: Run repository tests**

Run: `npm test -- src/data/wealthRepository.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/data
git commit -m "feat: add Firestore wealth repository"
```

## Task 5: Auth Gate And App Navigation

**Files:**
- Create: `src/app/navigation.ts`
- Create: `src/features/auth/AuthGate.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add navigation definitions**

Create `src/app/navigation.ts`:

```ts
import { BarChart3, Home, LineChart, Settings, WalletCards } from "lucide-react";

export const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "assets", label: "Assets", icon: WalletCards },
  { id: "update", label: "Update", icon: LineChart },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

export type TabId = (typeof tabs)[number]["id"];
```

- [ ] **Step 2: Create AuthGate component**

Create `src/features/auth/AuthGate.tsx`:

```tsx
import { onAuthStateChanged, type User } from "firebase/auth";
import { LogIn } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { auth, signInWithGoogle } from "../../firebase/auth";

type AuthGateProps = {
  children: (user: User) => ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <main className="app-shell">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-screen">
        <section className="auth-card">
          <p className="screen-kicker">Wealth Tracker</p>
          <h1>Private daily wealth tracking.</h1>
          <p>Sign in with Google to sync assets, snapshots, and unrealized P/L reports with Firestore.</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              try {
                setError(null);
                await signInWithGoogle();
              } catch {
                setError("Google sign-in failed. Check Firebase authorized domains and try again.");
              }
            }}
          >
            <LogIn size={18} />
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  return children(user);
}
```

- [ ] **Step 3: Update App shell with tabs**

Replace `src/app/App.tsx` with:

```tsx
import { useState } from "react";
import { tabs, type TabId } from "./navigation";
import { AuthGate } from "../features/auth/AuthGate";

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <section className="screen-section">
      <p className="screen-kicker">Wealth Tracker</p>
      <h1>{title}</h1>
      <p>This screen will connect to Firestore in the next tasks.</p>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <AuthGate>
      {(user) => (
        <main className="app-shell app-with-tabs">
          <header className="top-bar">
            <div>
              <p className="screen-kicker">Signed in</p>
              <strong>{user.displayName ?? user.email}</strong>
            </div>
          </header>
          <PlaceholderScreen title={tabs.find((tab) => tab.id === activeTab)?.label ?? "Dashboard"} />
          <nav className="bottom-tabs" aria-label="Primary navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={selected ? "tab-button is-selected" : "tab-button"}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </main>
      )}
    </AuthGate>
  );
}
```

- [ ] **Step 4: Add navigation styles**

Append to `src/styles/global.css`:

```css
.auth-screen {
  display: grid;
  align-items: center;
}

.auth-card,
.screen-section {
  display: grid;
  gap: 16px;
}

.primary-button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: #172019;
  color: #ffffff;
  font-weight: 800;
}

.error-text {
  color: #b42318;
  font-weight: 700;
}

.app-with-tabs {
  padding-bottom: calc(94px + env(safe-area-inset-bottom));
}

.top-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 0 24px;
}

.bottom-tabs {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: min(100%, 480px);
  margin: 0 auto;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid #dde3dc;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
}

.tab-button {
  display: grid;
  min-height: 58px;
  place-items: center;
  gap: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #637067;
  font-size: 0.68rem;
  font-weight: 800;
}

.tab-button.is-selected {
  background: #e8f2e9;
  color: #17633a;
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app src/features/auth src/styles/global.css
git commit -m "feat: add Google auth gate and navigation"
```

## Task 6: Core Wealth Screens

**Files:**
- Create: `src/utils/format.ts`
- Create: `src/features/dashboard/Dashboard.tsx`
- Create: `src/features/assets/AssetsScreen.tsx`
- Create: `src/features/update/UpdateScreen.tsx`
- Create: `src/features/reports/ReportsScreen.tsx`
- Create: `src/features/settings/SettingsScreen.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add format helpers**

Create `src/utils/format.ts`:

```ts
export function formatCurrency(value: number, currency = "THB") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
```

- [ ] **Step 2: Create feature screens with Firestore data**

Implement `Dashboard.tsx`, `AssetsScreen.tsx`, `UpdateScreen.tsx`, `ReportsScreen.tsx`, and `SettingsScreen.tsx` as focused components that accept `uid`, subscribe to repository data, render mobile-first views, and write through repository helpers.

The minimal complete behavior:

```tsx
export type WealthScreenProps = {
  uid: string;
};
```

Each screen must have real state and save behavior. Placeholder text is not acceptable after this task.

The asset and update forms must not fetch current prices from external services. Market assets collect `quantity`, `averageCost`, and `currentPrice` from user input. Non-market assets collect `currentValue` from user input. Liabilities collect `currentValue` as the manual current balance.

- [ ] **Step 3: Wire screens into App**

Update `src/app/App.tsx` to render the selected feature component:

```tsx
const screens: Record<TabId, (props: { uid: string }) => JSX.Element> = {
  dashboard: Dashboard,
  assets: AssetsScreen,
  update: UpdateScreen,
  reports: ReportsScreen,
  settings: SettingsScreen
};
```

- [ ] **Step 4: Verify app build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app src/features src/utils src/styles/global.css
git commit -m "feat: add wealth tracking screens"
```

## Task 7: Backup, Restore, And Firebase Rules Docs

**Files:**
- Create: `src/utils/backup.ts`
- Create: `src/utils/backup.test.ts`
- Create: `firebase.rules`
- Modify: `src/features/settings/SettingsScreen.tsx`
- Modify: `README.md`

- [ ] **Step 1: Add backup tests**

Create `src/utils/backup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseBackup } from "./backup";

describe("backup parsing", () => {
  it("accepts valid backup payloads", () => {
    expect(
      parseBackup(
        JSON.stringify({
          version: 1,
          settings: { mainCurrency: "THB" },
          assets: [],
          snapshots: []
        }),
      ),
    ).toEqual({
      version: 1,
      settings: { mainCurrency: "THB" },
      assets: [],
      snapshots: []
    });
  });

  it("rejects malformed backup payloads", () => {
    expect(() => parseBackup("{")).toThrow("Backup file is not valid JSON.");
    expect(() => parseBackup(JSON.stringify({ version: 1 }))).toThrow("Backup file is missing required arrays.");
  });
});
```

- [ ] **Step 2: Implement backup helpers**

Create `src/utils/backup.ts`:

```ts
import type { Asset, Settings, Snapshot } from "../domain/types";

export type BackupPayload = {
  version: 1;
  settings: Settings;
  assets: Asset[];
  snapshots: Snapshot[];
};

export function parseBackup(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("settings" in parsed) ||
    !("assets" in parsed) ||
    !("snapshots" in parsed) ||
    !Array.isArray((parsed as BackupPayload).assets) ||
    !Array.isArray((parsed as BackupPayload).snapshots)
  ) {
    throw new Error("Backup file is missing required arrays.");
  }

  return parsed as BackupPayload;
}

export function createBackup(settings: Settings, assets: Asset[], snapshots: Snapshot[]): BackupPayload {
  return {
    version: 1,
    settings,
    assets,
    snapshots
  };
}
```

- [ ] **Step 3: Add Firestore rules**

Create `firebase.rules`:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

- [ ] **Step 4: Add README deployment instructions**

Create `README.md`:

```md
# Wealth Tracker

Mobile-first PWA for daily net worth tracking, manual asset updates, and unrealized P/L reports.

## Stack

- React + Vite + TypeScript
- Firebase Auth with Google sign-in
- Cloud Firestore
- Vercel deployment

## Environment Variables

Create `.env.local` for local development and add the same variables in Vercel:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Firestore Data

```text
users/{uid}/settings/main
users/{uid}/assets/{assetId}
users/{uid}/snapshots/{snapshotId}
```

## Firestore Rules

Publish `firebase.rules` in Firebase Console > Firestore > Rules.
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/utils src/features/settings firebase.rules README.md
git commit -m "feat: add backup and Firebase rules docs"
```

## Task 8: Final Verification And Vercel Setup

**Files:**
- Modify only if verification reveals bugs.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 2: Start local app**

Run: `npm run dev`

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Browser verify mobile layout**

Open the local URL in the in-app browser or Chrome responsive mode at an iPhone-sized viewport.

Verify:

- Google sign-in button appears when signed out.
- After sign-in, bottom tabs fit without overflow.
- Assets can be added.
- Stock, fund, crypto, index, and other market assets require manual current price entry.
- The app makes no asset-price API requests in the browser network panel.
- Daily update creates a snapshot.
- Dashboard totals update.
- Reports show chart data.
- Settings can export backup JSON.

- [ ] **Step 4: Configure Vercel env vars**

In Vercel project settings, add:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Use the Firebase web app values already provided.

- [ ] **Step 5: Add Firebase authorized domains**

In Firebase Console > Authentication > Settings > Authorized domains, include:

```text
localhost
wealth-tracker-625e5.firebaseapp.com
<your-vercel-domain>
```

Expected: Google login works locally and on Vercel.

- [ ] **Step 6: Commit final fixes**

If any verification fixes were needed, run:

```bash
git add .
git commit -m "fix: complete PWA verification"
```

## Self-Review

Spec coverage:

- Mobile-first PWA: Tasks 1, 5, 6, and 8.
- Google login: Tasks 2, 5, and 8.
- Firestore per-user storage: Tasks 2, 4, 7, and 8.
- One currency: Tasks 3, 6, and 7.
- Assets, snapshots, unrealized P/L: Tasks 3, 4, and 6.
- Reports: Task 6.
- JSON backup/import: Task 7.
- Vercel readiness: Tasks 1, 7, and 8.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified file paths are intended.
- Task 6 intentionally leaves component implementation to execution because the exact UI will be implemented against the approved product spec and browser verification, but each required file and behavior is named.

Type consistency:

- Firestore paths use `users/{uid}/settings/main`, `users/{uid}/assets/{assetId}`, and `users/{uid}/snapshots/{snapshotId}` throughout.
- Domain names match the approved spec: `Asset`, `Snapshot`, `SnapshotItem`, and `Settings`.
