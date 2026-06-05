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
        <p className="screen-kicker">รายงาน</p>
        <h1>แนวโน้มและกำไร/ขาดทุน</h1>
        <p>รายงานคำนวณจากข้อมูลที่คุณบันทึกเองเท่านั้น</p>
      </div>

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
          <p className="empty-text">สินทรัพย์ตลาดที่มีต้นทุนจะแสดงกำไร/ขาดทุนที่ยังไม่รับรู้ที่นี่</p>
        )}
      </article>
    </section>
  );
}
