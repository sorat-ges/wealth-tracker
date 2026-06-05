import { describe, expect, it } from "vitest";
import { getAssetPath, getLiabilityPath, getSettingsPath, getSnapshotPath, getUserPath } from "./wealthRepository";

describe("wealthRepository paths", () => {
  it("scopes all data below users/{uid}", () => {
    expect(getUserPath("uid-1")).toBe("users/uid-1");
    expect(getSettingsPath("uid-1")).toBe("users/uid-1/settings/main");
    expect(getAssetPath("uid-1", "asset-1")).toBe("users/uid-1/assets/asset-1");
    expect(getLiabilityPath("uid-1", "car-loan")).toBe("users/uid-1/liabilities/car-loan");
    expect(getSnapshotPath("uid-1", "2026-06-05")).toBe("users/uid-1/snapshots/2026-06-05");
  });
});
