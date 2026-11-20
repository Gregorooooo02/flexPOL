import type { AssetClass, RiskLevel } from '@/model';

export type LoadState<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

export const ASSET_LABELS: Record<AssetClass, string> = {
  STOCK: 'Stocks',
  EQUITY_ETF: 'ETFs',
  DEPOSIT: 'Deposits',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export interface InstrumentFilters {
  search: string;
  assetClass: AssetClass | 'ALL';
  risk: RiskLevel | 'ALL';
}
