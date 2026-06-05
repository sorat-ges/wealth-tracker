import type { User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  deleteAsset,
  deleteLiability,
  loadSettings,
  saveAsset,
  saveLiability,
  saveSettings,
  saveSnapshot,
  subscribeAssets,
  subscribeLiabilities,
  subscribeSnapshots
} from "../data/wealthRepository";
import type { Asset, Liability, Settings, Snapshot } from "../domain/types";
import { AssetsScreen } from "../features/assets/AssetsScreen";
import { AuthGate } from "../features/auth/AuthGate";
import { Dashboard } from "../features/dashboard/Dashboard";
import { ReportsScreen } from "../features/reports/ReportsScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { UpdateScreen } from "../features/update/UpdateScreen";
import { tabs, type TabId } from "./navigation";

export function App() {
  return <AuthGate>{(user) => <SignedInApp user={user} />}</AuthGate>;
}

function SignedInApp({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [settings, setSettings] = useState<Settings>({ mainCurrency: "THB" });
  const uid = user.uid;
  const displayName = user.displayName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "ผู้ใช้";

  useEffect(() => {
    let cancelled = false;
    loadSettings(uid).then((nextSettings) => {
      if (!cancelled) {
        setSettings(nextSettings);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    const unsubscribeAssets = subscribeAssets(uid, setAssets);
    const unsubscribeLiabilities = subscribeLiabilities(uid, setLiabilities);
    const unsubscribeSnapshots = subscribeSnapshots(uid, setSnapshots);
    return () => {
      unsubscribeAssets();
      unsubscribeLiabilities();
      unsubscribeSnapshots();
    };
  }, [uid]);

  const actions = useMemo(
    () => ({
      onSaveAsset: (asset: Asset) => saveAsset(uid, asset),
      onDeleteAsset: (assetId: string) => deleteAsset(uid, assetId),
      onSaveLiability: (liability: Liability) => saveLiability(uid, liability),
      onDeleteLiability: (liabilityId: string) => deleteLiability(uid, liabilityId),
      onSaveSnapshot: (snapshot: Snapshot) => saveSnapshot(uid, snapshot),
      onSaveSettings: async (nextSettings: Settings) => {
        await saveSettings(uid, nextSettings);
        setSettings(nextSettings);
      }
    }),
    [uid],
  );

  return (
    <main className="app-shell app-with-tabs">
      <header className="top-bar">
        <div>
          <p className="screen-kicker">Wealth Tracker</p>
          <strong>สวัสดี, {displayName}</strong>
        </div>
      </header>

      {activeTab === "dashboard" ? (
        <Dashboard
          assets={assets}
          liabilities={liabilities}
          snapshots={snapshots}
          settings={settings}
          onUpdate={() => setActiveTab("update")}
        />
      ) : null}
      {activeTab === "assets" ? (
        <AssetsScreen assets={assets} liabilities={liabilities} settings={settings} {...actions} />
      ) : null}
      {activeTab === "update" ? (
        <UpdateScreen assets={assets} liabilities={liabilities} settings={settings} {...actions} />
      ) : null}
      {activeTab === "reports" ? <ReportsScreen assets={assets} snapshots={snapshots} settings={settings} /> : null}
      {activeTab === "settings" ? (
        <SettingsScreen assets={assets} liabilities={liabilities} snapshots={snapshots} settings={settings} {...actions} />
      ) : null}

      <nav className="bottom-tabs" aria-label="เมนูหลัก">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={selected ? "tab-button is-selected" : "tab-button"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
