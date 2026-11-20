// Mirrors backend DTOs: InstrumentResponse, SimulationConfigurationResponse, HistoricalObservationResponse.

export type AssetClass = 'STOCK' | 'EQUITY_ETF' | 'DEPOSIT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type HistoryValueType = 'PRICE' | 'TOTAL_RETURN_INDEX' | 'ACCRUED_VALUE_INDEX';

/** Model-specific assumptions as structured JSON; numeric values are JSON numbers. */
export interface SimulationConfiguration {
  modelKey: string;
  parameters: Record<string, unknown>;
}

/** A catalogue entry. All seeded instruments are quoted in EUR. */
export interface Instrument {
  id: number;
  name: string;
  description: string | null;
  assetClass: AssetClass;
  currency: string;
  riskLevel: RiskLevel;
  historyValueType: HistoryValueType;
  historySource: string;
  historyDescription: string | null;
  historyRebased: boolean;
  simulationConfiguration: SimulationConfiguration | null;
}

/**
 * One historical observation. `date` is the rebased display date and `originalDate` the source
 * date. `value` is an index level (see `historyValueType`), not a EUR amount.
 */
export interface HistoricalObservation {
  date: string;
  originalDate: string;
  value: number;
}
