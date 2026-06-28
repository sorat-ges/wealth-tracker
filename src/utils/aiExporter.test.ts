import { describe, expect, it, vi } from "vitest";
import { generateWealthMarkdown } from "./aiExporter";
import type { Asset, Liability, Settings, Snapshot } from "../domain/types";

// Mock todayId to return a fixed date
vi.mock("./format", async (importOriginal) => {
  const original = await importOriginal<typeof import("./format")>();
  return {
    ...original,
    todayId: () => "2026-06-28"
  };
});

describe("aiExporter", () => {
  it("formats wealth overview, assets, liabilities, and snapshots as markdown", () => {
    const settings: Settings = { mainCurrency: "THB" };
    
    const assets: Asset[] = [
      {
        id: "cash-1",
        name: "Emergency Fund",
        type: "cash",
        currentValue: 100000,
        annualReturnRate: 1.5,
        active: true,
        createdAt: "",
        updatedAt: ""
      },
      {
        id: "stock-1",
        name: "AAPL",
        type: "stock",
        costBasis: 40000,
        currentValue: 50000,
        active: true,
        createdAt: "",
        updatedAt: ""
      },
      {
        id: "inactive-asset",
        name: "Old Asset",
        type: "other",
        currentValue: 50000,
        active: false,
        createdAt: "",
        updatedAt: ""
      }
    ];

    const liabilities: Liability[] = [
      {
        id: "car-1",
        name: "Car Loan",
        type: "carLoan",
        currentBalance: 50000,
        active: true,
        createdAt: "",
        updatedAt: ""
      }
    ];

    const snapshots: Snapshot[] = [
      {
        id: "2026-06-28",
        date: "2026-06-28",
        investableWealth: 100000,
        totalInvestableAssets: 150000,
        totalLiabilities: 50000,
        totalUnrealizedPL: 10000,
        totalUnrealizedPLPercent: 20,
        items: [],
        liabilities: [],
        createdAt: "",
        updatedAt: ""
      }
    ];

    const markdown = generateWealthMarkdown(settings, assets, liabilities, snapshots);

    // Verify overview
    expect(markdown).toContain("# ข้อมูลทางการเงินเพื่อการวิเคราะห์ (Wealth Tracker Summary)");
    expect(markdown).toContain("อัปเดต ณ วันที่: 2026-06-28");
    expect(markdown).toContain("ความมั่งคั่งสุทธิ (Net Investable Wealth): ฿100,000");
    expect(markdown).toContain("สินทรัพย์ลงทุนทั้งหมด (Total Assets): ฿150,000");
    expect(markdown).toContain("หนี้สินทั้งหมด (Total Liabilities): ฿50,000");
    expect(markdown).toContain("อัตราส่วนหนี้สินต่อสินทรัพย์ (Debt-to-Asset Ratio): 33.33%");

    // Verify assets
    expect(markdown).toContain("### เงินสด / เงินฝาก (Cash)");
    expect(markdown).toContain("- **Emergency Fund**: มูลค่าปัจจุบัน ฿100,000 | ผลตอบแทนรายปี: 1.5% (฿1,500)");
    expect(markdown).toContain("### หุ้น (Stock)");
    expect(markdown).toContain("- **AAPL**: มูลค่าปัจจุบัน ฿50,000 | เงินลงทุนรวม: ฿40,000 | กำไร/ขาดทุน: +25.00%");
    expect(markdown).not.toContain("Old Asset"); // Should filter active assets only

    // Verify liabilities
    expect(markdown).toContain("### หนี้รถยนต์ (Car Loan)");
    expect(markdown).toContain("- **Car Loan**: ยอดคงเหลือ ฿50,000");

    // Verify snapshots
    expect(markdown).toContain("## 4. ประวัติความมั่งคั่งย้อนหลัง (Recent Snapshots)");
    expect(markdown).toContain("- วันที่ 2026-06-28: ความมั่งคั่งสุทธิ ฿100,000");
  });
});
