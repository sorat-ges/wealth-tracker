import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { sortAllocationByValue } from "../../domain/allocation";
import { calculateSnapshotSummary } from "../../domain/calculations";
import type { Asset, Liability, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, formatDateLabel, formatPercent, formatRatioPercent } from "../../utils/format";

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
          <small className={summary.totalUnrealizedPL >= 0 ? "gain" : "loss"}>
            {formatPercent(summary.totalUnrealizedPLPercent)}
          </small>
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
          <div className="allocation-layout">
            <div className="chart-box" aria-hidden="true">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={60}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {allocation.map((entry, index) => (
                      <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), settings.mainCurrency)}
                    contentStyle={{
                      border: "1px solid #dce5db",
                      borderRadius: 8,
                      boxShadow: "0 12px 28px rgba(23, 32, 25, 0.14)",
                      fontSize: 12,
                      fontWeight: 800
                    }}
                    wrapperStyle={{ outline: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="allocation-list">
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
