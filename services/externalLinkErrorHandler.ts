/**
 * External Link Error Handler
 * Handles errors and provides user-friendly messages for external link operations
 * Requirements: 4.3, 4.4 - Error handling, timeout processing, user messages
 */

export interface ExternalLinkError {
  type: 'validation' | 'network' | 'timeout' | 'accessibility' | 'security';
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  url?: string;
}

export interface ErrorHandlingOptions {
  showTechnicalDetails?: boolean;
  language?: 'en' | 'ja';
  context?: 'group_creation' | 'link_validation' | 'accessibility_check';
}

/**
 * External Link Error Handler Service
 * Provides comprehensive error handling for external link operations
 */
class ExternalLinkErrorHandler {
  private readonly ERROR_MESSAGES = {
    en: {
      // Validation errors
      'INVALID_URL_FORMAT': 'The URL format is invalid. Please enter a valid web address.',
      'URL_TOO_LONG': 'The URL is too long. Please use a shorter link.',
      'EMPTY_URL': 'Please enter a URL.',
      'SUSPICIOUS_PATTERN': 'This URL contains potentially unsafe content and cannot be used.',
      'INVALID_PROTOCOL': 'Only HTTP and HTTPS links are allowed.',
      'INVALID_DOMAIN': 'Please enter a valid domain name.',
      
      // Network errors
      'NETWORK_ERROR': 'Unable to connect to the website. Please check the URL and try again.',
      'DNS_ERROR': 'The website address could not be found. Please check the URL.',
      'CONNECTION_REFUSED': 'The website refused the connection. The link may be incorrect.',
      'SSL_ERROR': 'There was a security certificate issue with this website.',
      
      // Timeout errors
      'TIMEOUT': 'The website took too long to respond. Please try again later.',
      'REQUEST_TIMEOUT': 'The request timed out. The website may be temporarily unavailable.',
      
      // Accessibility errors
      'NOT_ACCESSIBLE': 'The website is not accessible at the moment.',
      'HTTP_ERROR': 'The website returned an error. Please check if the link is correct.',
      'FORBIDDEN': 'Access to this website is forbidden.',
      'NOT_FOUND': 'The webpage was not found. Please check the URL.',
      'SERVER_ERROR': 'The website is experiencing server issues.',
      
      // Security errors
      'BLOCKED_DOMAIN': 'This domain is not allowed for security reasons.',
      'MALICIOUS_CONTENT': 'This link has been flagged as potentially malicious.',
      'UNSAFE_REDIRECT': 'This link redirects to an unsafe location.',
      
      // Generic messages
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
      'VALIDATION_FAILED': 'Link validation failed. Please check the URL and try again.'
    },
    ja: {
      // Validation errors
      'INVALID_URL_FORMAT': 'URLの形式が無効です。有効なWebアドレスを入力してください。',
      'URL_TOO_LONG': 'URLが長すぎます。短いリンクを使用してください。',
      'EMPTY_URL': 'URLを入力してください。',
      'SUSPICIOUS_PATTERN': 'このURLには安全でない可能性のあるコンテンツが含まれており、使用できません。',
      'INVALID_PROTOCOL': 'HTTPおよびHTTPSリンクのみが許可されています。',
      'INVALID_DOMAIN': '有効なドメイン名を入力してください。',
      
      // Network errors
      'NETWORK_ERROR': 'ウェブサイトに接続できません。URLを確認して再試行してください。',
      'DNS_ERROR': 'ウェブサイトのアドレスが見つかりませんでした。URLを確認してください。',
      'CONNECTION_REFUSED': 'ウェブサイトが接続を拒否しました。リンクが間違っている可能性があります。',
      'SSL_ERROR': 'このウェブサイトのセキュリティ証明書に問題があります。',
      
      // Timeout errors
      'TIMEOUT': 'ウェブサイトの応答に時間がかかりすぎています。後でもう一度お試しください。',
      'REQUEST_TIMEOUT': 'リクエストがタイムアウトしました。ウェブサイトが一時的に利用できない可能性があります。',
      
      // Accessibility errors
      'NOT_ACCESSIBLE': '現在、ウェブサイトにアクセスできません。',
      'HTTP_ERROR': 'ウェブサイトがエラーを返しました。リンクが正しいか確認してください。',
      'FORBIDDEN': 'このウェブサイトへのアクセスは禁止されています。',
      'NOT_FOUND': 'ウェブページが見つかりませんでした。URLを確認してください。',
      'SERVER_ERROR': 'ウェブサイトでサーバーの問題が発生しています。',
      
      // Security errors
      'BLOCKED_DOMAIN': 'このドメインはセキュリティ上の理由で許可されていません。',
      'MALICIOUS_CONTENT': 'このリンクは悪意のある可能性があるとしてフラグが立てられています。',
      'UNSAFE_REDIRECT': 'このリンクは安全でない場所にリダイレクトします。',
      
      // Generic messages
      'UNKNOWN_ERROR': '予期しないエラーが発生しました。もう一度お試しください。',
      'VALIDATION_FAILED': 'リンクの検証に失敗しました。URLを確認して再試行してください。'
    }
  };

  /**
   * Handle validation errors
   * Requirements: 4.3 - Invalid URL processing
   */
  handleValidationError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    const language = options.language || 'en';
    let errorCode = 'VALIDATION_FAILED';
    
    if (error.message) {
      if (error.message.includes('empty')) {
        errorCode = 'EMPTY_URL';
      } else if (error.message.includes('format') || error.message.includes('Invalid URL')) {
        errorCode = 'INVALID_URL_FORMAT';
      } else if (error.message.includes('exceed') || error.message.includes('too long')) {
        errorCode = 'URL_TOO_LONG';
      } else if (error.message.includes('suspicious')) {
        errorCode = 'SUSPICIOUS_PATTERN';
      } else if (error.message.includes('protocol')) {
        errorCode = 'INVALID_PROTOCOL';
      } else if (error.message.includes('domain') || error.message.includes('hostname')) {
        errorCode = 'INVALID_DOMAIN';
      }
    }

    return {
      type: 'validation',
      code: errorCode,
      message: error.message || 'Validation failed',
      userMessage: this.ERROR_MESSAGES[language][errorCode] || this.ERROR_MESSAGES[language]['VALIDATION_FAILED'],
      details: options.showTechnicalDetails ? error : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Handle network errors
   * Requirements: 4.3 - Link access failure handling
   */
  handleNetworkError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    const language = options.language || 'en';
    let errorCode = 'NETWORK_ERROR';
    
    if (error.message) {
      if (error.message.includes('DNS') || error.message.includes('ENOTFOUND')) {
        errorCode = 'DNS_ERROR';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorCode = 'CONNECTION_REFUSED';
      } else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        errorCode = 'SSL_ERROR';
      }
    }

    return {
      type: 'network',
      code: errorCode,
      message: error.message || 'Network error',
      userMessage: this.ERROR_MESSAGES[language][errorCode] || this.ERROR_MESSAGES[language]['NETWORK_ERROR'],
      details: options.showTechnicalDetails ? error : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Handle timeout errors
   * Requirements: 4.4 - Link validation timeout processing
   */
  handleTimeoutError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    const language = options.language || 'en';
    let errorCode = 'TIMEOUT';
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorCode = error.message.includes('request') ? 'REQUEST_TIMEOUT' : 'TIMEOUT';
    }

    return {
      type: 'timeout',
      code: errorCode,
      message: error.message || 'Request timed out',
      userMessage: this.ERROR_MESSAGES[language][errorCode] || this.ERROR_MESSAGES[language]['TIMEOUT'],
      details: options.showTechnicalDetails ? error : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Handle HTTP accessibility errors
   * Requirements: 4.3 - Link access failure message display
   */
  handleAccessibilityError(statusCode: number, statusText: string, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
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

    return {
      type: 'accessibility',
      code: errorCode,
      message: `HTTP ${statusCode}: ${statusText}`,
      userMessage: this.ERROR_MESSAGES[language][errorCode] || this.ERROR_MESSAGES[language]['NOT_ACCESSIBLE'],
      details: options.showTechnicalDetails ? { statusCode, statusText } : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Handle security errors
   * Requirements: 4.3 - Security-related error handling
   */
  handleSecurityError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    const language = options.language || 'en';
    let errorCode = 'BLOCKED_DOMAIN';
    
    if (error.message) {
      if (error.message.includes('malicious') || error.message.includes('dangerous')) {
        errorCode = 'MALICIOUS_CONTENT';
      } else if (error.message.includes('redirect')) {
        errorCode = 'UNSAFE_REDIRECT';
      }
    }

    return {
      type: 'security',
      code: errorCode,
      message: error.message || 'Security error',
      userMessage: this.ERROR_MESSAGES[language][errorCode] || this.ERROR_MESSAGES[language]['BLOCKED_DOMAIN'],
      details: options.showTechnicalDetails ? error : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Handle unknown errors
   */
  handleUnknownError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    const language = options.language || 'en';
    
    return {
      type: 'validation',
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error',
      userMessage: this.ERROR_MESSAGES[language]['UNKNOWN_ERROR'],
      details: options.showTechnicalDetails ? error : undefined,
      timestamp: new Date(),
      url
    };
  }

  /**
   * Determine error type and handle appropriately
   */
  handleError(error: any, url?: string, options: ErrorHandlingOptions = {}): ExternalLinkError {
    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return this.handleTimeoutError(error, url, options);
    }

    // Network errors
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') || 
        error.message?.includes('ENOTFOUND') || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('DNS') ||
        error.message?.includes('SSL') ||
        error.message?.includes('certificate')) {
      return this.handleNetworkError(error, url, options);
    }

    // Security errors
    if (error.message?.includes('suspicious') || 
        error.message?.includes('malicious') || 
        error.message?.includes('blocked') ||
        error.message?.includes('security')) {
      return this.handleSecurityError(error, url, options);
    }

    // Validation errors
    if (error.message?.includes('Invalid URL') || 
        error.message?.includes('format') || 
        error.message?.includes('protocol') ||
        error.message?.includes('domain') ||
        error.message?.includes('empty') ||
        error.message?.includes('exceed')) {
      return this.handleValidationError(error, url, options);
    }

    // Default to unknown error
    return this.handleUnknownError(error, url, options);
  }

  /**
   * Get user-friendly error message for display in UI
   */
  getUserMessage(error: ExternalLinkError, context?: string): string {
    let message = error.userMessage;
    
    // Add context-specific guidance
    if (context === 'group_creation') {
      const suffix = error.userMessage.includes('URLを') ? 
        ' グループの外部リンクとして有効なURLを入力してください。' :
        ' Please enter a valid URL for the group\'s external link.';
      message += suffix;
    }
    
    return message;
  }

  /**
   * Log error for debugging purposes
   */
  logError(error: ExternalLinkError): void {
    console.error(`[ExternalLinkError] ${error.type.toUpperCase()}: ${error.code}`, {
      message: error.message,
      url: error.url,
      timestamp: error.timestamp,
      details: error.details
    });
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  isRecoverable(error: ExternalLinkError): boolean {
    const recoverableTypes = ['network', 'timeout', 'accessibility'];
    const nonRecoverableCodes = ['SUSPICIOUS_PATTERN', 'INVALID_PROTOCOL', 'BLOCKED_DOMAIN', 'MALICIOUS_CONTENT'];
    
    return recoverableTypes.includes(error.type) && !nonRecoverableCodes.includes(error.code);
  }

  /**
   * Get retry suggestion for recoverable errors
   */
  getRetrySuggestion(error: ExternalLinkError, language: 'en' | 'ja' = 'en'): string | null {
    if (!this.isRecoverable(error)) {
      return null;
    }

    const suggestions = {
      en: {
        'TIMEOUT': 'The website may be slow. Try again in a few moments.',
        'NETWORK_ERROR': 'Check your internet connection and try again.',
        'DNS_ERROR': 'The website may be temporarily unavailable. Try again later.',
        'NOT_ACCESSIBLE': 'The website may be temporarily down. Try again later.',
        'SERVER_ERROR': 'The website is experiencing issues. Try again later.'
      },
      ja: {
        'TIMEOUT': 'ウェブサイトが遅い可能性があります。しばらくしてから再試行してください。',
        'NETWORK_ERROR': 'インターネット接続を確認して再試行してください。',
        'DNS_ERROR': 'ウェブサイトが一時的に利用できない可能性があります。後でもう一度お試しください。',
        'NOT_ACCESSIBLE': 'ウェブサイトが一時的にダウンしている可能性があります。後でもう一度お試しください。',
        'SERVER_ERROR': 'ウェブサイトで問題が発生しています。後でもう一度お試しください。'
      }
    };

    return suggestions[language][error.code] || null;
  }
}

// Export singleton instance
export const externalLinkErrorHandler = new ExternalLinkErrorHandler();
export default externalLinkErrorHandler;