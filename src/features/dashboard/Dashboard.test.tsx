import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";
import type { Asset, Settings } from "../../domain/types";

vi.mock("recharts", () => ({
  Cell: () => null,
  Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null
}));

const timestamp = "2026-06-05T00:00:00.000Z";
const settings: Settings = { mainCurrency: "THB" };

describe("Dashboard", () => {
  it("shows total expected annual return for deposit cash assets", () => {
    const assets: Asset[] = [
      {
        id: "deposit",
        name: "Deposit",
        type: "cash",
        currentValue: 100000,
        annualReturnRate: 1.5,
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];

    render(<Dashboard assets={assets} liabilities={[]} snapshots={[]} settings={settings} onUpdate={vi.fn()} />);

    expect(screen.getByText("ผลตอบแทนเงินฝากรายปี")).toBeTruthy();
    expect(screen.getByText("฿1,500")).toBeTruthy();
  });
});
