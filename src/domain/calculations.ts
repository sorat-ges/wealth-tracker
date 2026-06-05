import type { Asset, Liability, SnapshotItem } from "./types";

const marketTypes = new Set<Asset["type"]>(["stock", "fund", "crypto", "gold"]);

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

export function calculateSnapshotSummary(assets: Asset[], liabilities: Liability[] = []) {
  const activeAssets = assets.filter((asset) => asset.active);
  const activeLiabilities = liabilities.filter((liability) => liability.active);
  const items = activeAssets.map(calculateAssetSnapshotItem);
  const liabilityItems = activeLiabilities.map((liability) => ({
    liabilityId: liability.id,
    balance: roundMoney(liability.currentBalance)
  }));
  const totalLiabilities = roundMoney(liabilityItems.reduce((sum, liability) => sum + liability.balance, 0));
  const totalInvestableAssets = roundMoney(activeAssets.reduce((sum, asset) => sum + getCurrentValue(asset), 0));
  const totalUnrealizedPL = roundMoney(items.reduce((sum, item) => sum + (item.unrealizedPL ?? 0), 0));
  const totalCostBasis = roundMoney(items.reduce((sum, item) => sum + (item.costBasis ?? 0), 0));

  return {
    items,
    liabilities: liabilityItems,
    totalInvestableAssets,
    totalLiabilities,
    investableWealth: roundMoney(totalInvestableAssets - totalLiabilities),
    totalUnrealizedPL,
    totalUnrealizedPLPercent: totalCostBasis > 0 ? roundMoney((totalUnrealizedPL / totalCostBasis) * 100) : 0
  };
}
