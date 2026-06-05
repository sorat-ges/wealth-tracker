# Wealth Tracker

Mobile-first PWA for daily investable wealth tracking, manual asset and liability updates, and unrealized P/L reports.

## Stack

- React + Vite + TypeScript
- Firebase Auth with Google sign-in
- Cloud Firestore
- Vercel deployment

## Phase 1 Scope

Phase 1 is manual-only for financial values. It does not connect to stock, index, crypto, fund, broker, bank, or market-data APIs.

The main number is:

```text
Investable Wealth = Investable Assets - Liabilities
```

Personal car value is not counted as an asset in phase 1. A car loan is counted as a liability.

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
users/{uid}/liabilities/{liabilityId}
users/{uid}/snapshots/{snapshotId}
```

## Firestore Rules

Publish `firebase.rules` in Firebase Console > Firestore > Rules.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run build
```
