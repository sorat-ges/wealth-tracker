import { describe, expect, it } from "vitest";
import { formatNumberInput, toNumber } from "./format";

describe("number input formatting", () => {
  it("formats blurred money inputs with commas and without unnecessary .00", () => {
    expect(formatNumberInput(27828.58)).toBe("27,828.58");
    expect(formatNumberInput(292509)).toBe("292,509");
    expect(formatNumberInput(125000.0)).toBe("125,000");
  });

  it("parses formatted money input strings back to numbers", () => {
    expect(toNumber("27,828.58")).toBe(27828.58);
    expect(toNumber("292,509")).toBe(292509);
    expect(toNumber("")).toBe(0);
  });
});
