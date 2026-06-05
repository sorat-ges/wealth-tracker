import { describe, expect, it } from "vitest";
import { calculateAssetSnapshotItem, calculateSnapshotSummary } from "./calculations";
import type { Asset, Liability } from "./types";

const timestamp = "2026-06-05T00:00:00.000Z";

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
      createdAt: timestamp,
      updatedAt: timestamp
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

  it("calculates market asset value from total cost and current value when units are not available", () => {
    const asset: Asset = {
      id: "gold-1",
      name: "Gold DCA",
      type: "gold",
      costBasis: 125000,
      currentValue: 142000,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    expect(calculateAssetSnapshotItem(asset)).toEqual({
      assetId: "gold-1",
      value: 142000,
      costBasis: 125000,
      unrealizedPL: 17000,
      unrealizedPLPercent: 13.6,
      quantity: undefined,
      price: undefined
    });
  });

  it("subtracts car loan debt from investable wealth without counting the car as an asset", () => {
    const assets: Asset[] = [
      {
        id: "cash",
        name: "Cash",
        type: "cash",
        currentValue: 5000,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];
    const liabilities: Liability[] = [
      {
        id: "car-loan",
        name: "Car Loan",
        type: "carLoan",
        currentBalance: 1200,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];

    expect(calculateSnapshotSummary(assets, liabilities)).toMatchObject({
      totalInvestableAssets: 5000,
      totalLiabilities: 1200,
      investableWealth: 3800
    });
  });

  it("ignores inactive assets and liabilities", () => {
    const assets: Asset[] = [
      {
        id: "cash",
        name: "Cash",
        type: "cash",
        currentValue: 1000,
        active: false,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];
    const liabilities: Liability[] = [
      {
        id: "old-debt",
        name: "Old Debt",
        type: "otherDebt",
        currentBalance: 500,
        active: false,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];

    expect(calculateSnapshotSummary(assets, liabilities)).toMatchObject({
      totalInvestableAssets: 0,
      totalLiabilities: 0,
      investableWealth: 0
    });
  });
});
