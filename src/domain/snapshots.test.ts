import { describe, expect, it } from "vitest";
import type { Snapshot } from "./types";
import { updateSnapshotTotals } from "./snapshots";

const baseSnapshot: Snapshot = {
  id: "snapshot-1",
  date: "2026-06-05",
  investableWealth: 50000,
  totalInvestableAssets: 50000,
  totalLiabilities: 0,
  totalUnrealizedPL: 0,
  totalUnrealizedPLPercent: 0,
  items: [
    {
      assetId: "fund-1",
      value: 12000,
      costBasis: 10000,
      unrealizedPL: 2000,
      unrealizedPLPercent: 20
    }
  ],
  liabilities: [
    {
      liabilityId: "car-loan",
      balance: 0
    }
  ],
  createdAt: "2026-06-05T01:00:00.000Z",
  updatedAt: "2026-06-05T01:00:00.000Z"
};

describe("updateSnapshotTotals", () => {
  it("updates editable totals without changing the captured asset and liability rows", () => {
    expect(
      updateSnapshotTotals(
        baseSnapshot,
        {
          date: "2026-06-04",
          totalInvestableAssets: 75000.555,
          totalLiabilities: 25000.222,
          totalUnrealizedPL: 5000
        },
        "2026-06-05T02:00:00.000Z",
      ),
    ).toEqual({
      ...baseSnapshot,
      date: "2026-06-04",
      totalInvestableAssets: 75000.56,
      totalLiabilities: 25000.22,
      investableWealth: 50000.34,
      totalUnrealizedPL: 5000,
      totalUnrealizedPLPercent: 50,
      updatedAt: "2026-06-05T02:00:00.000Z"
    });
  });
});
