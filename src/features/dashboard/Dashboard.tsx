import { Wallet, CreditCard, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { sortAllocationByValue } from "../../domain/allocation";
import { getTotalDepositAnnualReturn } from "../../domain/assets";
import { calculateSnapshotSummary } from "../../domain/calculations";
import type { Asset, Liability, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, formatDateLabel, formatPercent, formatRatioPercent, todayId } from "../../utils/format";

type DashboardProps = {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  settings: Settings;
  onUpdate: () => void;
};

const allocationColors = [
  "#17633a", // Emerald Green
  "#3867a6", // Muted Blue
  "#7f6a2f", // Antique Gold
  "#8b3f62", // Plum/Rose
  "#288280", // Dark Teal
  "#a05b2b", // Copper/Rust
  "#524b87", // Soft Indigo
  "#58635d", // Slate Gray
  "#964545", // Crimson/Terracotta
  "#3c7042", // Forest Green
  "#6b703c", // Olive Green
  "#634a36"  // Dark Bronze
];

export function Dashboard({ assets, liabilities, snapshots, settings, onUpdate }: DashboardProps) {
  const summary = calculateSnapshotSummary(assets, liabilities);
  const totalDepositAnnualReturn = getTotalDepositAnnualReturn(assets);
  const latest = snapshots.length >= 1 ? snapshots[snapshots.length - 1] : undefined;
  const today = todayId();
  const latestNonToday = [...snapshots].reverse().find((s) => s.date !== today);
  const comparisonBase = latestNonToday ? latestNonToday.investableWealth : (latest?.investableWealth ?? 0);
  const change = summary.investableWealth - comparisonBase;

  const allocation = sortAllocationByValue(
    assets
      .filter((asset) => asset.active)
      .map((asset) => calculateSnapshotSummary([asset]).items[0])
      .filter((item) => item.value > 0)
      .map((item) => ({
        name: assets.find((asset) => asset.id === item.assetId)?.name ?? "สินทรัพย์",
        value: item.value
      })),
  );
  const allocationTotal = allocation.reduce((total, item) => total + item.value, 0);

  return (
    <section className="screen-stack">
      <div className="summary-hero">
        <div>
          <p className="screen-kicker">Investable wealth</p>
          <h1>{formatCurrency(summary.investableWealth, settings.mainCurrency)}</h1>
        </div>
        <div className={change >= 0 ? "metric-change gain" : "metric-change loss"}>
          <span>{change >= 0 ? "เพิ่มขึ้น" : "ลดลง"}</span>
          <strong>
            {change >= 0 ? "+" : ""}
            {formatCurrency(change, settings.mainCurrency)}
          </strong>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-header">
            <span>สินทรัพย์ลงทุน</span>
            <Wallet size={16} className="metric-icon" />
          </div>
          <strong>{formatCurrency(summary.totalInvestableAssets, settings.mainCurrency)}</strong>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <span>หนี้สิน</span>
            <CreditCard size={16} className="metric-icon" />
          </div>
          <strong>{formatCurrency(summary.totalLiabilities, settings.mainCurrency)}</strong>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <span>กำไร/ขาดทุนยังไม่รับรู้</span>
            {summary.totalUnrealizedPL >= 0 ? (
              <TrendingUp size={16} className="metric-icon gain" />
            ) : (
              <TrendingDown size={16} className="metric-icon loss" />
            )}
          </div>
          <div className="metric-pl-value">
            <strong className={summary.totalUnrealizedPL >= 0 ? "gain" : "loss"}>
              {formatCurrency(summary.totalUnrealizedPL, settings.mainCurrency)}
            </strong>
            <small className={summary.totalUnrealizedPL >= 0 ? "gain" : "loss"}>
              {formatPercent(summary.totalUnrealizedPLPercent)}
            </small>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <span>ผลตอบแทนเงินฝากรายปี</span>
            <PiggyBank size={16} className="metric-icon" />
          </div>
          <strong>{formatCurrency(totalDepositAnnualReturn, settings.mainCurrency)}</strong>
        </article>
      </div>

      <button className="primary-button full-width" type="button" onClick={onUpdate}>
        อัปเดตวันนี้
      </button>

      <article className="panel">
        <div className="section-heading">
          <h2>สัดส่วนสินทรัพย์</h2>
          <span>{allocation.length} รายการ</span>
        </div>
        {allocation.length ? (
          <div className="allocation-bar-layout">
            <div className="allocation-bar-container" aria-hidden="true">
              {allocation.map((item, index) => {
                const percent = allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;
                if (percent <= 0) return null;
                return (
                  <div
                    key={item.name}
                    className="allocation-bar-segment"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: allocationColors[index % allocationColors.length]
                    }}
                    title={`${item.name}: ${formatRatioPercent(item.value / allocationTotal)}`}
                  />
                );
              })}
            </div>
            <div className="allocation-list-grid">
              {allocation.map((item, index) => {
                const percent = allocationTotal ? item.value / allocationTotal : 0;
                return (
                  <div className="allocation-row" key={item.name}>
                    <span
                      className="allocation-dot"
                      style={{ background: allocationColors[index % allocationColors.length] }}
                    />
                    <span>{item.name}</span>
                    <strong>{formatRatioPercent(percent)}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="empty-text">เพิ่มสินทรัพย์เพื่อดูสัดส่วนพอร์ต</p>
        )}
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>สแนปช็อตล่าสุด</h2>
          <span>{snapshots.length}</span>
        </div>
        <div className="list-stack">
          {snapshots.slice(-4).reverse().map((snapshot) => (
            <div className="list-row" key={snapshot.id}>
              <span>{formatDateLabel(snapshot.date)}</span>
              <strong>{formatCurrency(snapshot.investableWealth, settings.mainCurrency)}</strong>
            </div>
          ))}
          {!snapshots.length ? <p className="empty-text">ยังไม่มีสแนปช็อต บันทึกอัปเดตวันนี้เพื่อเริ่มติดตาม</p> : null}
        </div>
      </article>
    </section>
  );
}
