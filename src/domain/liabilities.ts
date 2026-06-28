import type { Liability, LiabilityType } from "./types";

export function createUpdatedLiability(
  liability: Liability,
  values: {
    name: string;
    type: LiabilityType;
    currentBalance: number;
  },
  now: string,
): Liability {
  return {
    ...liability,
    name: values.name,
    type: values.type,
    currentBalance: values.currentBalance,
    updatedAt: now
  };
}
