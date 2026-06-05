import type { Asset, AssetType } from "./types";

const assetTypeOrder: AssetType[] = ["cash", "stock", "fund", "crypto", "gold", "other"];

export function getAssetValue(asset: Asset) {
  return asset.currentValue ?? (asset.quantity ?? 0) * (asset.currentPrice ?? 0);
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
