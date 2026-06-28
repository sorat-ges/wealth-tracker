import { describe, expect, it } from "vitest";
import { createUpdatedLiability } from "./liabilities";
import type { Liability } from "./types";

const timestamp = "2026-06-05T00:00:00.000Z";

describe("liability helpers", () => {
  it("creates an updated liability without changing its id or created timestamp", () => {
    const liability: Liability = {
      id: "car-loan",
      name: "Car Loan",
      type: "carLoan",
      currentBalance: 500000,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    expect(
      createUpdatedLiability(
        liability,
        {
          name: "Refinanced Car Loan",
          type: "carLoan",
          currentBalance: 480000
        },
        "2026-06-06T00:00:00.000Z",
      ),
    ).toEqual({
      ...liability,
      name: "Refinanced Car Loan",
      currentBalance: 480000,
      updatedAt: "2026-06-06T00:00:00.000Z"
    });
  });
});
