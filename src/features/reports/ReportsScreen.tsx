import { Pencil, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MoneyInput } from "../../components/MoneyInput";
import { updateSnapshotTotals } from "../../domain/snapshots";
import type { Asset, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, formatDateLabel, toNumber } from "../../utils/format";

type ReportsScreenProps = {
  assets: Asset[];
  snapshots: Snapshot[];
  settings: Settings;
  onSaveSnapshot: (snapshot: Snapshot) => Promise<void>;
  onDeleteSnapshot: (snapshotId: string) => Promise<void>;
};

export function ReportsScreen({ assets, snapshots, settings, onSaveSnapshot, onDeleteSnapshot }: ReportsScreenProps) {
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const trend = snapshots.map((snapshot) => ({
    date: formatDateLabel(snapshot.date),
    value: snapshot.investableWealth
  }));
  const latestSnapshot = snapshots.length >= 1 ? snapshots[snapshots.length - 1] : undefined;
  const plRows = assets
    .map((asset) => {
      const latestItem = latestSnapshot?.items.find((item) => item.assetId === asset.id);
      return {
        name: asset.name,
        value: latestItem?.unrealizedPL ?? 0
      };
    })
    .filter((item) => item.value !== 0)
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
  const maxPLValue = Math.max(...plRows.map((row) => Math.abs(row.value)), 0);
  const editingSnapshot = snapshots.find((snapshot) => snapshot.id === editingSnapshotId);

  async function handleSnapshotEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSnapshot) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const nextSnapshot = updateSnapshotTotals(
      editingSnapshot,
      {
        date: String(form.get("date") ?? editingSnapshot.date),
        totalInvestableAssets: toNumber(form.get("totalInvestableAssets")),
        totalLiabilities: toNumber(form.get("totalLiabilities")),
        totalUnrealizedPL: toNumber(form.get("totalUnrealizedPL"))
      },
      new Date().toISOString(),
    );

    try {
      await onSaveSnapshot(nextSnapshot);
      setEditingSnapshotId(null);
      setMessage("แก้ไขสแนปช็อตแล้ว");
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSnapshot(snapshot: Snapshot) {
    const confirmed = window.confirm(`ลบสแนปช็อตวันที่ ${formatDateLabel(snapshot.date)} ใช่ไหม?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await onDeleteSnapshot(snapshot.id);
      if (editingSnapshotId === snapshot.id) {
        setEditingSnapshotId(null);
      }
      setMessage("ลบสแนปช็อตแล้ว");
    } catch (deleteError) {
      setError(getSaveErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">รายงาน</p>
        <h1>แนวโน้มและกำไร/ขาดทุน</h1>
        <p>รายงานคำนวณจากข้อมูลที่คุณบันทึกเองเท่านั้น</p>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <article className="panel">
        <div className="section-heading">
          <h2>แนวโน้มความมั่งคั่งลงทุน</h2>
          <span>{snapshots.length} สแนปช็อต</span>
        </div>
        {trend.length ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="wealthGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#17633a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#17633a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#dde3dc" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), settings.mainCurrency)} />
                <Area type="monotone" dataKey="value" stroke="#17633a" fill="url(#wealthGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty-text">บันทึกสแนปช็อตเพื่อดูแนวโน้ม</p>
        )}
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>กำไร/ขาดทุนที่ยังไม่รับรู้</h2>
          <span>{plRows.length} รายการ</span>
        </div>
        {plRows.length ? (
          <div className="pl-list">
            {plRows.map((row) => {
              const width = maxPLValue ? Math.max(8, (Math.abs(row.value) / maxPLValue) * 100) : 0;
              const isGain = row.value >= 0;
              return (
                <div className="pl-row" key={row.name}>
                  <div className="pl-row-header">
                    <strong>{row.name}</strong>
                    <span className={isGain ? "gain" : "loss"}>{formatCurrency(row.value, settings.mainCurrency)}</span>
                  </div>
                  <div className="pl-track" aria-hidden="true">
                    <span
                      className={isGain ? "pl-fill gain-fill" : "pl-fill loss-fill"}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-text">สินทรัพย์ตลาดที่มีต้นทุนจะแสดงกำไร/ขาดทุนที่ยังไม่รับรู้ที่นี่</p>
        )}
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>สแนปช็อตย้อนหลัง</h2>
          <span>{snapshots.length}</span>
        </div>
        <div className="list-stack">
          {snapshots
            .slice()
            .reverse()
            .map((snapshot) => (
              <div className="list-row" key={snapshot.id}>
                <div>
                  <strong>{formatDateLabel(snapshot.date)}</strong>
                  <span>
                    สินทรัพย์ {formatCurrency(snapshot.totalInvestableAssets, settings.mainCurrency)} · หนี้{" "}
                    {formatCurrency(snapshot.totalLiabilities, settings.mainCurrency)}
                  </span>
                </div>
                <div className="row-actions">
                  <span>{formatCurrency(snapshot.investableWealth, settings.mainCurrency)}</span>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setEditingSnapshotId(snapshot.id)}
                    aria-label={`แก้ไขสแนปช็อต ${formatDateLabel(snapshot.date)}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger-button"
                    type="button"
                    onClick={() => handleDeleteSnapshot(snapshot)}
                    aria-label={`ลบสแนปช็อต ${formatDateLabel(snapshot.date)}`}
                    disabled={saving}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          {!snapshots.length ? <p className="empty-text">ยังไม่มีสแนปช็อตให้แก้ไข</p> : null}
        </div>
      </article>

      {editingSnapshot ? (
        <article className="panel">
          <div className="section-heading">
            <h2>แก้ไขสแนปช็อต</h2>
            <button className="icon-button" type="button" onClick={() => setEditingSnapshotId(null)} aria-label="ปิดฟอร์มแก้ไข">
              <X size={16} />
            </button>
          </div>
          <form className="form-grid" onSubmit={handleSnapshotEdit}>
            <label>
              วันที่
              <input name="date" type="date" defaultValue={editingSnapshot.date} required />
            </label>
            <label>
              สินทรัพย์ลงทุนรวม
              <MoneyInput
                name="totalInvestableAssets"
                min={0}
                defaultValue={editingSnapshot.totalInvestableAssets}
                required
              />
            </label>
            <label>
              หนี้สินรวม
              <MoneyInput
                name="totalLiabilities"
                min={0}
                defaultValue={editingSnapshot.totalLiabilities}
                required
              />
            </label>
            <label>
              กำไร/ขาดทุนยังไม่รับรู้
              <MoneyInput
                name="totalUnrealizedPL"
                defaultValue={editingSnapshot.totalUnrealizedPL}
                required
              />
              <small>การแก้ตรงนี้ไม่เปลี่ยนสินทรัพย์หรือหนี้สินปัจจุบัน</small>
            </label>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}

function getSaveErrorMessage(error: unknown) {
  return error instanceof Error ? `บันทึกไม่สำเร็จ: ${error.message}` : "บันทึกไม่สำเร็จ กรุณาลองใหม่";
}
