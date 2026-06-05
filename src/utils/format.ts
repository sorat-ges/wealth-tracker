export function formatCurrency(value: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function todayId() {
  return new Date().toISOString().slice(0, 10);
}

export function formatNumberInput(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

export function toNumber(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.replace(/,/g, "") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
