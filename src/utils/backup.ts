import type { Asset, Liability, Settings, Snapshot } from "../domain/types";

export type BackupPayload = {
  version: 1;
  settings: Settings;
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
};

export function parseBackup(raw: string): BackupPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("settings" in parsed) ||
    !("assets" in parsed) ||
    !("liabilities" in parsed) ||
    !("snapshots" in parsed) ||
    !Array.isArray((parsed as BackupPayload).assets) ||
    !Array.isArray((parsed as BackupPayload).liabilities) ||
    !Array.isArray((parsed as BackupPayload).snapshots)
  ) {
    throw new Error("Backup file is missing required arrays.");
  }

  return parsed as BackupPayload;
}

export function createBackup(settings: Settings, assets: Asset[], liabilities: Liability[], snapshots: Snapshot[]): BackupPayload {
  return {
    version: 1,
    settings,
    assets,
    liabilities,
    snapshots
  };
}
