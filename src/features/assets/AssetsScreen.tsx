import { Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import type { Asset, AssetType, Liability, LiabilityType, Settings } from "../../domain/types";
import { formatCurrency, toNumber } from "../../utils/format";

type AssetsScreenProps = {
  assets: Asset[];
  liabilities: Liability[];
  settings: Settings;
  onSaveAsset: (asset: Asset) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onSaveLiability: (liability: Liability) => Promise<void>;
  onDeleteLiability: (liabilityId: string) => Promise<void>;
};

const assetTypes: { value: AssetType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "stock", label: "Stock" },
  { value: "fund", label: "Fund / ETF" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "other", label: "Other Investable" }
];

const liabilityTypes: { value: LiabilityType; label: string }[] = [
  { value: "carLoan", label: "Car Loan" },
  { value: "homeLoan", label: "Home Loan" },
  { value: "personalLoan", label: "Personal Loan" },
  { value: "creditCard", label: "Credit Card" },
  { value: "otherDebt", label: "Other Debt" }
];

const marketAssetTypes = new Set<AssetType>(["stock", "fund", "crypto", "gold"]);

export function AssetsScreen({
  assets,
  liabilities,
  settings,
  onSaveAsset,
  onDeleteAsset,
  onSaveLiability,
  onDeleteLiability
}: AssetsScreenProps) {
  async function handleAssetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = form.get("type") as AssetType;
    const now = new Date().toISOString();
    const asset: Asset = {
      id: crypto.randomUUID(),
      name: String(form.get("name") ?? "Asset").trim(),
      type,
      quantity: marketAssetTypes.has(type) ? toNumber(form.get("quantity")) : undefined,
      averageCost: marketAssetTypes.has(type) ? toNumber(form.get("averageCost")) : undefined,
      currentPrice: marketAssetTypes.has(type) ? toNumber(form.get("currentPrice")) : undefined,
      currentValue: marketAssetTypes.has(type) ? undefined : toNumber(form.get("currentValue")),
      active: true,
      createdAt: now,
      updatedAt: now
    };
    await onSaveAsset(asset);
    event.currentTarget.reset();
  }

  async function handleLiabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const liability: Liability = {
      id: crypto.randomUUID(),
      name: String(form.get("name") ?? "Liability").trim(),
      type: form.get("type") as LiabilityType,
      currentBalance: toNumber(form.get("currentBalance")),
      active: true,
      createdAt: now,
      updatedAt: now
    };
    await onSaveLiability(liability);
    event.currentTarget.reset();
  }

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">Manual Portfolio</p>
        <h1>Assets & debts</h1>
        <p>Track investable assets only. Personal car value is excluded; car loan debt is included.</p>
      </div>

      <article className="panel">
        <div className="section-heading">
          <h2>Add Asset</h2>
          <Plus size={18} />
        </div>
        <form className="form-grid" onSubmit={handleAssetSubmit}>
          <label>
            Name
            <input name="name" required placeholder="Emergency cash, S&P fund, BTC" />
          </label>
          <label>
            Type
            <select name="type" defaultValue="cash">
              {assetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input name="quantity" inputMode="decimal" type="number" min="0" step="any" placeholder="For market assets" />
          </label>
          <label>
            Average Cost
            <input name="averageCost" inputMode="decimal" type="number" min="0" step="any" placeholder="Manual cost" />
          </label>
          <label>
            Current Price
            <input name="currentPrice" inputMode="decimal" type="number" min="0" step="any" placeholder="Manual price" />
          </label>
          <label>
            Current Value
            <input name="currentValue" inputMode="decimal" type="number" min="0" step="any" placeholder="Cash or other value" />
          </label>
          <button className="primary-button" type="submit">
            Save Asset
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>Add Liability</h2>
          <Plus size={18} />
        </div>
        <form className="form-grid" onSubmit={handleLiabilitySubmit}>
          <label>
            Name
            <input name="name" required placeholder="Car loan" />
          </label>
          <label>
            Type
            <select name="type" defaultValue="carLoan">
              {liabilityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Current Balance
            <input name="currentBalance" inputMode="decimal" type="number" min="0" step="any" required />
          </label>
          <button className="primary-button" type="submit">
            Save Liability
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>Investable Assets</h2>
          <span>{assets.length}</span>
        </div>
        <div className="list-stack">
          {assets.map((asset) => (
            <div className="list-row" key={asset.id}>
              <div>
                <strong>{asset.name}</strong>
                <span>{asset.type}</span>
              </div>
              <div className="row-actions">
                <span>{formatCurrency(asset.currentValue ?? (asset.quantity ?? 0) * (asset.currentPrice ?? 0), settings.mainCurrency)}</span>
                <button className="icon-button" type="button" onClick={() => onDeleteAsset(asset.id)} aria-label={`Delete ${asset.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!assets.length ? <p className="empty-text">No assets yet.</p> : null}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>Liabilities</h2>
          <span>{liabilities.length}</span>
        </div>
        <div className="list-stack">
          {liabilities.map((liability) => (
            <div className="list-row" key={liability.id}>
              <div>
                <strong>{liability.name}</strong>
                <span>{liability.type}</span>
              </div>
              <div className="row-actions">
                <span>{formatCurrency(liability.currentBalance, settings.mainCurrency)}</span>
                <button className="icon-button" type="button" onClick={() => onDeleteLiability(liability.id)} aria-label={`Delete ${liability.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!liabilities.length ? <p className="empty-text">No debts yet. Add your car loan here.</p> : null}
        </div>
      </article>
    </section>
  );
}
