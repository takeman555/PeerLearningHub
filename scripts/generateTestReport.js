#!/usr/bin/env node

/**
 * Test Report Generator
 * Generates comprehensive test reports from multiple test suites
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class TestReportGenerator {
  constructor() {
    this.testResultsDir = './all-test-results';
    this.reportOutputPath = './test-report.html';
    this.summaryOutputPath = './test-summary.json';
  }

  async generateReport() {
    console.log('Generating comprehensive test report...');
    
    const testSuites = await this.parseTestResults();
    const summary = this.generateSummary(testSuites);
    const htmlReport = this.generateHtmlReport(testSuites, summary);
    
    // Write files
    fs.writeFileSync(this.reportOutputPath, htmlReport);
    fs.writeFileSync(this.summaryOutputPath, JSON.stringify(summary, null, 2));
    
    console.log(`Test report generated: ${this.reportOutputPath}`);
    console.log(`Test summary generated: ${this.summaryOutputPath}`);
    
    return summary;
  }

  async parseTestResults() {
    const testSuites = {
      unit: { name: 'Unit Tests', results: [], coverage: null },
      integration: { name: 'Integration Tests', results: [] },
      functional: { name: 'Functional Tests', results: [] },
      performance: { name: 'Performance Tests', results: [] },
      security: { name: 'Security Tests', results: [] }
    };

    // Parse JUnit XML files
    for (const [suiteKey, suite] of Object.entries(testSuites)) {
      const xmlPath = path.join(this.testResultsDir, `${suiteKey}-test-results`, `${suiteKey}-tests.xml`);
      
      if (fs.existsSync(xmlPath)) {
        try {
          const xmlContent = fs.readFileSync(xmlPath, 'utf8');
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(xmlContent);
          
          if (result.testsuites && result.testsuites.testsuite) {
            suite.results = this.parseJUnitXml(result.testsuites.testsuite);
          }
        } catch (error) {
          console.warn(`Could not parse ${suiteKey} test results:`, error.message);
        }
      }
    }

    // Parse coverage data for unit tests
    const coveragePath = path.join(this.testResultsDir, 'unit-test-results', 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        testSuites.unit.coverage = coverageData.total;
      } catch (error) {
        console.warn('Could not parse coverage data:', error.message);
      }
    }

    return testSuites;
  }

  parseJUnitXml(testsuites) {
    const results = [];
    
    if (!Array.isArray(testsuites)) {
      testsuites = [testsuites];
    }
    
    testsuites.forEach(testsuite => {
      if (testsuite.testcase) {
        testsuite.testcase.forEach(testcase => {
          const result = {
            name: testcase.$.name,
            classname: testcase.$.classname || '',
            time: parseFloat(testcase.$.time || 0),
            status: 'passed'
          };
          
          if (testcase.failure) {
            result.status = 'failed';
            result.failure = testcase.failure[0]._ || testcase.failure[0];
          } else if (testcase.error) {
            result.status = 'error';
            result.error = testcase.error[0]._ || testcase.error[0];
          } else if (testcase.skipped) {
            result.status = 'skipped';
          }
          
          results.push(result);
        });
      }
    });
    
    return results;
  }

  generateSummary(testSuites) {
    const summary = {
      overall: {
        status: 'passed',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: 0
      },
      suites: {}
    };

    for (const [suiteKey, suite] of Object.entries(testSuites)) {
      const suiteStats = {
        name: suite.name,
        status: 'passed',
        total: suite.results.length,
        passed: suite.results.filter(r => r.status === 'passed').length,
        failed: suite.results.filter(r => r.status === 'failed' || r.status === 'error').length,
        skipped: suite.results.filter(r => r.status === 'skipped').length,
        duration: suite.results.reduce((sum, r) => sum + r.time, 0),
        coverage: suite.coverage ? Math.round(suite.coverage.lines.pct) : null
      };

      if (suiteStats.failed > 0) {
        suiteStats.status = 'failed';
        summary.overall.status = 'failed';
      }

      summary.suites[suiteKey] = suiteStats;
      summary.overall.totalTests += suiteStats.total;
      summary.overall.passedTests += suiteStats.passed;
      summary.overall.failedTests += suiteStats.failed;
      summary.overall.skippedTests += suiteStats.skipped;
    }

    // Calculate overall coverage (from unit tests)
    if (summary.suites.unit && summary.suites.unit.coverage !== null) {
      summary.overall.coverage = summary.suites.unit.coverage;
    }

    return summary;
  }

  generateHtmlReport(testSuites, summary) {
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PeerLearningHub - Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #ffc107; }
        .suites {
            padding: 30px;
        }
        .suite {
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        }
        .suite-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-title {
            font-size: 1.2em;
            font-weight: bold;
        }
        .suite-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
        }
        .test-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .test-item {
            padding: 10px 20px;
            border-bottom: 1px solid #f1f3f4;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-name {
            flex: 1;
        }
        .test-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .test-status.passed {
            background: #d4edda;
            color: #155724;
        }
        .test-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-status.skipped {
            background: #fff3cd;
            color: #856404;
        }
        .test-time {
            margin-left: 10px;
            color: #6c757d;
            font-size: 0.8em;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Report</h1>
            <p>PeerLearningHub - Generated on ${timestamp}</p>
        </div>
        
        <div class="summary">
            <h2>Overall Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Status</h3>
                    <div class="value status-${summary.overall.status}">${summary.overall.status.toUpperCase()}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">${summary.overall.totalTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="value status-passed">${summary.overall.passedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="value status-failed">${summary.overall.failedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Coverage</h3>
                    <div class="value">${summary.overall.coverage}%</div>
                </div>
            </div>
        </div>
        
        <div class="suites">
            <h2>Test Suites</h2>
            ${Object.entries(summary.suites).map(([key, suite]) => `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-title">${suite.name}</div>
                        <div class="suite-stats">
                            <span class="status-${suite.status}">${suite.status.toUpperCase()}</span>
                            <span>${suite.passed}/${suite.total} passed</span>
                            ${suite.coverage !== null ? `<span>${suite.coverage}% coverage</span>` : ''}
                            <span>${suite.duration.toFixed(2)}s</span>
                        </div>
                    </div>
                    <div class="test-list">
                        ${testSuites[key].results.map(test => `
                            <div class="test-item">
                                <div class="test-name">${test.name}</div>
                                <div>
                                    <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                                    <span class="test-time">${test.time.toFixed(3)}s</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by PeerLearningHub Test Automation System</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// CLI interface
if (require.main === module) {
  const generator = new TestReportGenerator();
  
  generator.generateReport().then(summary => {
    console.log('Test report generation completed');
    console.log(`Overall status: ${summary.overall.status}`);
    console.log(`Total tests: ${summary.overall.totalTests}`);
    console.log(`Passed: ${summary.overall.passedTests}`);
    console.log(`Failed: ${summary.overall.failedTests}`);
    
    // Exit with error code if tests failed
    process.exit(summary.overall.status === 'failed' ? 1 : 0);
  }).catch(error => {
    console.error('Failed to generate test report:', error);
    process.exit(1);
  });
}

module.exports = TestReportGenerator;