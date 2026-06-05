import type { Snapshot } from "./types";

function roundMoney(value: number) {
  return Number(`${Math.round(Number(`${value}e2`))}e-2`);
}

export function updateSnapshotTotals(
  snapshot: Snapshot,
  values: {
    date: string;
    totalInvestableAssets: number;
    totalLiabilities: number;
    totalUnrealizedPL: number;
  },
  now: string,
): Snapshot {
  const totalInvestableAssets = roundMoney(values.totalInvestableAssets);
  const totalLiabilities = roundMoney(values.totalLiabilities);
  const totalUnrealizedPL = roundMoney(values.totalUnrealizedPL);
  const totalCostBasis = roundMoney(snapshot.items.reduce((sum, item) => sum + (item.costBasis ?? 0), 0));

  return {
    ...snapshot,
    date: values.date,
    totalInvestableAssets,
    totalLiabilities,
    investableWealth: roundMoney(totalInvestableAssets - totalLiabilities),
    totalUnrealizedPL,
    totalUnrealizedPLPercent: totalCostBasis > 0 ? roundMoney((totalUnrealizedPL / totalCostBasis) * 100) : 0,
    updatedAt: now
  };
}
