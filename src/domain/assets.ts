import type { Asset, AssetType } from "./types";

const assetTypeOrder: AssetType[] = ["cash", "stock", "fund", "crypto", "gold", "other"];
const marketAssetTypes = new Set<AssetType>(["stock", "fund", "crypto", "gold"]);

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

export function getAssetValue(asset: Asset) {
  return asset.currentValue ?? (asset.quantity ?? 0) * (asset.currentPrice ?? 0);
}

export function getAssetCostBasis(asset: Asset) {
  return asset.costBasis ?? (asset.quantity ?? 0) * (asset.averageCost ?? 0);
}

export function getAssetAnnualReturnRate(asset: Asset) {
  return asset.type === "cash" ? asset.annualReturnRate : undefined;
}

export function getAssetAnnualReturn(asset: Asset) {
  const annualReturnRate = getAssetAnnualReturnRate(asset);
  if (!annualReturnRate || annualReturnRate <= 0) {
    return 0;
  }

  return roundMoney((getAssetValue(asset) * annualReturnRate) / 100);
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

export function groupAssetsByType(assets: Asset[]) {
  return assetTypeOrder
    .map((type) => ({
      type,
      assets: assets
        .filter((asset) => asset.active && asset.type === type)
        .sort((left, right) => getAssetValue(right) - getAssetValue(left))
    }))
    .filter((group) => group.assets.length > 0);
}

export function createUpdatedAsset(
  asset: Asset,
  values: {
    name: string;
    type: AssetType;
    costBasis?: number;
    currentValue: number;
    annualReturnRate?: number;
  },
  now: string,
): Asset {
  return {
    ...asset,
    name: values.name,
    type: values.type,
    quantity: undefined,
    averageCost: undefined,
    costBasis: marketAssetTypes.has(values.type) ? values.costBasis : undefined,
    currentPrice: undefined,
    currentValue: values.currentValue,
    annualReturnRate: values.type === "cash" ? values.annualReturnRate : undefined,
    updatedAt: now
  };
}
