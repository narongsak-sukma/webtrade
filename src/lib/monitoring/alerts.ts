import { prisma } from '@/lib/prisma';
import type {
  AlertConfig,
  AlertRule,
  SystemEvent,
} from '@/types/agent-contracts';

/**
 * Alerting System
 * Manages alert rules, evaluation, and notifications
 */
class AlertingSystem {
  private config: AlertConfig;
  private alertHistory: SystemEvent[] = [];
  private alertDeduplication: Map<string, number> = new Map(); // alertKey -> last fired timestamp
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Default configuration
    this.config = {
      enabled: process.env.MONITORING_ENABLED === 'true',
      channels: [],
      rules: this.getDefaultRules(),
    };
  }

  /**
   * Initialize alerting system
   */
  async initialize(config?: Partial<AlertConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('Alerting system is disabled');
      return;
    }

    // Load recent alerts from database
    await this.loadRecentAlerts();

    // Start periodic evaluation
    this.startEvaluation();

    console.log('Alerting system initialized');
  }

  /**
   * Get default alert rules
   */
  private getDefaultRules(): AlertRule[] {
    return [
      // Critical alerts
      {
        name: 'system_down',
        condition: 'status === "down"',
        threshold: 1,
        severity: 'critical',
      },
      {
        name: 'database_connection_lost',
        condition: 'dbStatus === "down"',
        threshold: 1,
        severity: 'critical',
      },
      {
        name: 'high_error_rate',
        condition: 'errorRate > 0.10',
        threshold: 0.10,
        severity: 'critical',
      },
      {
        name: 'high_api_latency',
        condition: 'apiLatency > 5000',
        threshold: 5000,
        severity: 'critical',
      },
      {
        name: 'disk_full',
        condition: 'diskUsage > 0.90',
        threshold: 0.90,
        severity: 'critical',
      },

      // Warning alerts
      {
        name: 'system_degraded',
        condition: 'status === "degraded"',
        threshold: 1,
        severity: 'warning',
      },
      {
        name: 'elevated_error_rate',
        condition: 'errorRate > 0.05',
        threshold: 0.05,
        severity: 'warning',
      },
      {
        name: 'high_api_latency_warning',
        condition: 'apiLatency > 1000',
        threshold: 1000,
        severity: 'warning',
      },
      {
        name: 'high_memory_usage',
        condition: 'memoryUsage > 0.80',
        threshold: 0.80,
        severity: 'warning',
      },
      {
        name: 'high_cpu_usage',
        condition: 'cpuUsage > 0.85',
        threshold: 0.85,
        severity: 'warning',
      },
      {
        name: 'disk_space_low',
        condition: 'diskUsage > 0.85',
        threshold: 0.85,
        severity: 'warning',
      },
      {
        name: 'job_failures',
        condition: 'failedJobs > 5',
        threshold: 5,
        severity: 'warning',
      },

      // Info alerts
      {
        name: 'system_started',
        condition: 'uptime < 60',
        threshold: 60,
        severity: 'info',
      },
    ];
  }

  /**
   * Load recent alerts from database
   */
  private async loadRecentAlerts(): Promise<void> {
    try {
      const recentAlerts = await prisma.alert.findMany({
        where: {
          resolved: false,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });

      this.alertHistory = recentAlerts.map((alert) => ({
        type: alert.severity as SystemEvent['type'],
        source: alert.source,
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata as Record<string, any>,
      }));
    } catch (error) {
      console.error('Failed to load recent alerts:', error);
    }
  }

  /**
   * Evaluate metrics against alert rules
   */
  async evaluate(metrics: any, healthStatus?: any): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const context = {
      ...metrics,
      status: healthStatus?.status,
      dbStatus: healthStatus?.services?.find((s: any) => s.name === 'database')?.status,
    };

    for (const rule of this.config.rules) {
      try {
        const shouldAlert = this.evaluateRule(rule, context);

        if (shouldAlert) {
          await this.fireAlert(rule, context);
        }
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private evaluateRule(rule: AlertRule, context: any): boolean {
    try {
      // Create a function from the condition
      const conditionFunc = new Function('context', `
        with(context) {
          return ${rule.condition};
        }
      `);

      return conditionFunc(context);
    } catch (error) {
      console.error(`Failed to evaluate condition: ${rule.condition}`, error);
      return false;
    }
  }

  /**
   * Fire an alert
   */
  private async fireAlert(rule: AlertRule, context: any): Promise<void> {
    const alertKey = `${rule.name}_${rule.severity}`;
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

    // Check deduplication (don't fire same alert within cooldown period)
    const lastFired = this.alertDeduplication.get(alertKey) || 0;
    if (now - lastFired < cooldownPeriod) {
      return; // Skip this alert
    }

    // Update deduplication map
    this.alertDeduplication.set(alertKey, now);

    // Create alert event
    const event: SystemEvent = {
      type: rule.severity,
      source: 'monitoring',
      message: this.formatAlertMessage(rule, context),
      timestamp: new Date(),
      metadata: {
        rule: rule.name,
        condition: rule.condition,
        threshold: rule.threshold,
        context,
      },
    };

    // Add to history
    this.alertHistory.unshift(event);

    // Keep only last 100 alerts in memory
    if (this.alertHistory.length > 100) {
      this.alertHistory.pop();
    }

    // Store in database
    try {
      await prisma.alert.create({
        data: {
          timestamp: event.timestamp,
          severity: event.type,
          source: event.source,
          message: event.message,
          metadata: event.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to store alert in database:', error);
    }

    // Send notifications
    await this.sendNotifications(event);

    console.log(`Alert fired: [${rule.severity.toUpperCase()}] ${event.message}`);
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(rule: AlertRule, context: any): string {
    const messages: Record<string, string> = {
      system_down: 'System is down',
      system_degraded: 'System is degraded',
      database_connection_lost: 'Database connection lost',
      high_error_rate: `High error rate: ${((context.errorRate || 0) * 100).toFixed(1)}%`,
      elevated_error_rate: `Elevated error rate: ${((context.errorRate || 0) * 100).toFixed(1)}%`,
      high_api_latency: `High API latency: ${context.apiLatency || 0}ms`,
      high_api_latency_warning: `Elevated API latency: ${context.apiLatency || 0}ms`,
      high_memory_usage: `High memory usage: ${((context.memoryUsage || 0) * 100).toFixed(1)}%`,
      high_cpu_usage: `High CPU usage: ${((context.cpuUsage || 0) * 100).toFixed(1)}%`,
      disk_full: `Disk almost full: ${((context.diskUsage || 0) * 100).toFixed(1)}%`,
      disk_space_low: `Disk space low: ${((context.diskUsage || 0) * 100).toFixed(1)}%`,
      job_failures: `High job failure count: ${context.failedJobs || 0} in last 24h`,
      system_started: 'System started successfully',
    };

    return messages[rule.name] || `Alert: ${rule.name} triggered`;
  }

  /**
   * Send alert notifications
   */
  private async sendNotifications(event: SystemEvent): Promise<void> {
    if (!this.config.channels || this.config.channels.length === 0) {
      return; // No channels configured
    }

    for (const channel of this.config.channels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(event, channel.config);
            break;
          case 'slack':
            await this.sendSlackNotification(event, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookNotification(event, channel.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(event: SystemEvent, config: any): Promise<void> {
    if (process.env.ALERT_EMAIL_ENABLED !== 'true') {
      return;
    }

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To: ${process.env.ALERT_EMAIL_TO} | ${event.message}`);
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(event: SystemEvent, config: any): Promise<void> {
    // In production, integrate with Slack webhook
    console.log(`[SLACK] ${event.message}`);
  }

  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(event: SystemEvent, config: any): Promise<void> {
    // In production, send HTTP POST to webhook URL
    console.log(`[WEBHOOK] ${config.url} | ${event.message}`);
  }

  /**
   * Log a system event
   */
  logEvent(event: SystemEvent): void {
    this.alertHistory.unshift(event);

    // Keep only last 100 alerts in memory
    if (this.alertHistory.length > 100) {
      this.alertHistory.pop();
    }

    // Store in database if it's an error or critical
    if (event.type === 'error' || event.type === 'critical') {
      prisma.alert.create({
        data: {
          timestamp: event.timestamp,
          severity: event.type,
          source: event.source,
          message: event.message,
          metadata: event.metadata,
        },
      }).catch((error) => {
        console.error('Failed to store event:', error);
      });
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): SystemEvent[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alerts from database
   */
  async getAlertsFromDatabase(limit: number = 20, includeResolved: boolean = false): Promise<any[]> {
    try {
      return await prisma.alert.findMany({
        where: includeResolved ? undefined : { resolved: false },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      console.error('Failed to fetch alerts from database:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * Start periodic evaluation
   */
  private startEvaluation(): void {
    if (this.evaluationInterval) {
      return;
    }

    // Evaluate every 60 seconds
    this.evaluationInterval = setInterval(() => {
      // Evaluation will be triggered by metrics collection
      console.log('Alert evaluation cycle completed');
    }, 60000);
  }

  /**
   * Stop alerting system
   */
  stop(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const alertingSystem = new AlertingSystem();
