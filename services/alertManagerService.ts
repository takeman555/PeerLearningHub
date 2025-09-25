/**
 * アラート管理サービス
 * エラー発生時の自動アラート設定と通知管理
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorReport } from './errorMonitoringService';
import { CrashReport } from './crashReportingService';

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
}

export interface AlertCondition {
  type: 'error_count' | 'error_rate' | 'crash_count' | 'severity' | 'error_type';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: string | number;
  timeWindow: number; // minutes
}

export interface AlertAction {
  type: 'console_log' | 'user_notification' | 'local_storage' | 'remote_webhook';
  config: Record<string, any>;
}

export interface AlertNotification {
  id: string;
  timestamp: Date;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
}

class AlertManagerService {
  private static instance: AlertManagerService;
  private alertRules: AlertRule[] = [];
  private notifications: AlertNotification[] = [];
  private errorHistory: ErrorReport[] = [];
  private crashHistory: CrashReport[] = [];
  private isInitialized = false;

  private constructor() {
    this.setupDefaultRules();
  }

  public static getInstance(): AlertManagerService {
    if (!AlertManagerService.instance) {
      AlertManagerService.instance = new AlertManagerService();
    }
    return AlertManagerService.instance;
  }

  /**
   * アラート管理サービスの初期化
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadAlertRules();
      await this.loadNotifications();
      await this.loadErrorHistory();
      
      this.isInitialized = true;
      console.log('Alert manager service initialized');
    } catch (error) {
      console.error('Failed to initialize alert manager service:', error);
    }
  }

  /**
   * エラーレポートの処理
   */
  public async processErrorReport(errorReport: ErrorReport): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Alert manager not initialized');
      return;
    }

    try {
      // エラー履歴に追加
      this.errorHistory.push(errorReport);
      this.trimErrorHistory();

      // アラートルールをチェック
      await this.checkAlertRules('error', errorReport);
    } catch (error) {
      console.error('Failed to process error report:', error);
    }
  }

  /**
   * クラッシュレポートの処理
   */
  public async processCrashReport(crashReport: CrashReport): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Alert manager not initialized');
      return;
    }

    try {
      // クラッシュ履歴に追加
      this.crashHistory.push(crashReport);
      this.trimCrashHistory();

      // アラートルールをチェック
      await this.checkAlertRules('crash', crashReport);
    } catch (error) {
      console.error('Failed to process crash report:', error);
    }
  }

  /**
   * アラートルールの追加
   */
  public async addAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const newRule: AlertRule = {
      ...rule,
      id: this.generateRuleId()
    };

    this.alertRules.push(newRule);
    await this.saveAlertRules();
    
    console.log(`Alert rule added: ${newRule.name}`);
    return newRule.id;
  }

  /**
   * アラートルールの更新
   */
  public async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    await this.saveAlertRules();
    
    console.log(`Alert rule updated: ${ruleId}`);
  }

  /**
   * アラートルールの削除
   */
  public async removeAlertRule(ruleId: string): Promise<void> {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
    await this.saveAlertRules();
    
    console.log(`Alert rule removed: ${ruleId}`);
  }

  /**
   * アラートルールの取得
   */
  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * 通知の取得
   */
  public getNotifications(limit?: number): AlertNotification[] {
    const notifications = [...this.notifications].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? notifications.slice(0, limit) : notifications;
  }

  /**
   * 通知の確認
   */
  public async acknowledgeNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      await this.saveNotifications();
      console.log(`Notification acknowledged: ${notificationId}`);
    }
  }

  /**
   * 通知のクリア
   */
  public async clearNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
    console.log('All notifications cleared');
  }

  /**
   * アラート統計の取得
   */
  public getAlertStatistics(): {
    totalRules: number;
    activeRules: number;
    totalNotifications: number;
    unacknowledgedNotifications: number;
    notificationsBySeverity: Record<string, number>;
  } {
    const notificationsBySeverity: Record<string, number> = {};
    let unacknowledgedCount = 0;

    this.notifications.forEach(notification => {
      notificationsBySeverity[notification.severity] = 
        (notificationsBySeverity[notification.severity] || 0) + 1;
      
      if (!notification.acknowledged) {
        unacknowledgedCount++;
      }
    });

    return {
      totalRules: this.alertRules.length,
      activeRules: this.alertRules.filter(rule => rule.enabled).length,
      totalNotifications: this.notifications.length,
      unacknowledgedNotifications: unacknowledgedCount,
      notificationsBySeverity
    };
  }

  // プライベートメソッド

  private setupDefaultRules(): void {
    this.alertRules = [
      {
        id: 'default_critical_errors',
        name: 'Critical Errors',
        enabled: true,
        conditions: [
          {
            type: 'severity',
            operator: 'equals',
            value: 'critical',
            timeWindow: 5
          }
        ],
        actions: [
          {
            type: 'console_log',
            config: { level: 'error' }
          },
          {
            type: 'user_notification',
            config: { 
              title: 'Critical Error',
              message: 'A critical error has occurred'
            }
          }
        ],
        cooldownPeriod: 5
      },
      {
        id: 'default_high_error_rate',
        name: 'High Error Rate',
        enabled: true,
        conditions: [
          {
            type: 'error_rate',
            operator: 'greater_than',
            value: 10,
            timeWindow: 10
          }
        ],
        actions: [
          {
            type: 'console_log',
            config: { level: 'warn' }
          }
        ],
        cooldownPeriod: 15
      },
      {
        id: 'default_crash_detection',
        name: 'Crash Detection',
        enabled: true,
        conditions: [
          {
            type: 'crash_count',
            operator: 'greater_than',
            value: 0,
            timeWindow: 1
          }
        ],
        actions: [
          {
            type: 'console_log',
            config: { level: 'error' }
          },
          {
            type: 'user_notification',
            config: {
              title: 'App Crash Detected',
              message: 'The application has crashed and a report has been generated'
            }
          }
        ],
        cooldownPeriod: 1
      }
    ];
  }

  private async checkAlertRules(
    eventType: 'error' | 'crash',
    data: ErrorReport | CrashReport
  ): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // クールダウン期間をチェック
      if (this.isInCooldown(rule)) continue;

      // 条件をチェック
      const conditionsMet = await this.evaluateConditions(rule.conditions, eventType, data);
      
      if (conditionsMet) {
        await this.triggerAlert(rule, eventType, data);
      }
    }
  }

  private isInCooldown(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;
    
    const cooldownMs = rule.cooldownPeriod * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
    
    return timeSinceLastTrigger < cooldownMs;
  }

  private async evaluateConditions(
    conditions: AlertCondition[],
    eventType: 'error' | 'crash',
    data: ErrorReport | CrashReport
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, eventType, data);
      if (!result) return false;
    }
    return true;
  }

  private async evaluateCondition(
    condition: AlertCondition,
    eventType: 'error' | 'crash',
    data: ErrorReport | CrashReport
  ): Promise<boolean> {
    const timeWindowMs = condition.timeWindow * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    switch (condition.type) {
      case 'severity':
        return this.compareValues(
          (data as ErrorReport).severity || 'critical',
          condition.operator,
          condition.value
        );

      case 'error_type':
        return this.compareValues(
          (data as ErrorReport).errorType || 'unknown',
          condition.operator,
          condition.value
        );

      case 'error_count':
        const errorCount = this.errorHistory.filter(
          error => error.timestamp >= cutoffTime
        ).length;
        return this.compareValues(errorCount, condition.operator, condition.value);

      case 'crash_count':
        const crashCount = this.crashHistory.filter(
          crash => crash.timestamp >= cutoffTime
        ).length;
        return this.compareValues(crashCount, condition.operator, condition.value);

      case 'error_rate':
        const recentErrors = this.errorHistory.filter(
          error => error.timestamp >= cutoffTime
        ).length;
        const errorRate = recentErrors / (condition.timeWindow / 60); // errors per hour
        return this.compareValues(errorRate, condition.operator, condition.value);

      default:
        return false;
    }
  }

  private compareValues(
    actual: string | number,
    operator: AlertCondition['operator'],
    expected: string | number
  ): boolean {
    switch (operator) {
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    eventType: 'error' | 'crash',
    data: ErrorReport | CrashReport
  ): Promise<void> {
    // ルールの最終トリガー時刻を更新
    rule.lastTriggered = new Date();
    await this.saveAlertRules();

    // 通知を作成
    const notification: AlertNotification = {
      id: this.generateNotificationId(),
      timestamp: new Date(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: this.determineSeverity(rule, data),
      message: this.generateAlertMessage(rule, eventType, data),
      details: { eventType, data },
      acknowledged: false
    };

    this.notifications.push(notification);
    await this.saveNotifications();

    // アクションを実行
    for (const action of rule.actions) {
      await this.executeAction(action, notification);
    }

    console.log(`Alert triggered: ${rule.name}`);
  }

  private determineSeverity(
    rule: AlertRule,
    data: ErrorReport | CrashReport
  ): AlertNotification['severity'] {
    // データの重要度に基づいて決定
    if ('severity' in data) {
      return data.severity as AlertNotification['severity'];
    }
    return 'critical'; // クラッシュは常にクリティカル
  }

  private generateAlertMessage(
    rule: AlertRule,
    eventType: 'error' | 'crash',
    data: ErrorReport | CrashReport
  ): string {
    const timestamp = new Date().toLocaleString();
    const message = 'message' in data ? data.message : data.errorMessage;
    
    return `[${timestamp}] ${rule.name}: ${eventType} - ${message}`;
  }

  private async executeAction(
    action: AlertAction,
    notification: AlertNotification
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'console_log':
          this.executeConsoleLogAction(action, notification);
          break;
        case 'user_notification':
          this.executeUserNotificationAction(action, notification);
          break;
        case 'local_storage':
          await this.executeLocalStorageAction(action, notification);
          break;
        case 'remote_webhook':
          await this.executeRemoteWebhookAction(action, notification);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  private executeConsoleLogAction(action: AlertAction, notification: AlertNotification): void {
    const level = action.config.level || 'log';
    const logMethod = console[level as keyof Console] || console.log;
    (logMethod as Function)(`[ALERT] ${notification.message}`, notification.details);
  }

  private executeUserNotificationAction(action: AlertAction, notification: AlertNotification): void {
    const title = action.config.title || 'Alert';
    const message = action.config.message || notification.message;

    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => this.acknowledgeNotification(notification.id)
      }
    ]);
  }

  private async executeLocalStorageAction(
    action: AlertAction,
    notification: AlertNotification
  ): Promise<void> {
    const key = action.config.key || 'alert_notifications';
    const existingData = await AsyncStorage.getItem(key);
    const notifications = existingData ? JSON.parse(existingData) : [];
    
    notifications.push(notification);
    await AsyncStorage.setItem(key, JSON.stringify(notifications));
  }

  private async executeRemoteWebhookAction(
    action: AlertAction,
    notification: AlertNotification
  ): Promise<void> {
    // 将来の実装: リモートWebhookへの送信
    console.log('Remote webhook action not implemented yet:', action.config.url);
  }

  private async loadAlertRules(): Promise<void> {
    try {
      const rulesStr = await AsyncStorage.getItem('alert_rules');
      if (rulesStr) {
        const rules = JSON.parse(rulesStr);
        this.alertRules = [...this.alertRules, ...rules];
      }
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  }

  private async saveAlertRules(): Promise<void> {
    try {
      await AsyncStorage.setItem('alert_rules', JSON.stringify(this.alertRules));
    } catch (error) {
      console.error('Failed to save alert rules:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const notificationsStr = await AsyncStorage.getItem('alert_notifications');
      if (notificationsStr) {
        this.notifications = JSON.parse(notificationsStr);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('alert_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private async loadErrorHistory(): Promise<void> {
    try {
      const historyStr = await AsyncStorage.getItem('error_history');
      if (historyStr) {
        this.errorHistory = JSON.parse(historyStr);
      }
    } catch (error) {
      console.error('Failed to load error history:', error);
    }
  }

  private trimErrorHistory(): void {
    // 最新1000件のエラーのみ保持
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  private trimCrashHistory(): void {
    // 最新100件のクラッシュのみ保持
    if (this.crashHistory.length > 100) {
      this.crashHistory = this.crashHistory.slice(-100);
    }
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AlertManagerService;