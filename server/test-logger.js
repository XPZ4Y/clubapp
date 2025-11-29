const fs = require('fs');
const path = require('path');

class TestLogger {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    // 1. Calculate Status Robustly
    // Sometimes 'results.success' is flaky. We manually check if failures are 0.
    const hasRuntimeErrors = results.numRuntimeErrorTestSuites > 0;
    const hasFailedTests = results.numFailedTests > 0;
    
    // It is a PASS only if no tests failed AND no suites crashed.
    const isSuccess = !hasFailedTests && !hasRuntimeErrors;
    const status = isSuccess ? 'PASSED' : 'FAILED';

    // 2. Prepare the Data Packet
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: status, 
      metrics: {
        totalTests: results.numTotalTests,
        passCount: results.numPassedTests,
        failCount: results.numFailedTests,
        duration_ms: Date.now() - results.startTime,
        memory_usage_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
      },
      // Capture details if something went wrong
      failures: results.testResults
        .filter(test => test.status === 'failed' || test.message) // Capture test failures OR suite crashes
        .map(test => ({
          file: path.basename(test.testFilePath),
          message: test.failureMessage || test.message || "Unknown Error"
        }))
    };

    // 3. Define File Path
    const logDir = path.join(__dirname, 'logs');
    const logFile = path.join(logDir, 'test_history.jsonl');

    // 4. Ensure Directory Exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    // 5. Write to Hard Drive
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    // 6. Console Feedback (With debugging info if it fails)
    console.log(`\n[Data Logger] ------------------------------------------------`);
    console.log(`[Data Logger] Test results saved to: ${logFile}`);
    console.log(`[Data Logger] Status: ${status}`);
    
    if (status === 'FAILED') {
        if (hasRuntimeErrors) console.log(`[Data Logger] ⚠️  Reason: A Test Suite Crashed (Runtime Error)`);
        else if (hasFailedTests) console.log(`[Data Logger] ⚠️  Reason: ${results.numFailedTests} Test(s) Failed`);
        else console.log(`[Data Logger] ⚠️  Reason: No tests passed (or 0 tests found)`);
    }
    console.log(`[Data Logger] ------------------------------------------------\n`);
  }
}

module.exports = TestLogger;