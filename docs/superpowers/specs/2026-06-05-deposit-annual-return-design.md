# Deposit Annual Return Design

Date: 2026-06-05
Status: Approved for implementation

## Goal

Allow deposit-style cash assets to store an annual return rate and show the expected annual return amount. The feature keeps the current manual workflow: users still enter the current balance themselves, while the app derives expected yearly return from that balance.

## Product Behavior

Users enter `annualReturnRate` as a percent per year for assets with type `cash`.

```text
annualReturn = currentValue * annualReturnRate / 100
```

Examples:

- `currentValue = 100000`, `annualReturnRate = 1.5` gives `annualReturn = 1500`.
- Missing `annualReturnRate` gives no annual return display and contributes `0` to the total expected annual return.

The value is an expected yearly return from the current balance. It is not realized income, not a transaction record, and not part of unrealized profit/loss.

## Screens

### Assets

The add and edit asset forms show an optional "ผลตอบแทนต่อปี (%)" field only when the selected type is `cash`.

Cash/deposit rows with a positive annual return rate show the expected annual return amount and the percent rate. Existing cash assets without the field continue to display normally.

### Dashboard

The dashboard metric grid shows total expected annual deposit return across active cash assets. This gives the first screen a portfolio-level view of yearly deposit income without mixing it into unrealized P/L.

### Daily Update

The daily update screen remains focused on current balances. Users update the deposit balance only; the annual return rate stays on the asset record until edited from the Assets screen.

### Reports

Reports include a "ผลตอบแทนเงินฝากรายปี" panel. The panel shows:

- Total expected annual return across active cash assets.
- One row per active cash asset with a positive annual return rate and current value.
- The annual return amount and percent rate for each row.

If there are no eligible cash assets, the panel shows an empty state.

## Data Model

Add an optional field to `Asset`:

```ts
annualReturnRate?: number;
```

The field is used only for `cash` assets. When an asset changes from `cash` to another type, the field is cleared so non-cash assets do not retain stale deposit return metadata.

Firestore and backup payloads remain version `1` because the field is optional and backward compatible.

## Calculations

Add focused domain helpers:

```ts
getAssetAnnualReturnRate(asset): number | undefined
getAssetAnnualReturn(asset): number
getDepositAnnualReturnRows(assets): DepositAnnualReturnRow[]
getTotalDepositAnnualReturn(assets): number
```

Rows include active `cash` assets only when both current value and annual return rate are positive. Values are rounded to two decimal places using the same money rounding convention as snapshot calculations.

## Testing

Add tests for:

- Calculating annual return for cash assets from current value and percent rate.
- Ignoring inactive assets, non-cash assets, missing rates, zero rates, and zero balances.
- Preserving `annualReturnRate` when editing a cash asset.
- Clearing `annualReturnRate` when changing a cash asset to a non-cash asset.
- Showing total expected annual deposit return on the dashboard.

Run:

```bash
npm test -- --run
npm run build
```
