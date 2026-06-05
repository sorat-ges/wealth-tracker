import { Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
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
  { value: "cash", label: "เงินสด / เงินฝาก" },
  { value: "stock", label: "หุ้น" },
  { value: "fund", label: "กองทุน / ETF" },
  { value: "crypto", label: "คริปโต" },
  { value: "gold", label: "ทอง" },
  { value: "other", label: "สินทรัพย์ลงทุนอื่น" }
];

const liabilityTypes: { value: LiabilityType; label: string }[] = [
  { value: "carLoan", label: "หนี้รถยนต์" },
  { value: "homeLoan", label: "หนี้บ้าน / คอนโด" },
  { value: "personalLoan", label: "สินเชื่อส่วนบุคคล" },
  { value: "creditCard", label: "บัตรเครดิต" },
  { value: "otherDebt", label: "หนี้อื่น" }
];

const marketAssetTypes = new Set<AssetType>(["stock", "fund", "crypto", "gold"]);
const assetTypeLabels = Object.fromEntries(assetTypes.map((type) => [type.value, type.label])) as Record<AssetType, string>;
const liabilityTypeLabels = Object.fromEntries(liabilityTypes.map((type) => [type.value, type.label])) as Record<LiabilityType, string>;

export function AssetsScreen({
  assets,
  liabilities,
  settings,
  onSaveAsset,
  onDeleteAsset,
  onSaveLiability,
  onDeleteLiability
}: AssetsScreenProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>("cash");
  const selectedAssetIsMarket = marketAssetTypes.has(selectedAssetType);

  async function handleAssetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(formElement);
    const type = form.get("type") as AssetType;
    const now = new Date().toISOString();
    const name = String(form.get("name") ?? "สินทรัพย์").trim();
    const existingAsset = assets.find((assetItem) => assetItem.type === type && normalizeName(assetItem.name) === normalizeName(name));
    const asset: Asset = {
      id: existingAsset?.id ?? crypto.randomUUID(),
      name,
      type,
      quantity: marketAssetTypes.has(type) ? toNumber(form.get("quantity")) : undefined,
      averageCost: marketAssetTypes.has(type) ? toNumber(form.get("averageCost")) : undefined,
      currentPrice: marketAssetTypes.has(type) ? toNumber(form.get("currentPrice")) : undefined,
      currentValue: marketAssetTypes.has(type) ? undefined : toNumber(form.get("currentValue")),
      active: true,
      createdAt: existingAsset?.createdAt ?? now,
      updatedAt: now
    };
    try {
      await onSaveAsset(asset);
      formElement.reset();
      setSelectedAssetType("cash");
      setMessage(existingAsset ? "อัปเดตสินทรัพย์เดิมแล้ว" : "บันทึกสินทรัพย์แล้ว");
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleLiabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(formElement);
    const now = new Date().toISOString();
    const type = form.get("type") as LiabilityType;
    const name = String(form.get("name") ?? "หนี้สิน").trim();
    const existingLiability = liabilities.find(
      (liabilityItem) => liabilityItem.type === type && normalizeName(liabilityItem.name) === normalizeName(name),
    );
    const liability: Liability = {
      id: existingLiability?.id ?? crypto.randomUUID(),
      name,
      type,
      currentBalance: toNumber(form.get("currentBalance")),
      active: true,
      createdAt: existingLiability?.createdAt ?? now,
      updatedAt: now
    };
    try {
      await onSaveLiability(liability);
      formElement.reset();
      setMessage(existingLiability ? "อัปเดตหนี้สินเดิมแล้ว" : "บันทึกหนี้สินแล้ว");
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">พอร์ตแบบกรอกเอง</p>
        <h1>สินทรัพย์และหนี้สิน</h1>
        <p>นับเฉพาะสินทรัพย์ลงทุน ไม่นับมูลค่ารถส่วนตัว แต่ยังนับหนี้รถยนต์เป็นหนี้สิน</p>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <article className="panel">
        <div className="section-heading">
          <h2>เพิ่มสินทรัพย์</h2>
          <Plus size={18} />
        </div>
        <form className="form-grid" onSubmit={handleAssetSubmit}>
          <label>
            ชื่อ
            <input name="name" required placeholder="เงินสำรอง, กองทุน S&P, BTC" />
          </label>
          <label>
            ประเภท
            <select name="type" value={selectedAssetType} onChange={(event) => setSelectedAssetType(event.currentTarget.value as AssetType)}>
              {assetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          {selectedAssetIsMarket ? (
            <>
              <label>
                จำนวนหน่วย
                <input name="quantity" inputMode="decimal" type="number" min="0" step="any" required placeholder="เช่น 10" />
              </label>
              <label>
                ต้นทุนเฉลี่ย
                <input name="averageCost" inputMode="decimal" type="number" min="0" step="any" required placeholder="กรอกต้นทุนเอง" />
              </label>
              <label>
                ราคาปัจจุบัน
                <input name="currentPrice" inputMode="decimal" type="number" min="0" step="any" required placeholder="กรอกราคาเอง" />
              </label>
            </>
          ) : (
            <label>
              มูลค่าปัจจุบัน
              <input name="currentValue" inputMode="decimal" type="number" min="0" step="any" required placeholder="เช่น 50000" />
            </label>
          )}
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกสินทรัพย์"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>เพิ่มหนี้สิน</h2>
          <Plus size={18} />
        </div>
        <form className="form-grid" onSubmit={handleLiabilitySubmit}>
          <label>
            ชื่อ
            <input name="name" required placeholder="หนี้รถยนต์" />
          </label>
          <label>
            ประเภท
            <select name="type" defaultValue="carLoan">
              {liabilityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            ยอดคงเหลือปัจจุบัน
            <input name="currentBalance" inputMode="decimal" type="number" min="0" step="any" required />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกหนี้สิน"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>สินทรัพย์ลงทุน</h2>
          <span>{assets.length}</span>
        </div>
        <div className="list-stack">
          {assets.map((asset) => (
            <div className="list-row" key={asset.id}>
              <div>
                <strong>{asset.name}</strong>
                <span>{assetTypeLabels[asset.type]}</span>
              </div>
              <div className="row-actions">
                <span>{formatCurrency(asset.currentValue ?? (asset.quantity ?? 0) * (asset.currentPrice ?? 0), settings.mainCurrency)}</span>
                <button className="icon-button" type="button" onClick={() => onDeleteAsset(asset.id)} aria-label={`ลบ ${asset.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!assets.length ? <p className="empty-text">ยังไม่มีสินทรัพย์</p> : null}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>หนี้สิน</h2>
          <span>{liabilities.length}</span>
        </div>
        <div className="list-stack">
          {liabilities.map((liability) => (
            <div className="list-row" key={liability.id}>
              <div>
                <strong>{liability.name}</strong>
                <span>{liabilityTypeLabels[liability.type]}</span>
              </div>
              <div className="row-actions">
                <span>{formatCurrency(liability.currentBalance, settings.mainCurrency)}</span>
                <button className="icon-button" type="button" onClick={() => onDeleteLiability(liability.id)} aria-label={`ลบ ${liability.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!liabilities.length ? <p className="empty-text">ยังไม่มีหนี้สิน เพิ่มหนี้รถยนต์ได้ที่นี่</p> : null}
        </div>
      </article>
    </section>
  );
}

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `บันทึกไม่สำเร็จ: ${error.message}`;
  }

  return "บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและ Firestore Rules";
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("th-TH");
}
