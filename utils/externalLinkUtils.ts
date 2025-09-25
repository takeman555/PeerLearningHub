/**
 * External Link Utilities
 * Helper functions for handling external links in UI components
 * Requirements: 4.1, 4.2, 4.3, 4.4 - External link handling in UI
 */

import { externalLinkService } from '../services/externalLinkService';
import { Alert } from 'react-native';

export interface ExternalLinkButtonProps {
  url: string;
  title?: string;
  onError?: (error: string) => void;
  showConfirmation?: boolean;
  language?: 'en' | 'ja';
}

/**
 * Safely open external link with error handling
 * Requirements: 4.1, 4.2 - New tab/window opening with error handling
 */
export function openExternalLinkSafely(props: ExternalLinkButtonProps): void {
  const { url, title, onError, showConfirmation = true, language = 'en' } = props;

  try {
    // Validate URL first
    const validation = externalLinkService.validateUrl(url);
    if (!validation.isValid) {
      const errorMessage = externalLinkService.getErrorMessage(
        { message: validation.error },
        url,
        'link_validation',
        language
      );
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert(
          language === 'ja' ? 'エラー' : 'Error',
          errorMessage,
          [{ text: language === 'ja' ? 'OK' : 'OK' }]
        );
      }
      return;
    }

    const sanitizedUrl = validation.sanitizedUrl!;

    // Show confirmation if requested
    if (showConfirmation) {
      const confirmMessage = language === 'ja' 
        ? `外部サイトを開きます:\n${sanitizedUrl}\n\n続行しますか？`
        : `Opening external site:\n${sanitizedUrl}\n\nContinue?`;
      
      Alert.alert(
        language === 'ja' ? '外部リンク' : 'External Link',
        confirmMessage,
        [
          {
            text: language === 'ja' ? 'キャンセル' : 'Cancel',
            style: 'cancel'
          },
          {
            text: language === 'ja' ? '開く' : 'Open',
            onPress: () => {
              const success = externalLinkService.openExternalLink(sanitizedUrl);
              if (!success && onError) {
                onError(language === 'ja' 
                  ? 'リンクを開けませんでした。ポップアップがブロックされている可能性があります。'
                  : 'Failed to open link. Popup may be blocked.'
                );
              }
            }
          }
        ]
      );
    } else {
      const success = externalLinkService.openExternalLink(sanitizedUrl);
      if (!success && onError) {
        onError(language === 'ja' 
          ? 'リンクを開けませんでした。ポップアップがブロックされている可能性があります。'
          : 'Failed to open link. Popup may be blocked.'
        );
      }
    }
  } catch (error: any) {
    const errorMessage = externalLinkService.getErrorMessage(error, url, 'link_validation', language);
    
    if (onError) {
      onError(errorMessage);
    } else {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        errorMessage,
        [{ text: language === 'ja' ? 'OK' : 'OK' }]
      );
    }
  }
}

/**
 * Get platform icon name for external link
 * Requirements: 4.2 - Platform detection for UI
 */
export function getPlatformIcon(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const iconMap: { [key: string]: string } = {
      'discord.gg': 'logo-discord',
      'discord.com': 'logo-discord',
      't.me': 'paper-plane',
      'telegram.me': 'paper-plane',
      'slack.com': 'logo-slack',
      'teams.microsoft.com': 'people',
      'zoom.us': 'videocam',
      'meet.google.com': 'videocam',
      'facebook.com': 'logo-facebook',
      'fb.com': 'logo-facebook',
      'whatsapp.com': 'logo-whatsapp',
      'line.me': 'chatbubbles',
      'github.com': 'logo-github',
      'gitlab.com': 'git-branch',
      'youtube.com': 'logo-youtube',
      'youtu.be': 'logo-youtube',
      'twitter.com': 'logo-twitter',
      'x.com': 'logo-twitter',
      'linkedin.com': 'logo-linkedin',
      'instagram.com': 'logo-instagram'
    };

    for (const [domain, icon] of Object.entries(iconMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return icon;
      }
    }

    return 'link'; // Default icon
  } catch (error) {
    return 'link';
  }
}

/**
 * Get platform display name for external link
 * Requirements: 4.2 - Platform detection for UI
 */
export function getPlatformDisplayName(url: string, language: 'en' | 'ja' = 'en'): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const platformMap: { [key: string]: { en: string; ja: string } } = {
      'discord.gg': { en: 'Discord', ja: 'Discord' },
      'discord.com': { en: 'Discord', ja: 'Discord' },
      't.me': { en: 'Telegram', ja: 'Telegram' },
      'telegram.me': { en: 'Telegram', ja: 'Telegram' },
      'slack.com': { en: 'Slack', ja: 'Slack' },
      'teams.microsoft.com': { en: 'Microsoft Teams', ja: 'Microsoft Teams' },
      'zoom.us': { en: 'Zoom', ja: 'Zoom' },
      'meet.google.com': { en: 'Google Meet', ja: 'Google Meet' },
      'facebook.com': { en: 'Facebook', ja: 'Facebook' },
      'fb.com': { en: 'Facebook', ja: 'Facebook' },
      'whatsapp.com': { en: 'WhatsApp', ja: 'WhatsApp' },
      'line.me': { en: 'LINE', ja: 'LINE' },
      'github.com': { en: 'GitHub', ja: 'GitHub' },
      'gitlab.com': { en: 'GitLab', ja: 'GitLab' },
      'youtube.com': { en: 'YouTube', ja: 'YouTube' },
      'youtu.be': { en: 'YouTube', ja: 'YouTube' },
      'twitter.com': { en: 'Twitter', ja: 'Twitter' },
      'x.com': { en: 'X (Twitter)', ja: 'X (Twitter)' },
      'linkedin.com': { en: 'LinkedIn', ja: 'LinkedIn' },
      'instagram.com': { en: 'Instagram', ja: 'Instagram' }
    };

    for (const [domain, names] of Object.entries(platformMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return names[language];
      }
    }

    return language === 'ja' ? '外部サイト' : 'External Site';
  } catch (error) {
    return language === 'ja' ? '外部サイト' : 'External Site';
  }
}

/**
 * Validate external link input with real-time feedback
 * Requirements: 4.4 - Real-time URL validation
 */
export function validateExternalLinkInput(
  url: string,
  language: 'en' | 'ja' = 'en'
): {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
} {
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      error: language === 'ja' ? 'URLを入力してください' : 'Please enter a URL'
    };
  }

  const validation = externalLinkService.validateUrl(url);
  
  if (!validation.isValid) {
    const errorMessage = externalLinkService.getErrorMessage(
      { message: validation.error },
      url,
      'link_validation',
      language
    );
    
    return {
      isValid: false,
      error: errorMessage
    };
  }

  const result: any = {
    isValid: true
  };

  // Add warnings if present
  if (validation.warnings && validation.warnings.length > 0) {
    result.warning = validation.warnings[0];
  }

  // Add suggestions for improvement
  if (url !== validation.sanitizedUrl) {
    result.suggestion = language === 'ja' 
      ? `推奨: ${validation.sanitizedUrl}`
      : `Suggested: ${validation.sanitizedUrl}`;
  }

  return result;
}

/**
 * Format external link for display
 * Requirements: 4.2 - External link display formatting
 */
export function formatExternalLinkForDisplay(url: string, maxLength: number = 50): string {
  try {
    const urlObj = new URL(url);
    let displayUrl = urlObj.hostname + urlObj.pathname;
    
    if (urlObj.search) {
      displayUrl += urlObj.search;
    }
    
    if (displayUrl.length > maxLength) {
      displayUrl = displayUrl.substring(0, maxLength - 3) + '...';
    }
    
    return displayUrl;
  } catch (error) {
    // If URL parsing fails, just truncate the original
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
}

/**
 * Check if external link is accessible (with caching)
 * Requirements: 4.4 - External link accessibility check
 */
const accessibilityCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function checkExternalLinkAccessibility(
  url: string,
  useCache: boolean = true
): Promise<{
  isAccessible: boolean;
  error?: string;
  cached?: boolean;
}> {
  if (useCache && accessibilityCache.has(url)) {
    const cached = accessibilityCache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return { ...cached.result, cached: true };
    }
  }

  try {
    const result = await externalLinkService.checkAccessibility(url);
    const response = {
      isAccessible: result.isAccessible,
      error: result.error
    };

    if (useCache) {
      accessibilityCache.set(url, {
        result: response,
        timestamp: Date.now()
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = externalLinkService.getErrorMessage(error, url, 'accessibility_check');
    return {
      isAccessible: false,
      error: errorMessage
    };
  }
}