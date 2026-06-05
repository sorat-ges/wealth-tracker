import { BarChart3, Home, LineChart, Settings, WalletCards } from "lucide-react";

export const tabs = [
  { id: "dashboard", label: "ภาพรวม", icon: Home },
  { id: "assets", label: "สินทรัพย์", icon: WalletCards },
  { id: "update", label: "อัปเดต", icon: LineChart },
  { id: "reports", label: "รายงาน", icon: BarChart3 },
  { id: "settings", label: "ตั้งค่า", icon: Settings }
] as const;

export type TabId = (typeof tabs)[number]["id"];
