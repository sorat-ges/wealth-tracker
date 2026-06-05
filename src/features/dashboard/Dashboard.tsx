import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { calculateSnapshotSummary } from "../../domain/calculations";
import type { Asset, Liability, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, formatPercent, formatDateLabel } from "../../utils/format";

type DashboardProps = {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  settings: Settings;
  onUpdate: () => void;
};

const allocationColors = ["#17633a", "#7f6a2f", "#3867a6", "#8b3f62", "#58635d", "#a05b2b"];

export function Dashboard({ assets, liabilities, snapshots, settings, onUpdate }: DashboardProps) {
  const summary = calculateSnapshotSummary(assets, liabilities);
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : undefined;
  const latest = snapshots.length >= 1 ? snapshots[snapshots.length - 1] : undefined;
  const comparisonBase = latest?.investableWealth ?? previous?.investableWealth ?? 0;
  const change = summary.investableWealth - comparisonBase;
  const allocation = assets
    .filter((asset) => asset.active)
    .map((asset) => calculateSnapshotSummary([asset]).items[0])
    .filter((item) => item.value > 0)
    .map((item) => ({
      name: assets.find((asset) => asset.id === item.assetId)?.name ?? "สินทรัพย์",
      value: item.value
    }));

  return (
    <section className="screen-stack">
      <div className="summary-hero">
        <p className="screen-kicker">ความมั่งคั่งลงทุน</p>
        <h1>{formatCurrency(summary.investableWealth, settings.mainCurrency)}</h1>
        <div className={change >= 0 ? "metric-change gain" : "metric-change loss"}>
          {change >= 0 ? "+" : ""}
          {formatCurrency(change, settings.mainCurrency)} จากค่าที่บันทึกล่าสุด
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>สินทรัพย์ลงทุน</span>
          <strong>{formatCurrency(summary.totalInvestableAssets, settings.mainCurrency)}</strong>
        </article>
        <article className="metric-card">
          <span>หนี้สิน</span>
          <strong>{formatCurrency(summary.totalLiabilities, settings.mainCurrency)}</strong>
        </article>
        <article className="metric-card">
          <span>กำไร/ขาดทุนยังไม่รับรู้</span>
          <strong className={summary.totalUnrealizedPL >= 0 ? "gain" : "loss"}>
            {formatCurrency(summary.totalUnrealizedPL, settings.mainCurrency)}
          </strong>
          <small>{formatPercent(summary.totalUnrealizedPLPercent)}</small>
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
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
                  {allocation.map((entry, index) => (
                    <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), settings.mainCurrency)} />
              </PieChart>
            </ResponsiveContainer>
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
