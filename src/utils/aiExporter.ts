import type { Asset, Liability, Settings, Snapshot } from "../domain/types";
import { getAssetValue, getAssetCostBasis, getAssetAnnualReturn, getAssetAnnualReturnRate } from "../domain/assets";
import { formatCurrency, formatPercent, todayId } from "./format";
import { calculateSnapshotSummary } from "../domain/calculations";

export function generateWealthMarkdown(
  settings: Settings,
  assets: Asset[],
  liabilities: Liability[],
  snapshots: Snapshot[]
): string {
  const summary = calculateSnapshotSummary(assets, liabilities);
  const currency = settings.mainCurrency;
  
  // Calculate Debt-to-Asset ratio
  const debtToAsset = summary.totalInvestableAssets > 0 
    ? (summary.totalLiabilities / summary.totalInvestableAssets) * 100 
    : 0;

  // Thai labels mapping
  const assetTypeLabels: Record<string, string> = {
    cash: "เงินสด / เงินฝาก (Cash)",
    stock: "หุ้น (Stock)",
    fund: "กองทุน / ETF (Fund)",
    crypto: "คริปโต (Crypto)",
    gold: "ทอง (Gold)",
    other: "สินทรัพย์ลงทุนอื่น (Other)"
  };

  const liabilityTypeLabels: Record<string, string> = {
    carLoan: "หนี้รถยนต์ (Car Loan)",
    homeLoan: "หนี้บ้าน / คอนโด (Home Loan)",
    personalLoan: "สินเชื่อส่วนบุคคล (Personal Loan)",
    creditCard: "บัตรเครดิต (Credit Card)",
    otherDebt: "หนี้อื่น (Other Debt)"
  };

  const dateStr = todayId();
  
  let md = `# ข้อมูลทางการเงินเพื่อการวิเคราะห์ (Wealth Tracker Summary)\n`;
  md += `อัปเดต ณ วันที่: ${dateStr}\n\n`;
  
  md += `## 1. สรุปภาพรวมพอร์ต (Overview)\n`;
  md += `- ความมั่งคั่งสุทธิ (Net Investable Wealth): ${formatCurrency(summary.investableWealth, currency)}\n`;
  md += `- สินทรัพย์ลงทุนทั้งหมด (Total Assets): ${formatCurrency(summary.totalInvestableAssets, currency)}\n`;
  md += `- หนี้สินทั้งหมด (Total Liabilities): ${formatCurrency(summary.totalLiabilities, currency)}\n`;
  md += `- อัตราส่วนหนี้สินต่อสินทรัพย์ (Debt-to-Asset Ratio): ${debtToAsset.toFixed(2)}%\n\n`;

  md += `## 2. รายละเอียดสินทรัพย์ (Assets Breakdown)\n`;
  const activeAssets = assets.filter((a) => a.active);
  if (activeAssets.length === 0) {
    md += `(ไม่มีข้อมูลสินทรัพย์)\n\n`;
  } else {
    // Group active assets by type
    const types: (keyof typeof assetTypeLabels)[] = ["cash", "stock", "fund", "crypto", "gold", "other"];
    types.forEach((type) => {
      const typeAssets = activeAssets.filter((a) => a.type === type);
      if (typeAssets.length > 0) {
        md += `### ${assetTypeLabels[type]}\n`;
        typeAssets.forEach((asset) => {
          const val = getAssetValue(asset);
          md += `- **${asset.name}**: มูลค่าปัจจุบัน ${formatCurrency(val, currency)}`;
          
          if (type === "cash") {
            const returnRate = getAssetAnnualReturnRate(asset);
            if (returnRate !== undefined && returnRate > 0) {
              const annualReturn = getAssetAnnualReturn(asset);
              md += ` | ผลตอบแทนรายปี: ${returnRate}% (${formatCurrency(annualReturn, currency)})`;
            }
          } else if (["stock", "fund", "crypto", "gold"].includes(type)) {
            const cost = getAssetCostBasis(asset);
            if (cost !== undefined && cost > 0) {
              const pl = val - cost;
              const plPercent = (pl / cost) * 100;
              md += ` | เงินลงทุนรวม: ${formatCurrency(cost, currency)} | กำไร/ขาดทุน: ${formatPercent(plPercent)}`;
            }
          }
          md += `\n`;
        });
        md += `\n`;
      }
    });
  }

  md += `## 3. รายละเอียดหนี้สิน (Liabilities Breakdown)\n`;
  const activeLiabilities = liabilities.filter((l) => l.active);
  if (activeLiabilities.length === 0) {
    md += `(ไม่มีข้อมูลหนี้สิน)\n\n`;
  } else {
    const types: (keyof typeof liabilityTypeLabels)[] = ["carLoan", "homeLoan", "personalLoan", "creditCard", "otherDebt"];
    types.forEach((type) => {
      const typeLiabilities = activeLiabilities.filter((l) => l.type === type);
      if (typeLiabilities.length > 0) {
        md += `### ${liabilityTypeLabels[type]}\n`;
        typeLiabilities.forEach((liability) => {
          md += `- **${liability.name}**: ยอดคงเหลือ ${formatCurrency(liability.currentBalance, currency)}\n`;
        });
        md += `\n`;
      }
    });
  }

  md += `## 4. ประวัติความมั่งคั่งย้อนหลัง (Recent Snapshots)\n`;
  if (snapshots.length === 0) {
    md += `(ไม่มีข้อมูลประวัติความมั่งคั่ง)\n`;
  } else {
    // Show up to last 10 snapshots ordered by date descending (newest first)
    const recentSnapshots = [...snapshots].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    recentSnapshots.forEach((snap) => {
      md += `- วันที่ ${snap.date}: ความมั่งคั่งสุทธิ ${formatCurrency(snap.investableWealth, currency)}\n`;
    });
  }

  return md;
}
