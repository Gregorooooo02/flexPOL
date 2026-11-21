import type { AssetClass, RiskLevel } from './instrument';

// Mirrors DuelScenarioResponse. No match state, simulation parameters or market seeds.
export interface DuelScenario {
  schemaVersion: number;
  templateId: string;
  templateVersion: number;
  title: string;
  background: string;
  objective: string;
  currency: 'EUR';
  budget: number;
  durationDays: number;
  category: 'STOCK' | 'EQUITY_ETF';
  categoryLabel: string;
  instruments: DuelAllowedInstrument[];
  rules: string[];
  disclaimer: string;
}

export interface DuelAllowedInstrument {
  id: number;
  name: string;
  description: string | null;
  assetClass: AssetClass;
  currency: string;
  riskLevel: RiskLevel;
}
