import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { MoneyInput } from "../../components/MoneyInput";
import {
  createUpdatedAsset,
  getAssetAnnualReturn,
  getAssetAnnualReturnRate,
  getAssetCostBasis,
  getAssetValue,
  groupAssetsByType
} from "../../domain/assets";
import { createUpdatedLiability } from "../../domain/liabilities";
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
  isPrivate?: boolean;
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
  onDeleteLiability,
  isPrivate
}: AssetsScreenProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formatMoney = (val: number) => isPrivate ? "••••" : formatCurrency(val, settings.mainCurrency);
  const [saving, setSaving] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>("cash");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAssetType, setEditingAssetType] = useState<AssetType>("cash");
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const selectedAssetIsMarket = marketAssetTypes.has(selectedAssetType);
  const editingAssetIsMarket = marketAssetTypes.has(editingAssetType);
  const assetGroups = groupAssetsByType(assets);
  const editingAsset = assets.find((asset) => asset.id === editingAssetId);
  const editingLiability = liabilities.find((liability) => liability.id === editingLiabilityId);

  function closeAssetEditor() {
    setEditingAssetId(null);
    setEditingAssetType("cash");
  }

  function closeLiabilityEditor() {
    setEditingLiabilityId(null);
  }

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
      quantity: undefined,
      averageCost: undefined,
      costBasis: marketAssetTypes.has(type) ? toNumber(form.get("costBasis")) : undefined,
      currentPrice: undefined,
      currentValue: toNumber(form.get("currentValue")),
      annualReturnRate: type === "cash" ? toOptionalPositiveNumber(form.get("annualReturnRate")) : undefined,
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

  async function handleAssetEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAsset) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const type = form.get("type") as AssetType;
    const nextAsset = createUpdatedAsset(
      editingAsset,
      {
        name: String(form.get("name") ?? editingAsset.name).trim(),
        type,
        costBasis: marketAssetTypes.has(type) ? toNumber(form.get("costBasis")) : undefined,
        currentValue: toNumber(form.get("currentValue")),
        annualReturnRate: type === "cash" ? toOptionalPositiveNumber(form.get("annualReturnRate")) : undefined
      },
      new Date().toISOString(),
    );

    try {
      await onSaveAsset(nextAsset);
      closeAssetEditor();
      setMessage("แก้ไขสินทรัพย์แล้ว");
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleLiabilityEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLiability) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const nextLiability = createUpdatedLiability(
      editingLiability,
      {
        name: String(form.get("name") ?? editingLiability.name).trim(),
        type: form.get("type") as LiabilityType,
        currentBalance: toNumber(form.get("currentBalance"))
      },
      new Date().toISOString(),
    );

    try {
      await onSaveLiability(nextLiability);
      closeLiabilityEditor();
      setMessage("แก้ไขหนี้สินแล้ว");
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
                เงินลงทุนรวม
                <MoneyInput name="costBasis" min={0} required placeholder="เช่น 125000" />
              </label>
              <label>
                มูลค่าปัจจุบันรวม
                <MoneyInput name="currentValue" min={0} required placeholder="เช่น 142000" />
              </label>
            </>
          ) : (
            <>
              <label>
                มูลค่าปัจจุบัน
                <MoneyInput name="currentValue" min={0} required placeholder="เช่น 50000" />
              </label>
              {selectedAssetType === "cash" ? (
                <label>
                  ผลตอบแทนต่อปี (%)
                  <MoneyInput name="annualReturnRate" min={0} placeholder="เช่น 1.5" />
                </label>
              ) : null}
            </>
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
            <MoneyInput name="currentBalance" min={0} required />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกหนี้สิน"}
          </button>
        </form>
      </article>

      {!assetGroups.length ? (
        <article className="panel">
          <div className="section-heading">
            <h2>สินทรัพย์ลงทุน</h2>
            <span>0</span>
          </div>
          <p className="empty-text">ยังไม่มีสินทรัพย์</p>
        </article>
      ) : null}

      {assetGroups.map((group) => {
        const groupTotal = group.assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
        return (
          <article className="panel" key={group.type}>
            <div className="section-heading">
              <h2>{assetTypeLabels[group.type]}</h2>
              <span>{formatMoney(groupTotal)} · {group.assets.length} รายการ</span>
            </div>
            <div className="list-stack">
              {group.assets.map((asset) => (
                <div className={editingAssetId === asset.id ? "list-row list-row-editing" : "list-row"} key={asset.id}>
                  <div>
                    <strong>{asset.name}</strong>
                    <span>{assetTypeLabels[asset.type]}</span>
                    {getAssetAnnualReturn(asset) > 0 ? (
                      <span>
                        ผลตอบแทนรายปี {formatMoney(getAssetAnnualReturn(asset))} (
                        {getAssetAnnualReturnRate(asset)?.toLocaleString("th-TH")}%)
                      </span>
                    ) : null}
                  </div>
                  <div className="row-actions">
                    <span>{formatMoney(getAssetValue(asset))}</span>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => {
                        setEditingAssetId(asset.id);
                        setEditingAssetType(asset.type);
                      }}
                      aria-label={`แก้ไข ${asset.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger-button"
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(`คุณต้องการลบ "${asset.name}" ใช่หรือไม่?`);
                        if (confirmed) {
                          onDeleteAsset(asset.id);
                        }
                      }}
                      aria-label={`ลบ ${asset.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                {editingAssetId === asset.id ? (
                  <form className="edit-form" onSubmit={handleAssetEditSubmit}>
                    <div className="section-heading">
                      <h2>แก้ไขสินทรัพย์</h2>
                      <button className="icon-button" type="button" onClick={closeAssetEditor} aria-label="ปิดฟอร์มแก้ไข">
                        <X size={16} />
                      </button>
                    </div>
                    <label>
                      ชื่อ
                      <input name="name" defaultValue={asset.name} required />
                    </label>
                    <label>
                      ประเภท
                      <select
                        name="type"
                        value={editingAssetType}
                        onChange={(event) => setEditingAssetType(event.currentTarget.value as AssetType)}
                      >
                        {assetTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {editingAssetIsMarket ? (
                      <label>
                        เงินลงทุนรวม
                        <MoneyInput name="costBasis" min={0} defaultValue={getAssetCostBasis(asset)} required />
                      </label>
                    ) : null}
                    <label>
                      มูลค่าปัจจุบันรวม
                      <MoneyInput name="currentValue" min={0} defaultValue={getAssetValue(asset)} required />
                    </label>
                    {editingAssetType === "cash" ? (
                      <label>
                        ผลตอบแทนต่อปี (%)
                        <MoneyInput name="annualReturnRate" min={0} defaultValue={getAssetAnnualReturnRate(asset)} placeholder="เช่น 1.5" />
                      </label>
                    ) : null}
                    <button className="primary-button" type="submit" disabled={saving}>
                      {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      );
    })}

      <article className="panel">
        <div className="section-heading">
          <h2>หนี้สิน</h2>
          <span>{formatMoney(liabilities.reduce((sum, l) => sum + l.currentBalance, 0))} · {liabilities.length} รายการ</span>
        </div>
        <div className="list-stack">
          {liabilities.map((liability) => (
            <div className={editingLiabilityId === liability.id ? "list-row list-row-editing" : "list-row"} key={liability.id}>
              <div>
                <strong>{liability.name}</strong>
                <span>{liabilityTypeLabels[liability.type]}</span>
              </div>
              <div className="row-actions">
                <span>{formatMoney(liability.currentBalance)}</span>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => {
                    setEditingLiabilityId(liability.id);
                  }}
                  aria-label={`แก้ไข ${liability.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger-button"
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(`คุณต้องการลบ "${liability.name}" ใช่หรือไม่?`);
                    if (confirmed) {
                      onDeleteLiability(liability.id);
                    }
                  }}
                  aria-label={`ลบ ${liability.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {editingLiabilityId === liability.id ? (
                <form className="edit-form" onSubmit={handleLiabilityEditSubmit}>
                  <div className="section-heading">
                    <h2>แก้ไขหนี้สิน</h2>
                    <button className="icon-button" type="button" onClick={closeLiabilityEditor} aria-label="ปิดฟอร์มแก้ไข">
                      <X size={16} />
                    </button>
                  </div>
                  <label>
                    ชื่อ
                    <input name="name" defaultValue={liability.name} required />
                  </label>
                  <label>
                    ประเภท
                    <select name="type" defaultValue={liability.type}>
                      {liabilityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ยอดคงเหลือปัจจุบัน
                    <MoneyInput name="currentBalance" min={0} defaultValue={liability.currentBalance} required />
                  </label>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </form>
              ) : null}
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

function toOptionalPositiveNumber(value: FormDataEntryValue | null) {
  const numberValue = toNumber(value);
  return numberValue > 0 ? numberValue : undefined;
}
