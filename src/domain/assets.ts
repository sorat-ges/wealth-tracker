import type { Asset, AssetType } from "./types";

const assetTypeOrder: AssetType[] = ["cash", "stock", "fund", "crypto", "gold", "other"];
const marketAssetTypes = new Set<AssetType>(["stock", "fund", "crypto", "gold"]);

export function getAssetValue(asset: Asset) {
  return asset.currentValue ?? (asset.quantity ?? 0) * (asset.currentPrice ?? 0);
}

export function getAssetCostBasis(asset: Asset) {
  return asset.costBasis ?? (asset.quantity ?? 0) * (asset.averageCost ?? 0);
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
    updatedAt: now
  };
}
