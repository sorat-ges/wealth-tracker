import { describe, expect, it } from "vitest";
import { createUpdatedAsset, getDepositAnnualReturnRows, getTotalDepositAnnualReturn, groupAssetsByType } from "./assets";
import type { Asset } from "./types";

const timestamp = "2026-06-05T00:00:00.000Z";

describe("asset helpers", () => {
  it("groups assets by type and sorts each group by current value descending", () => {
    const assets: Asset[] = [
      {
        id: "fund-small",
        name: "Small Fund",
        type: "fund",
        currentValue: 1000,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: "cash",
        name: "Cash",
        type: "cash",
        currentValue: 500,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: "fund-large",
        name: "Large Fund",
        type: "fund",
        currentValue: 3000,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: "old-gold",
        name: "Inactive Gold",
        type: "gold",
        currentValue: 10000,
        active: false,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];

    expect(groupAssetsByType(assets).map((group) => [group.type, group.assets.map((asset) => asset.id)])).toEqual([
      ["cash", ["cash"]],
      ["fund", ["fund-large", "fund-small"]]
    ]);
  });

  it("creates an updated asset without changing its id or created timestamp", () => {
    const asset: Asset = {
      id: "gold",
      name: "Gold",
      type: "gold",
      costBasis: 12000,
      currentValue: 12800,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    expect(
      createUpdatedAsset(
        asset,
        {
          name: "Gold DCA",
          type: "gold",
          costBasis: 14000,
          currentValue: 15100
        },
        "2026-06-06T00:00:00.000Z",
      ),
    ).toEqual({
      ...asset,
      name: "Gold DCA",
      costBasis: 14000,
      currentValue: 15100,
      updatedAt: "2026-06-06T00:00:00.000Z"
    });
  });

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
      },
      {
        id: "zero-rate",
        name: "Zero Rate",
        type: "cash",
        currentValue: 100000,
        annualReturnRate: 0,
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

  it("preserves deposit annual return rate for cash edits and clears it for non-cash edits", () => {
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
          name: "High Yield Deposit",
          type: "cash",
          currentValue: 120000,
          annualReturnRate: 1.75
        },
        "2026-06-06T00:00:00.000Z",
      ),
    ).toMatchObject({
      annualReturnRate: 1.75,
      currentValue: 120000
    });

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
});
