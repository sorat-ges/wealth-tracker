# Deposit Annual Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional annual return rates for cash/deposit assets and show expected yearly return in Assets and Reports.

**Architecture:** Keep the new behavior in domain helpers so UI code only formats and renders derived rows. Store `annualReturnRate?: number` on `Asset` for cash assets only; existing Firestore and backup behavior remains backward compatible because undefined fields are removed before writes.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, plain CSS, existing `MoneyInput` and formatter helpers.

---

## File Structure

- Modify: `src/domain/types.ts` to add `annualReturnRate?: number`.
- Modify: `src/domain/assets.ts` to add annual return helpers and preserve/clear the field in `createUpdatedAsset`.
- Modify: `src/domain/assets.test.ts` to drive helper behavior and edit preservation.
- Modify: `src/features/assets/AssetsScreen.tsx` to collect and display annual return rates for cash assets.
- Modify: `src/features/dashboard/Dashboard.tsx` to show total expected annual deposit return on the first screen.
- Modify: `src/features/reports/ReportsScreen.tsx` to render the deposit annual return summary.

## Task 1: Domain Model and Calculations

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/assets.ts`
- Test: `src/domain/assets.test.ts`

- [ ] **Step 1: Write failing annual return helper tests**

Add tests to `src/domain/assets.test.ts`:

```ts
import {
  createUpdatedAsset,
  getDepositAnnualReturnRows,
  getTotalDepositAnnualReturn,
  groupAssetsByType
} from "./assets";

it("calculates expected annual return for active cash assets with positive rates", () => {
  const assets: Asset[] = [
    {
      id: "deposit",
      name: "Deposit",
      type: "cash",
      currentValue: 100000,
      annualReturnRate: 1.5,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "inactive",
      name: "Inactive Deposit",
      type: "cash",
      currentValue: 200000,
      annualReturnRate: 2,
      active: false,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "fund",
      name: "Fund",
      type: "fund",
      currentValue: 100000,
      annualReturnRate: 10,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  expect(getDepositAnnualReturnRows(assets)).toEqual([
    {
      assetId: "deposit",
      name: "Deposit",
      currentValue: 100000,
      annualReturnRate: 1.5,
      annualReturn: 1500
    }
  ]);
  expect(getTotalDepositAnnualReturn(assets)).toBe(1500);
});

it("clears deposit annual return rate when an edited asset is not cash", () => {
  const asset: Asset = {
    id: "deposit",
    name: "Deposit",
    type: "cash",
    currentValue: 100000,
    annualReturnRate: 1.5,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  expect(
    createUpdatedAsset(
      asset,
      {
        name: "Money Market",
        type: "fund",
        costBasis: 100000,
        currentValue: 101000,
        annualReturnRate: 1.5
      },
      "2026-06-06T00:00:00.000Z",
    ).annualReturnRate,
  ).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --run src/domain/assets.test.ts
```

Expected: fail because annual return helpers and `annualReturnRate` support are missing.

- [ ] **Step 3: Implement minimal domain support**

Update `src/domain/types.ts`:

```ts
annualReturnRate?: number;
```

Add helpers in `src/domain/assets.ts`:

```ts
export type DepositAnnualReturnRow = {
  assetId: string;
  name: string;
  currentValue: number;
  annualReturnRate: number;
  annualReturn: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getAssetAnnualReturnRate(asset: Asset) {
  return asset.type === "cash" ? asset.annualReturnRate : undefined;
}

export function getAssetAnnualReturn(asset: Asset) {
  const rate = getAssetAnnualReturnRate(asset);
  if (!rate || rate <= 0) {
    return 0;
  }

  return roundMoney((getAssetValue(asset) * rate) / 100);
}

export function getDepositAnnualReturnRows(assets: Asset[]): DepositAnnualReturnRow[] {
  return assets
    .filter((asset) => asset.active && asset.type === "cash")
    .map((asset) => ({
      assetId: asset.id,
      name: asset.name,
      currentValue: getAssetValue(asset),
      annualReturnRate: asset.annualReturnRate ?? 0,
      annualReturn: getAssetAnnualReturn(asset)
    }))
    .filter((row) => row.currentValue > 0 && row.annualReturnRate > 0 && row.annualReturn > 0)
    .sort((left, right) => right.annualReturn - left.annualReturn);
}

export function getTotalDepositAnnualReturn(assets: Asset[]) {
  return roundMoney(getDepositAnnualReturnRows(assets).reduce((sum, row) => sum + row.annualReturn, 0));
}
```

Extend `createUpdatedAsset` values with `annualReturnRate?: number` and set:

```ts
annualReturnRate: values.type === "cash" ? values.annualReturnRate : undefined,
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --run src/domain/assets.test.ts
```

Expected: pass.

## Task 2: Assets Screen Input and Row Display

**Files:**
- Modify: `src/features/assets/AssetsScreen.tsx`
- Test: `src/domain/assets.test.ts`

- [ ] **Step 1: Use existing domain tests as coverage**

No React component tests currently exist. Use the domain tests from Task 1 to lock the data contract before wiring the screen.

- [ ] **Step 2: Add cash-only annual return fields**

Import annual return helpers:

```ts
getAssetAnnualReturn,
getAssetAnnualReturnRate
```

When creating an asset, include:

```ts
annualReturnRate: type === "cash" ? toNumber(form.get("annualReturnRate")) : undefined,
```

When editing an asset, pass:

```ts
annualReturnRate: type === "cash" ? toNumber(form.get("annualReturnRate")) : undefined,
```

Show this form field only for cash assets:

```tsx
<label>
  ผลตอบแทนต่อปี (%)
  <MoneyInput name="annualReturnRate" min={0} placeholder="เช่น 1.5" />
</label>
```

For edit forms, use:

```tsx
defaultValue={getAssetAnnualReturnRate(asset)}
```

Display the derived return in cash rows when `getAssetAnnualReturn(asset) > 0`.

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- --run src/domain/assets.test.ts
```

Expected: pass.

## Task 3: Reports Annual Return Panel

**Files:**
- Modify: `src/features/reports/ReportsScreen.tsx`

- [ ] **Step 1: Import report helpers**

Import:

```ts
getDepositAnnualReturnRows,
getTotalDepositAnnualReturn
```

- [ ] **Step 2: Render a deposit annual return panel**

Compute:

```ts
const depositReturnRows = getDepositAnnualReturnRows(assets);
const totalDepositAnnualReturn = getTotalDepositAnnualReturn(assets);
```

Add a panel before the unrealized P/L panel:

```tsx
<article className="panel">
  <div className="section-heading">
    <h2>ผลตอบแทนเงินฝากรายปี</h2>
    <span>{formatCurrency(totalDepositAnnualReturn, settings.mainCurrency)}</span>
  </div>
  {depositReturnRows.length ? (
    <div className="list-stack">
      {depositReturnRows.map((row) => (
        <div className="list-row" key={row.assetId}>
          <div>
            <strong>{row.name}</strong>
            <span>{row.annualReturnRate.toLocaleString("th-TH")}% ต่อปี</span>
          </div>
          <div className="row-actions">
            <span>{formatCurrency(row.annualReturn, settings.mainCurrency)}</span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="empty-text">เงินฝากที่ใส่อัตราผลตอบแทนจะแสดงที่นี่</p>
  )}
</article>
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm test -- --run
npm run build
```

Expected: all tests pass and build exits 0.

## Task 4: Dashboard Total Annual Return

**Files:**
- Modify: `src/features/dashboard/Dashboard.tsx`
- Modify: `src/styles/global.css`
- Test: `src/features/dashboard/Dashboard.test.tsx`

- [ ] **Step 1: Write the failing dashboard test**

Render `Dashboard` with one active cash asset using `annualReturnRate: 1.5` and `currentValue: 100000`. Assert that the screen shows `ผลตอบแทนเงินฝากรายปี` and `฿1,500`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --run src/features/dashboard/Dashboard.test.tsx
```

Expected: fail because the dashboard does not render the annual return label yet.

- [ ] **Step 3: Render total annual return**

Use `getTotalDepositAnnualReturn(assets)` in `Dashboard.tsx` and add a metric card labeled `ผลตอบแทนเงินฝากรายปี`.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- --run src/features/dashboard/Dashboard.test.tsx
npm test -- --run
npm run build
```

Expected: all tests pass and build exits 0.
