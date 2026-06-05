import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Asset, Settings, Snapshot } from "../../domain/types";
import { formatCurrency, formatDateLabel } from "../../utils/format";

type ReportsScreenProps = {
  assets: Asset[];
  snapshots: Snapshot[];
  settings: Settings;
};

export function ReportsScreen({ assets, snapshots, settings }: ReportsScreenProps) {
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
    .filter((item) => item.value !== 0);

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">Reports</p>
        <h1>Trend & P/L</h1>
        <p>Reports use only values you manually saved.</p>
      </div>

      <article className="panel">
        <div className="section-heading">
          <h2>Investable Wealth Trend</h2>
          <span>{snapshots.length} snapshots</span>
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
          <p className="empty-text">Save snapshots to build a trend.</p>
        )}
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>Unrealized P/L</h2>
          <span>{plRows.length} assets</span>
        </div>
        {plRows.length ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={plRows}>
                <CartesianGrid vertical={false} stroke="#dde3dc" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatCurrency(Number(value), settings.mainCurrency)} />
                <Bar dataKey="value" fill="#17633a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty-text">Market assets with cost basis will show unrealized P/L here.</p>
        )}
      </article>
    </section>
  );
}
