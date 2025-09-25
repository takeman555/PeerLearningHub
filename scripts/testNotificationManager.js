#!/usr/bin/env node

/**
 * Test Notification Manager
 * Manages notifications for test failures and results
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class TestNotificationManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      slack: {
        enabled: false,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#dev-notifications',
        username: 'Test Bot',
        iconEmoji: ':test_tube:'
      },
      email: {
        enabled: false,
        recipients: [],
        smtpConfig: {}
      },
      github: {
        enabled: true,
        createIssueOnFailure: false
      }
    };

    const configPath = path.join(__dirname, '..', 'config', 'test-notifications.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('Could not load notification config:', error.message);
      }
    }

    return defaultConfig;
  }

  async notifyTestResults(testSummary, context = {}) {
    console.log('Sending test result notifications...');
    
    const notifications = [];
    
    if (this.config.slack.enabled && this.config.slack.webhookUrl) {
      notifications.push(this.sendSlackNotification(testSummary, context));
    }
    
    if (this.config.email.enabled && this.config.email.recipients.length > 0) {
      notifications.push(this.sendEmailNotification(testSummary, context));
    }
    
    if (this.config.github.enabled && testSummary.overall.status === 'failed' && this.config.github.createIssueOnFailure) {
      notifications.push(this.createGitHubIssue(testSummary, context));
    }
    
    const results = await Promise.allSettled(notifications);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Notification ${index + 1} sent successfully`);
      } else {
        console.error(`❌ Notification ${index + 1} failed:`, result.reason);
      }
    });
    
    return results;
  }

  async sendSlackNotification(testSummary, context) {
    const color = testSummary.overall.status === 'passed' ? 'good' : 'danger';
    const emoji = testSummary.overall.status === 'passed' ? ':white_check_mark:' : ':x:';
    
    const payload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username,
      icon_emoji: this.config.slack.iconEmoji,
      attachments: [
        {
          color: color,
          title: `${emoji} Test Results - ${testSummary.overall.status.toUpperCase()}`,
          fields: [
            {
              title: 'Branch',
              value: context.branch || 'unknown',
              short: true
            },
            {
              title: 'Commit',
              value: context.commit ? context.commit.substring(0, 8) : 'unknown',
              short: true
            },
            {
              title: 'Total Tests',
              value: testSummary.overall.totalTests.toString(),
              short: true
            },
            {
              title: 'Passed',
              value: testSummary.overall.passedTests.toString(),
              short: true
            },
            {
              title: 'Failed',
              value: testSummary.overall.failedTests.toString(),
              short: true
            },
            {
              title: 'Coverage',
              value: `${testSummary.overall.coverage}%`,
              short: true
            }
          ],
          footer: 'PeerLearningHub CI/CD',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Add failed test details if any
    if (testSummary.overall.failedTests > 0) {
      const failedTests = [];
      
      Object.entries(testSummary.suites).forEach(([suiteKey, suite]) => {
        if (suite.failed > 0) {
          failedTests.push(`• ${suite.name}: ${suite.failed} failed`);
        }
      });
      
      if (failedTests.length > 0) {
        payload.attachments.push({
          color: 'danger',
          title: 'Failed Test Suites',
          text: failedTests.join('\n'),
          footer: 'Check the full report for details'
        });
      }
    }

    return this.sendSlackWebhook(payload);
  }

  async sendSlackWebhook(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const url = new URL(this.config.slack.webhookUrl);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ status: 'success', response: responseData });
          } else {
            reject(new Error(`Slack webhook failed: ${res.statusCode} ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  async sendEmailNotification(testSummary, context) {
    // Placeholder for email notification
    // In a real implementation, you would use nodemailer or similar
    console.log('Email notification would be sent to:', this.config.email.recipients);
    
    const subject = `Test Results: ${testSummary.overall.status.toUpperCase()} - PeerLearningHub`;
    const body = this.generateEmailBody(testSummary, context);
    
    return {
      status: 'success',
      message: 'Email notification sent',
      subject,
      recipients: this.config.email.recipients
    };
  }

  generateEmailBody(testSummary, context) {
    return `
Test Results Summary for PeerLearningHub

Status: ${testSummary.overall.status.toUpperCase()}
Branch: ${context.branch || 'unknown'}
Commit: ${context.commit || 'unknown'}

Results:
- Total Tests: ${testSummary.overall.totalTests}
- Passed: ${testSummary.overall.passedTests}
- Failed: ${testSummary.overall.failedTests}
- Skipped: ${testSummary.overall.skippedTests}
- Coverage: ${testSummary.overall.coverage}%

Test Suites:
${Object.entries(testSummary.suites).map(([key, suite]) => 
  `- ${suite.name}: ${suite.passed}/${suite.total} passed (${suite.status})`
).join('\n')}

${testSummary.overall.failedTests > 0 ? 
  'Please check the detailed test report for failure information.' : 
  'All tests passed successfully!'
}

Generated by PeerLearningHub CI/CD System
    `.trim();
  }

  async createGitHubIssue(testSummary, context) {
    // Placeholder for GitHub issue creation
    // In a real implementation, you would use GitHub API
    console.log('GitHub issue would be created for test failures');
    
    const title = `Test Failures Detected - ${context.branch || 'unknown'} (${new Date().toISOString().split('T')[0]})`;
    const body = this.generateGitHubIssueBody(testSummary, context);
    
    return {
      status: 'success',
      message: 'GitHub issue created',
      title,
      body
    };
  }

  generateGitHubIssueBody(testSummary, context) {
    return `
## Test Failure Report

**Branch:** ${context.branch || 'unknown'}
**Commit:** ${context.commit || 'unknown'}
**Date:** ${new Date().toISOString()}

### Summary
- **Status:** ${testSummary.overall.status.toUpperCase()}
- **Total Tests:** ${testSummary.overall.totalTests}
- **Failed Tests:** ${testSummary.overall.failedTests}
- **Coverage:** ${testSummary.overall.coverage}%

### Failed Test Suites
${Object.entries(testSummary.suites)
  .filter(([key, suite]) => suite.failed > 0)
  .map(([key, suite]) => `- **${suite.name}:** ${suite.failed} failed out of ${suite.total}`)
  .join('\n')}

### Next Steps
1. Review the detailed test report
2. Investigate failing tests
3. Fix issues and re-run tests
4. Close this issue when all tests pass

### Labels
- bug
- test-failure
- ci/cd

---
*This issue was automatically created by the PeerLearningHub CI/CD system.*
    `.trim();
  }

  async notifyTestFailure(testName, error, context = {}) {
    if (!this.config.slack.enabled || !this.config.slack.webhookUrl) {
      return;
    }

    const payload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username,
      icon_emoji: ':warning:',
      attachments: [
        {
          color: 'danger',
          title: ':x: Test Failure Alert',
          fields: [
            {
              title: 'Test Name',
              value: testName,
              short: false
            },
            {
              title: 'Error',
              value: error.substring(0, 500) + (error.length > 500 ? '...' : ''),
              short: false
            },
            {
              title: 'Branch',
              value: context.branch || 'unknown',
              short: true
            },
            {
              title: 'Commit',
              value: context.commit ? context.commit.substring(0, 8) : 'unknown',
              short: true
            }
          ],
          footer: 'PeerLearningHub Test Monitor',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    try {
      await this.sendSlackWebhook(payload);
      console.log('Test failure notification sent');
    } catch (error) {
      console.error('Failed to send test failure notification:', error);
    }
  }
}

// CLI interface
if (require.main === module) {
  const notificationManager = new TestNotificationManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'test-results':
      const summaryPath = process.argv[3];
      if (!summaryPath || !fs.existsSync(summaryPath)) {
        console.error('Usage: node testNotificationManager.js test-results <summary-file>');
        process.exit(1);
      }
      
      try {
        const testSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const context = {
          branch: process.env.GITHUB_REF_NAME || process.argv[4],
          commit: process.env.GITHUB_SHA || process.argv[5]
        };
        
        notificationManager.notifyTestResults(testSummary, context).then(() => {
          console.log('Notifications sent successfully');
        }).catch(error => {
          console.error('Failed to send notifications:', error);
          process.exit(1);
        });
      } catch (error) {
        console.error('Failed to parse test summary:', error);
        process.exit(1);
      }
      break;
      
    case 'test-failure':
      const testName = process.argv[3];
      const errorMessage = process.argv[4];
      
      if (!testName || !errorMessage) {
        console.error('Usage: node testNotificationManager.js test-failure <test-name> <error-message>');
        process.exit(1);
      }
      
      const context = {
        branch: process.env.GITHUB_REF_NAME || process.argv[5],
        commit: process.env.GITHUB_SHA || process.argv[6]
      };
      
      notificationManager.notifyTestFailure(testName, errorMessage, context).then(() => {
        console.log('Test failure notification sent');
      }).catch(error => {
        console.error('Failed to send test failure notification:', error);
        process.exit(1);
      });
      break;
      
    default:
      console.log(`
Test Notification Manager Commands:
  test-results <summary-file> [branch] [commit]  - Send test results notification
  test-failure <test-name> <error> [branch] [commit]  - Send test failure alert
      `);
  }
}

module.exports = TestNotificationManager;