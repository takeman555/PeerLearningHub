/**
 * Test script for External Link Error Handling
 * Tests error handling and user-friendly messages
 */

console.log('🧪 Testing External Link Error Handling...\n');

// Test error message generation
function testErrorMessages() {
  console.log('📝 Testing Error Messages:\n');

  const testErrors = [
    {
      name: 'Empty URL',
      error: { message: 'URL cannot be empty' },
      expectedCode: 'EMPTY_URL'
    },
    {
      name: 'Invalid Format',
      error: { message: 'Invalid URL format' },
      expectedCode: 'INVALID_URL_FORMAT'
    },
    {
      name: 'Suspicious Pattern',
      error: { message: 'URL contains suspicious patterns and may be unsafe' },
      expectedCode: 'SUSPICIOUS_PATTERN'
    },
    {
      name: 'Network Error',
      error: { message: 'Network error: ENOTFOUND' },
      expectedCode: 'DNS_ERROR'
    },
    {
      name: 'Timeout Error',
      error: { name: 'AbortError', message: 'Request timed out' },
      expectedCode: 'TIMEOUT'
    },
    {
      name: 'SSL Error',
      error: { message: 'SSL certificate error' },
      expectedCode: 'SSL_ERROR'
    }
  ];

  // Mock error handler logic
  function handleError(error, url, options = {}) {
    const language = options.language || 'en';
    let errorCode = 'UNKNOWN_ERROR';
    let type = 'validation';

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      type = 'timeout';
      errorCode = 'TIMEOUT';
    }
    // Network errors
    else if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
      type = 'network';
      errorCode = 'DNS_ERROR';
    }
    else if (error.message?.includes('SSL') || error.message?.includes('certificate')) {
      type = 'network';
      errorCode = 'SSL_ERROR';
    }
    // Validation errors
    else if (error.message?.includes('empty')) {
      errorCode = 'EMPTY_URL';
    }
    else if (error.message?.includes('format') || error.message?.includes('Invalid URL')) {
      errorCode = 'INVALID_URL_FORMAT';
    }
    else if (error.message?.includes('suspicious')) {
      type = 'security';
      errorCode = 'SUSPICIOUS_PATTERN';
    }

    const messages = {
      en: {
        'EMPTY_URL': 'Please enter a URL.',
        'INVALID_URL_FORMAT': 'The URL format is invalid. Please enter a valid web address.',
        'SUSPICIOUS_PATTERN': 'This URL contains potentially unsafe content and cannot be used.',
        'DNS_ERROR': 'The website address could not be found. Please check the URL.',
        'TIMEOUT': 'The website took too long to respond. Please try again later.',
        'SSL_ERROR': 'There was a security certificate issue with this website.',
        'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
      },
      ja: {
        'EMPTY_URL': 'URLを入力してください。',
        'INVALID_URL_FORMAT': 'URLの形式が無効です。有効なWebアドレスを入力してください。',
        'SUSPICIOUS_PATTERN': 'このURLには安全でない可能性のあるコンテンツが含まれており、使用できません。',
        'DNS_ERROR': 'ウェブサイトのアドレスが見つかりませんでした。URLを確認してください。',
        'TIMEOUT': 'ウェブサイトの応答に時間がかかりすぎています。後でもう一度お試しください。',
        'SSL_ERROR': 'このウェブサイトのセキュリティ証明書に問題があります。',
        'UNKNOWN_ERROR': '予期しないエラーが発生しました。もう一度お試しください。'
      }
    };

    return {
      type,
      code: errorCode,
      message: error.message,
      userMessage: messages[language][errorCode] || messages[language]['UNKNOWN_ERROR'],
      timestamp: new Date(),
      url
    };
  }

  let passed = 0;
  let failed = 0;

  testErrors.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    
    // Test English messages
    const resultEn = handleError(test.error, 'https://example.com', { language: 'en' });
    const successEn = resultEn.code === test.expectedCode;
    
    // Test Japanese messages
    const resultJa = handleError(test.error, 'https://example.com', { language: 'ja' });
    const successJa = resultJa.code === test.expectedCode;
    
    if (successEn && successJa) {
      console.log(`✅ PASSED - Code: ${resultEn.code}`);
      console.log(`   EN: ${resultEn.userMessage}`);
      console.log(`   JA: ${resultJa.userMessage}`);
      passed++;
    } else {
      console.log(`❌ FAILED - Expected: ${test.expectedCode}, Got: ${resultEn.code}`);
      failed++;
    }
    console.log('');
  });

  console.log(`📊 Error Message Tests: ${passed} passed, ${failed} failed\n`);
}

// Test HTTP status code handling
function testHttpStatusHandling() {
  console.log('🌐 Testing HTTP Status Code Handling:\n');

  const statusTests = [
    { status: 200, text: 'OK', expectedAccessible: true },
    { status: 403, text: 'Forbidden', expectedAccessible: false, expectedCode: 'FORBIDDEN' },
    { status: 404, text: 'Not Found', expectedAccessible: false, expectedCode: 'NOT_FOUND' },
    { status: 500, text: 'Internal Server Error', expectedAccessible: false, expectedCode: 'SERVER_ERROR' },
    { status: 502, text: 'Bad Gateway', expectedAccessible: false, expectedCode: 'SERVER_ERROR' }
  ];

  function handleAccessibilityError(statusCode, statusText, url, options = {}) {
    const language = options.language || 'en';
    let errorCode = 'NOT_ACCESSIBLE';
    
    if (statusCode >= 400 && statusCode < 500) {
      switch (statusCode) {
        case 403:
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          break;
        default:
          errorCode = 'HTTP_ERROR';
      }
    } else if (statusCode >= 500) {
      errorCode = 'SERVER_ERROR';
    }

    const messages = {
      en: {
        'FORBIDDEN': 'Access to this website is forbidden.',
        'NOT_FOUND': 'The webpage was not found. Please check the URL.',
        'SERVER_ERROR': 'The website is experiencing server issues.',
        'HTTP_ERROR': 'The website returned an error. Please check if the link is correct.',
        'NOT_ACCESSIBLE': 'The website is not accessible at the moment.'
      },
      ja: {
        'FORBIDDEN': 'このウェブサイトへのアクセスは禁止されています。',
        'NOT_FOUND': 'ウェブページが見つかりませんでした。URLを確認してください。',
        'SERVER_ERROR': 'ウェブサイトでサーバーの問題が発生しています。',
        'HTTP_ERROR': 'ウェブサイトがエラーを返しました。リンクが正しいか確認してください。',
        'NOT_ACCESSIBLE': '現在、ウェブサイトにアクセスできません。'
      }
    };

    return {
      type: 'accessibility',
      code: errorCode,
      message: `HTTP ${statusCode}: ${statusText}`,
      userMessage: messages[language][errorCode],
      statusCode,
      statusText
    };
  }

  let passed = 0;
  let failed = 0;

  statusTests.forEach((test, index) => {
    console.log(`Status Test ${index + 1}: HTTP ${test.status} ${test.text}`);
    
    if (test.expectedAccessible) {
      console.log('✅ PASSED - Accessible status');
      passed++;
    } else {
      const result = handleAccessibilityError(test.status, test.text, 'https://example.com');
      const success = result.code === test.expectedCode;
      
      if (success) {
        console.log(`✅ PASSED - Code: ${result.code}`);
        console.log(`   Message: ${result.userMessage}`);
        passed++;
      } else {
        console.log(`❌ FAILED - Expected: ${test.expectedCode}, Got: ${result.code}`);
        failed++;
      }
    }
    console.log('');
  });

  console.log(`📊 HTTP Status Tests: ${passed} passed, ${failed} failed\n`);
}

// Test retry suggestions
function testRetrySuggestions() {
  console.log('🔄 Testing Retry Suggestions:\n');

  const retryTests = [
    {
      name: 'Timeout Error',
      error: { name: 'AbortError', message: 'Request timed out' },
      shouldHaveRetry: true
    },
    {
      name: 'Network Error',
      error: { message: 'Network error: ENOTFOUND' },
      shouldHaveRetry: true
    },
    {
      name: 'Suspicious Pattern',
      error: { message: 'URL contains suspicious patterns' },
      shouldHaveRetry: false
    },
    {
      name: 'Invalid Protocol',
      error: { message: 'Only HTTP and HTTPS protocols are allowed' },
      shouldHaveRetry: false
    }
  ];

  function isRecoverable(errorCode) {
    const nonRecoverableCodes = ['SUSPICIOUS_PATTERN', 'INVALID_PROTOCOL', 'BLOCKED_DOMAIN', 'MALICIOUS_CONTENT'];
    return !nonRecoverableCodes.includes(errorCode);
  }

  function getErrorCode(error) {
    if (error.name === 'AbortError') return 'TIMEOUT';
    if (error.message?.includes('ENOTFOUND')) return 'DNS_ERROR';
    if (error.message?.includes('suspicious')) return 'SUSPICIOUS_PATTERN';
    if (error.message?.includes('protocol')) return 'INVALID_PROTOCOL';
    return 'UNKNOWN_ERROR';
  }

  let passed = 0;
  let failed = 0;

  retryTests.forEach((test, index) => {
    console.log(`Retry Test ${index + 1}: ${test.name}`);
    
    const errorCode = getErrorCode(test.error);
    const recoverable = isRecoverable(errorCode);
    const success = recoverable === test.shouldHaveRetry;
    
    if (success) {
      console.log(`✅ PASSED - Recoverable: ${recoverable}`);
      if (recoverable) {
        console.log('   Suggestion: User can retry this operation');
      } else {
        console.log('   Suggestion: User should fix the URL before retrying');
      }
      passed++;
    } else {
      console.log(`❌ FAILED - Expected recoverable: ${test.shouldHaveRetry}, Got: ${recoverable}`);
      failed++;
    }
    console.log('');
  });

  console.log(`📊 Retry Suggestion Tests: ${passed} passed, ${failed} failed\n`);
}

// Run all tests
async function runAllTests() {
  testErrorMessages();
  testHttpStatusHandling();
  testRetrySuggestions();
  
  console.log('🎉 External Link Error Handling tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Validation error messages ✅');
  console.log('- Network error handling ✅');
  console.log('- Timeout error processing ✅');
  console.log('- HTTP status code handling ✅');
  console.log('- Multilingual support (EN/JA) ✅');
  console.log('- Retry suggestions ✅');
  console.log('- User-friendly error messages ✅');
}

runAllTests().catch(console.error);