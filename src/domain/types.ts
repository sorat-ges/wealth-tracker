export type AssetType = "cash" | "stock" | "fund" | "crypto" | "gold" | "other";
export type LiabilityType = "carLoan" | "homeLoan" | "personalLoan" | "creditCard" | "otherDebt";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  quantity?: number;
  averageCost?: number;
  costBasis?: number;
  currentPrice?: number;
  currentValue?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Liability = {
  id: string;
  name: string;
  type: LiabilityType;
  currentBalance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SnapshotItem = {
  assetId: string;
  value: number;
  costBasis?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  quantity?: number;
  price?: number;
};

export type SnapshotLiabilityItem = {
  liabilityId: string;
  balance: number;
};

export type Snapshot = {
  id: string;
  date: string;
  investableWealth: number;
  totalInvestableAssets: number;
  totalLiabilities: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  items: SnapshotItem[];
  liabilities: SnapshotLiabilityItem[];
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  mainCurrency: string;
};
