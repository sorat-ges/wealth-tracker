import type { FormEvent } from "react";
import { calculateSnapshotSummary } from "../../domain/calculations";
import type { Asset, Liability, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, toNumber, todayId } from "../../utils/format";

type UpdateScreenProps = {
  assets: Asset[];
  liabilities: Liability[];
  settings: Settings;
  onSaveAsset: (asset: Asset) => Promise<void>;
  onSaveLiability: (liability: Liability) => Promise<void>;
  onSaveSnapshot: (snapshot: Snapshot) => Promise<void>;
};

const marketAssetTypes = new Set<Asset["type"]>(["stock", "fund", "crypto", "gold"]);

export function UpdateScreen({
  assets,
  liabilities,
  settings,
  onSaveAsset,
  onSaveLiability,
  onSaveSnapshot
}: UpdateScreenProps) {
  const summary = calculateSnapshotSummary(assets, liabilities);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const date = String(form.get("date") ?? todayId());

    const updatedAssets = assets.map((asset) => {
      const value = toNumber(form.get(`asset-${asset.id}`));
      return {
        ...asset,
        currentPrice: marketAssetTypes.has(asset.type) ? value : asset.currentPrice,
        currentValue: marketAssetTypes.has(asset.type) ? asset.currentValue : value,
        updatedAt: now
      };
    });
    const updatedLiabilities = liabilities.map((liability) => ({
      ...liability,
      currentBalance: toNumber(form.get(`liability-${liability.id}`)),
      updatedAt: now
    }));
    const nextSummary = calculateSnapshotSummary(updatedAssets, updatedLiabilities);
    const snapshot: Snapshot = {
      id: date,
      date,
      ...nextSummary,
      createdAt: now,
      updatedAt: now
    };

    await Promise.all([
      ...updatedAssets.map((asset) => onSaveAsset(asset)),
      ...updatedLiabilities.map((liability) => onSaveLiability(liability)),
      onSaveSnapshot(snapshot)
    ]);
  }

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">Daily Update</p>
        <h1>Manual values only</h1>
        <p>Enter prices and balances yourself. No stock, index, crypto, broker, or bank APIs are used.</p>
      </div>

      <article className="summary-strip">
        <span>Current Investable Wealth</span>
        <strong>{formatCurrency(summary.investableWealth, settings.mainCurrency)}</strong>
      </article>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Snapshot Date
          <input name="date" type="date" defaultValue={todayId()} required />
        </label>

        <div className="form-section-label">Assets</div>
        {assets.map((asset) => (
          <label key={asset.id}>
            {asset.name}
            <input
              name={`asset-${asset.id}`}
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              defaultValue={marketAssetTypes.has(asset.type) ? asset.currentPrice ?? 0 : asset.currentValue ?? 0}
            />
            <small>{marketAssetTypes.has(asset.type) ? "Manual current price" : "Manual current value"}</small>
          </label>
        ))}
        {!assets.length ? <p className="empty-text">Add assets before saving a snapshot.</p> : null}

        <div className="form-section-label">Liabilities</div>
        {liabilities.map((liability) => (
          <label key={liability.id}>
            {liability.name}
            <input
              name={`liability-${liability.id}`}
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              defaultValue={liability.currentBalance}
            />
            <small>Manual remaining debt balance</small>
          </label>
        ))}

        <button className="primary-button" type="submit" disabled={!assets.length && !liabilities.length}>
          Save Daily Snapshot
        </button>
      </form>
    </section>
  );
}
