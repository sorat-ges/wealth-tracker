export type AllocationRow = {
  name: string;
  value: number;
};

export function sortAllocationByValue(rows: AllocationRow[]) {
  return [...rows].sort((left, right) => right.value - left.value);
}
