import { describe, expect, it } from "vitest";
import { sortAllocationByValue } from "./allocation";

describe("allocation helpers", () => {
  it("sorts allocation rows by value from highest to lowest", () => {
    expect(
      sortAllocationByValue([
        { name: "Gold", value: 12000 },
        { name: "Cash", value: 50000 },
        { name: "Fund", value: 30000 }
      ]),
    ).toEqual([
      { name: "Cash", value: 50000 },
      { name: "Fund", value: 30000 },
      { name: "Gold", value: 12000 }
    ]);
  });
});
