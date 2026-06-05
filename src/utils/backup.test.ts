import { describe, expect, it } from "vitest";
import { parseBackup } from "./backup";

describe("backup parsing", () => {
  it("accepts valid backup payloads", () => {
    expect(
      parseBackup(
        JSON.stringify({
          version: 1,
          settings: { mainCurrency: "THB" },
          assets: [],
          liabilities: [],
          snapshots: []
        }),
      ),
    ).toEqual({
      version: 1,
      settings: { mainCurrency: "THB" },
      assets: [],
      liabilities: [],
      snapshots: []
    });
  });

  it("rejects malformed backup payloads", () => {
    expect(() => parseBackup("{")).toThrow("Backup file is not valid JSON.");
    expect(() => parseBackup(JSON.stringify({ version: 1 }))).toThrow("Backup file is missing required arrays.");
  });
});
