/**
 * Monitoring System - Public API
 */

export { healthCheck } from './health';
export { metricsCollector } from './metrics';
export { alertManager } from './alerts';
export type { HealthCheckResponse, ServiceStatus } from './types';

// Create singleton instances
export const monitoringSystem = {
  async getHealthCheck() {
    return healthCheck.check();
  },

  async collectMetrics() {
    return metricsCollector.collect();
  },

  async checkHealth(service: string) {
    return healthCheck.checkService(service);
  },

  logEvent(event: {
    type: 'info' | 'warning' | 'error' | 'critical';
    source: string;
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }) {
    alertManager.createAlert(event);
  },
};
