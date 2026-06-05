import { BarChart3, Home, LineChart, Settings, WalletCards } from "lucide-react";

export const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "assets", label: "Assets", icon: WalletCards },
  { id: "update", label: "Update", icon: LineChart },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

export type TabId = (typeof tabs)[number]["id"];
