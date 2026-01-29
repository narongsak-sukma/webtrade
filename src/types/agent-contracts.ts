/**
 * AGENT CONTRACTS - Control Mode Interfaces
 *
 * These contracts define how each agent integrates with the system.
 * All agents MUST follow these interfaces to ensure seamless integration.
 */

// ============================================================================
// AGENT 1: Frontend Specialist (Charts)
// ============================================================================

/**
 * Chart component contract
 * Agent will create components in: src/components/charts/
 */
export interface StockChartProps {
  /** Stock symbol to display */
  symbol: string;
  /** Historical price data */
  data: PriceDataPoint[];
  /** Technical indicators to display */
  indicators?: IndicatorConfig[];
  /** Chart timeframe */
  timeframe?: Timeframe;
  /** Callback when timeframe changes */
  onTimeframeChange?: (timeframe: Timeframe) => void;
  /** Height of chart in pixels */
  height?: number;
  /** Whether chart is interactive */
  interactive?: boolean;
}

export interface PriceDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface IndicatorConfig {
  type: 'MA' | 'RSI' | 'MACD' | 'BB' | 'OBV' | 'Ichimoku';
  period?: number;
  params?: Record<string, number>;
  color?: string;
  visible?: boolean;
}

/**
 * Deliverables for Agent 1:
 * - StockChart.tsx (main price chart)
 * - IndicatorChart.tsx (RSI, MACD)
 * - VolumeChart.tsx (volume bars)
 * - ChartControls.tsx (timeframe, indicator toggles)
 */

// ============================================================================
// AGENT 2: Backend Specialist (Authentication)
// ============================================================================

/**
 * Authentication API contract
 * Agent will create routes in: src/app/api/auth/
 */
export interface AuthAPI {
  /** POST /api/auth/register */
  register: (data: RegisterRequest) => Promise<AuthResponse>;

  /** POST /api/auth/login */
  login: (credentials: LoginRequest) => Promise<AuthResponse>;

  /** GET /api/auth/session */
  getSession: () => Promise<SessionResponse>;

  /** POST /api/auth/logout */
  logout: () => Promise<{ success: boolean }>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
  token?: string;
  error?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

/**
 * Middleware contract for protected routes
 */
export interface AuthMiddleware {
  /** Verify JWT token */
  verifyToken: (token: string) => Promise<{ valid: boolean; payload?: any }>;

  /** Check if user has required role */
  hasRole: (user: any, role: string) => boolean;

  /** Protect API route */
  protect: (handler: Function) => Function;
}

/**
 * Deliverables for Agent 2:
 * - src/app/api/auth/register/route.ts
 * - src/app/api/auth/login/route.ts
 * - src/app/api/auth/session/route.ts
 * - src/app/api/auth/logout/route.ts
 * - src/middleware/auth.ts
 * - src/lib/auth.ts (auth utilities)
 */

// ============================================================================
// AGENT 3: ML Engineer (Enhanced Model)
// ============================================================================

/**
 * ML Model contract
 * Agent will create files in: src/models/
 */
export interface MLModel {
  /** Train model on historical data */
  train: (data: TrainingData[]) => Promise<TrainingResult>;

  /** Generate prediction for a stock */
  predict: (symbol: string, features: FeatureValues) => Promise<ModelPrediction>;

  /** Evaluate model performance */
  evaluate: (testData: TestData[]) => Promise<EvaluationMetrics>;

  /** Save/load model */
  save: (path: string) => Promise<void>;
  load: (path: string) => Promise<void>;
}

export interface TrainingData {
  symbol: string;
  date: Date;
  features: FeatureValues;
  target: number; // -1, 0, 1 (sell, hold, buy)
  futureReturn?: number; // For calculating actual performance
}

export interface TestData {
  symbol: string;
  date: Date;
  features: FeatureValues;
  target: number;
  futureReturn?: number;
}

export interface FeatureValues {
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

export interface ModelPrediction {
  symbol: string;
  date: Date;
  signal: 'buy' | 'hold' | 'sell';
  confidence: number; // 0-1
  probabilities: {
    buy: number;
    hold: number;
    sell: number;
  };
  features: FeatureValues;
}

export interface TrainingResult {
  success: boolean;
  accuracy: number;
  featureImportance?: Record<string, number>;
  modelPath?: string;
  error?: string;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  roi?: number; // Return if followed all signals
}

/**
 * Deliverables for Agent 3:
 * - src/models/StockClassifier.ts (main model)
 * - src/models/training.ts (training pipeline)
 * - src/models/prediction.ts (prediction interface)
 * - src/models/evaluation.ts (evaluation metrics)
 * - scripts/train-model.ts (training script)
 */

// ============================================================================
// AGENT 4: DevOps Engineer (Monitoring)
// ============================================================================

/**
 * Monitoring system contract
 * Agent will create files in: src/lib/monitoring/
 */
export interface MonitoringSystem {
  /** Health check endpoint */
  healthCheck: () => Promise<HealthCheckResponse>;

  /** Collect application metrics */
  collectMetrics: () => Promise<AppMetrics>;

  /** Setup alerting */
  setupAlerts: (config: AlertConfig) => Promise<void>;

  /** Log system events */
  logEvent: (event: SystemEvent) => void;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  uptime: number; // seconds
  services: ServiceStatus[];
  version: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  lastCheck: Date;
  responseTime?: number; // ms
  error?: string;
}

export interface AppMetrics {
  timestamp: Date;
  server: ServerMetrics;
  database: DatabaseMetrics;
  jobs: JobMetrics;
  api: APIMetrics;
}

export interface ServerMetrics {
  cpuUsage: number; // 0-1
  memoryUsage: number; // 0-1
  diskUsage: number; // 0-1
  uptime: number;
}

export interface DatabaseMetrics {
  connectionCount: number;
  queryLatency: number; // ms
  slowQueries: number;
  databaseSize: number; // bytes
}

export interface JobMetrics {
  totalJobs: number;
  runningJobs: number;
  failedJobs: number;
  avgExecutionTime: number; // ms
  lastRun: Date;
}

export interface APIMetrics {
  requestsPerSecond: number;
  avgLatency: number; // ms
  errorRate: number; // 0-1
  activeConnections: number;
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
}

export interface AlertRule {
  name: string;
  condition: string; // e.g., "errorRate > 0.05"
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface SystemEvent {
  type: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Deliverables for Agent 4:
 * - src/lib/monitoring/health.ts
 * - src/lib/monitoring/metrics.ts
 * - src/lib/monitoring/alerts.ts
 * - src/app/api/health/route.ts
 * - src/app/admin/monitoring/page.tsx (dashboard)
 */

// ============================================================================
// SHARED UTILITIES (Used by all agents)
// ============================================================================

/**
 * Common error structure
 */
export interface AgentError {
  agent: string;
  task: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Agent deliverable structure
 */
export interface AgentDeliverable {
  agent: string;
  files: string[];
  tests: string[];
  documentation: string[];
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
}

/**
 * Integration checklist for Ralph Loop
 */
export interface IntegrationChecklist {
  agent: string;
  interfaceCompliance: boolean;
  typeScriptErrors: number;
  testsPassing: boolean;
  integrationTested: boolean;
  documentationComplete: boolean;
  approved: boolean;
}
