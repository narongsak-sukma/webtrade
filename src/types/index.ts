export interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
}

export interface PriceData {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface ScreenedStockData {
  symbol: string;
  date: Date;
  price: number;
  ma50: number;
  ma150: number;
  ma200: number;

  // Original Minervini Criteria 1-8
  priceAboveMa150: boolean;
  ma150AboveMa200: boolean;
  ma200TrendingUp: boolean;
  ma50AboveMa150: boolean;
  priceAboveMa50: boolean;
  priceAbove52WeekLow: boolean;
  priceNear52WeekHigh: boolean;
  relativeStrengthPositive: boolean;

  // Explainable Filters 9-14
  rsi?: number;
  rsiInRange?: boolean;
  volume?: number;
  volumeAvg50?: number;
  volumeAboveAvg?: boolean;
  macd?: number;
  macdSignal?: number;
  macdBullish?: boolean;
  adx?: number;
  adxStrong?: boolean;
  ma20?: number;
  priceAboveMa20?: boolean;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  priceInBBRange?: boolean;

  // Additional metadata
  week52Low?: number;
  week52High?: number;
  relativeStrength?: number;
  passedCriteria: number;
  totalCriteria?: number;
}

export interface SignalData {
  symbol: string;
  date: Date;
  signal: number; // 1 = buy, 0 = hold, -1 = sell
  confidence: number;
  ma20Ma50: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  obv: number;
  ichimokuTenkan?: number;
  ichimokuKijun?: number;
  ichimokuSenkouA?: number;
  ichimokuSenkouB?: number;
}

export interface JobType {
  DATA_FEED: 'data_feed';
  SCREENING: 'screening';
  ML_SIGNALS: 'ml_signals';
}

export const JOB_TYPES: JobType = {
  DATA_FEED: 'data_feed',
  SCREENING: 'screening',
  ML_SIGNALS: 'ml_signals',
};

export interface JobStatus {
  IDLE: 'idle';
  RUNNING: 'running';
  STOPPED: 'stopped';
  ERROR: 'error';
}

export const JOB_STATUS: JobStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  STOPPED: 'stopped',
  ERROR: 'error',
};
