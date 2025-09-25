import { externalLinkErrorHandler, type ExternalLinkError } from './externalLinkErrorHandler';

/**
 * External Link Service
 * Handles external link management with URL validation, accessibility checks, and secure opening
 * Requirements: 4.1, 4.2, 4.4 - External link management, validation, and accessibility
 */

export interface ExternalLinkValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  sanitizedUrl?: string;
}

export interface ExternalLinkAccessibilityCheck {
  isAccessible: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  errorDetails?: ExternalLinkError;
  lastChecked: Date;
}

export interface ExternalLinkMetadata {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  isSecure: boolean;
  domain: string;
  platform?: string;
}

/**
 * External Link Service
 * Provides comprehensive external link management functionality
 */
class ExternalLinkService {
  private readonly TIMEOUT_MS = 5000; // 5 seconds timeout for accessibility checks
  private readonly MAX_URL_LENGTH = 2000;
  private readonly TRUSTED_DOMAINS = [
    'discord.gg',
    'discord.com',
    't.me',
    'telegram.me',
    'slack.com',
    'teams.microsoft.com',
    'zoom.us',
    'meet.google.com',
    'facebook.com',
    'fb.com',
    'whatsapp.com',
    'line.me',
    'github.com',
    'gitlab.com',
    'youtube.com',
    'youtu.be',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'instagram.com'
  ];

  /**
   * Validate URL format and security
   * Requirements: 4.4 - URL format validation
   */
  validateUrl(url: string): ExternalLinkValidationResult {
    try {
      // Basic input validation
      if (!url || typeof url !== 'string') {
        return {
          isValid: false,
          error: 'URL is required and must be a string'
        };
      }

      const trimmedUrl = url.trim();
      if (trimmedUrl.length === 0) {
        return {
          isValid: false,
          error: 'URL cannot be empty'
        };
      }

      if (trimmedUrl.length > this.MAX_URL_LENGTH) {
        return {
          isValid: false,
          error: `URL cannot exceed ${this.MAX_URL_LENGTH} characters`
        };
      }

      // URL format validation
      let urlObj: URL;
      try {
        // Add protocol if missing, but only if it looks like a domain
        let urlWithProtocol: string;
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          urlWithProtocol = trimmedUrl;
        } else {
          // Basic domain validation before adding protocol
          if (!trimmedUrl.includes('.') || trimmedUrl.includes(' ') || trimmedUrl.length < 3) {
            return {
              isValid: false,
              error: 'Invalid URL format'
            };
          }
          urlWithProtocol = `https://${trimmedUrl}`;
        }
        
        urlObj = new URL(urlWithProtocol);
        
        // Additional validation for hostname
        if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes('.')) {
          return {
            isValid: false,
            error: 'Invalid URL format - hostname must be a valid domain'
          };
        }
      } catch (error) {
        return {
          isValid: false,
          error: 'Invalid URL format'
        };
      }

      // Protocol validation
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: 'Only HTTP and HTTPS protocols are allowed'
        };
      }

      // Security checks
      const warnings: string[] = [];
      const hostname = urlObj.hostname.toLowerCase();

      // Check for suspicious patterns
      if (this.containsSuspiciousPatterns(trimmedUrl)) {
        return {
          isValid: false,
          error: 'URL contains suspicious patterns and may be unsafe'
        };
      }

      // HTTPS preference for unknown domains
      const isTrustedDomain = this.TRUSTED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );

      if (!isTrustedDomain && urlObj.protocol === 'http:') {
        warnings.push('HTTP links from unknown domains may be less secure. HTTPS is recommended.');
      }

      // IP address check
      if (this.isIpAddress(hostname)) {
        warnings.push('Direct IP addresses may be less reliable than domain names.');
      }

      return {
        isValid: true,
        sanitizedUrl: urlObj.toString(),
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error('Error validating URL:', error);
      return {
        isValid: false,
        error: 'Failed to validate URL'
      };
    }
  }

  /**
   * Check if external link is accessible
   * Requirements: 4.4 - External link accessibility check
   */
  async checkAccessibility(url: string): Promise<ExternalLinkAccessibilityCheck> {
    const startTime = Date.now();
    
    try {
      // First validate the URL
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        return {
          isAccessible: false,
          error: validation.error || 'Invalid URL',
          lastChecked: new Date()
        };
      }

      const sanitizedUrl = validation.sanitizedUrl!;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        // Use HEAD request to check accessibility without downloading content
        const response = await fetch(sanitizedUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'PeerLearningHub-LinkChecker/1.0'
          }
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            isAccessible: true,
            statusCode: response.status,
            responseTime,
            lastChecked: new Date()
          };
        } else {
          const errorDetails = externalLinkErrorHandler.handleAccessibilityError(
            response.status, 
            response.statusText, 
            sanitizedUrl
          );
          externalLinkErrorHandler.logError(errorDetails);
          
          return {
            isAccessible: false,
            statusCode: response.status,
            responseTime,
            error: errorDetails.userMessage,
            errorDetails,
            lastChecked: new Date()
          };
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        const errorDetails = externalLinkErrorHandler.handleError(fetchError, sanitizedUrl);
        externalLinkErrorHandler.logError(errorDetails);
        
        return {
          isAccessible: false,
          error: errorDetails.userMessage,
          errorDetails,
          responseTime: Date.now() - startTime,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      const errorDetails = externalLinkErrorHandler.handleError(error, url);
      externalLinkErrorHandler.logError(errorDetails);
      
      return {
        isAccessible: false,
        error: errorDetails.userMessage,
        errorDetails,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Extract metadata from external link
   * Requirements: 4.2 - External link metadata extraction
   */
  async extractMetadata(url: string): Promise<ExternalLinkMetadata> {
    try {
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid URL');
      }

      const sanitizedUrl = validation.sanitizedUrl!;
      const urlObj = new URL(sanitizedUrl);
      const hostname = urlObj.hostname.toLowerCase();

      // Detect platform based on domain
      const platform = this.detectPlatform(hostname);

      const metadata: ExternalLinkMetadata = {
        url: sanitizedUrl,
        isSecure: urlObj.protocol === 'https:',
        domain: hostname,
        platform
      };

      // Try to fetch basic metadata (with timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const response = await fetch(sanitizedUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'PeerLearningHub-LinkChecker/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            const html = await response.text();
            
            // Extract title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
              metadata.title = titleMatch[1].trim();
            }

            // Extract description from meta tags
            const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
                             html.match(/<meta[^>]*content=["\']([^"']+)["\'][^>]*name=["\']description["\'][^>]*>/i);
            if (descMatch) {
              metadata.description = descMatch[1].trim();
            }

            // Extract favicon
            const faviconMatch = html.match(/<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"']+)["\'][^>]*>/i) ||
                                html.match(/<link[^>]*href=["\']([^"']+)["\'][^>]*rel=["\'](?:shortcut )?icon["\'][^>]*>/i);
            if (faviconMatch) {
              const faviconUrl = faviconMatch[1];
              metadata.favicon = faviconUrl.startsWith('http') ? faviconUrl : new URL(faviconUrl, sanitizedUrl).toString();
            }
          }
        }
      } catch (error) {
        // Metadata extraction failed, but we still have basic info
        console.warn('Failed to extract metadata:', error);
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }

  /**
   * Open external link in new tab/window safely
   * Requirements: 4.1, 4.2 - New tab/window opening functionality
   */
  openExternalLink(url: string, target: '_blank' | '_self' = '_blank'): boolean {
    try {
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        console.error('Cannot open invalid URL:', validation.error);
        return false;
      }

      const sanitizedUrl = validation.sanitizedUrl!;

      if (typeof window !== 'undefined') {
        // Browser environment
        const newWindow = window.open(sanitizedUrl, target, 'noopener,noreferrer');
        if (!newWindow) {
          console.error('Failed to open link - popup blocked or other issue');
          return false;
        }
        return true;
      } else {
        // React Native environment
        // This would need to be implemented with Linking API
        console.warn('openExternalLink called in non-browser environment');
        return false;
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      return false;
    }
  }

  /**
   * Create a safe external link component props
   * Requirements: 4.1, 4.2 - Safe external link handling
   */
  createSafeLinkProps(url: string): {
    href: string;
    target: string;
    rel: string;
    onClick?: (event: Event) => void;
  } | null {
    const validation = this.validateUrl(url);
    if (!validation.isValid) {
      return null;
    }

    const sanitizedUrl = validation.sanitizedUrl!;

    return {
      href: sanitizedUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      onClick: (event: Event) => {
        // Additional security check before opening
        event.preventDefault();
        this.openExternalLink(sanitizedUrl);
      }
    };
  }

  /**
   * Batch validate multiple URLs
   */
  validateMultipleUrls(urls: string[]): ExternalLinkValidationResult[] {
    return urls.map(url => this.validateUrl(url));
  }

  /**
   * Get user-friendly error message for failed operations
   * Requirements: 4.3 - User-friendly error messages
   */
  getErrorMessage(error: any, url?: string, context?: string, language: 'en' | 'ja' = 'en'): string {
    const errorDetails = externalLinkErrorHandler.handleError(error, url, { language, context: context as any });
    return externalLinkErrorHandler.getUserMessage(errorDetails, context);
  }

  /**
   * Check if an error is recoverable (user can retry)
   * Requirements: 4.3 - Error recovery guidance
   */
  isErrorRecoverable(error: any, url?: string): boolean {
    const errorDetails = externalLinkErrorHandler.handleError(error, url);
    return externalLinkErrorHandler.isRecoverable(errorDetails);
  }

  /**
   * Get retry suggestion for recoverable errors
   * Requirements: 4.3 - Error recovery guidance
   */
  getRetrySuggestion(error: any, url?: string, language: 'en' | 'ja' = 'en'): string | null {
    const errorDetails = externalLinkErrorHandler.handleError(error, url);
    return externalLinkErrorHandler.getRetrySuggestion(errorDetails, language);
  }

  /**
   * Check if string contains suspicious patterns
   */
  private containsSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /<script/i,
      /onclick/i,
      /onerror/i,
      /onload/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if hostname is an IP address
   */
  private isIpAddress(hostname: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
    
    return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
  }

  /**
   * Detect platform based on domain
   */
  private detectPlatform(hostname: string): string | undefined {
    const platformMap: { [key: string]: string } = {
      'discord.gg': 'Discord',
      'discord.com': 'Discord',
      't.me': 'Telegram',
      'telegram.me': 'Telegram',
      'slack.com': 'Slack',
      'teams.microsoft.com': 'Microsoft Teams',
      'zoom.us': 'Zoom',
      'meet.google.com': 'Google Meet',
      'facebook.com': 'Facebook',
      'fb.com': 'Facebook',
      'whatsapp.com': 'WhatsApp',
      'line.me': 'LINE',
      'github.com': 'GitHub',
      'gitlab.com': 'GitLab',
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'twitter.com': 'Twitter',
      'x.com': 'X (Twitter)',
      'linkedin.com': 'LinkedIn',
      'instagram.com': 'Instagram'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return platform;
      }
    }

    return undefined;
  }
}

// Export singleton instance
export const externalLinkService = new ExternalLinkService();
export default externalLinkService;