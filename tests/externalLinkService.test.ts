import { externalLinkService } from '../services/externalLinkService';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock window.open for testing
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn()
});

describe('ExternalLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('validateUrl', () => {
    it('should validate valid HTTPS URLs', () => {
      const result = externalLinkService.validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
      expect(result.error).toBeUndefined();
    });

    it('should validate valid HTTP URLs with warnings for unknown domains', () => {
      const result = externalLinkService.validateUrl('http://unknown-domain.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('HTTP links from unknown domains may be less secure. HTTPS is recommended.');
    });

    it('should add HTTPS protocol to URLs without protocol', () => {
      const result = externalLinkService.validateUrl('example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
    });

    it('should validate trusted domains', () => {
      const trustedUrls = [
        'https://discord.gg/abc123',
        'https://t.me/testgroup',
        'https://github.com/user/repo',
        'https://youtube.com/watch?v=123'
      ];

      trustedUrls.forEach(url => {
        const result = externalLinkService.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty or invalid URLs', () => {
      const invalidUrls = [
        '',
        '   ',
        'not-a-url',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com'
      ];

      invalidUrls.forEach(url => {
        const result = externalLinkService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = externalLinkService.validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should detect suspicious patterns', () => {
      const suspiciousUrls = [
        'https://example.com/<script>alert("xss")</script>',
        'https://example.com/onclick=alert("xss")',
        'javascript:alert("xss")'
      ];

      suspiciousUrls.forEach(url => {
        const result = externalLinkService.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious patterns');
      });
    });

    it('should warn about IP addresses', () => {
      const result = externalLinkService.validateUrl('https://192.168.1.1');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Direct IP addresses may be less reliable than domain names.');
    });

    it('should handle non-string inputs', () => {
      const result = externalLinkService.validateUrl(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('checkAccessibility', () => {
    it('should return accessible for successful HEAD request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await externalLinkService.checkAccessibility('https://example.com');
      
      expect(result.isAccessible).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.responseTime).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/', {
        method: 'HEAD',
        signal: expect.any(AbortSignal),
        headers: {
          'User-Agent': 'PeerLearningHub-LinkChecker/1.0'
        }
      });
    });

    it('should return not accessible for failed requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const result = await externalLinkService.checkAccessibility('https://example.com');
      
      expect(result.isAccessible).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toContain('HTTP 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await externalLinkService.checkAccessibility('https://example.com');
      
      expect(result.isAccessible).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle timeout', async () => {
      // Mock a request that never resolves to simulate timeout
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      const result = await externalLinkService.checkAccessibility('https://example.com');
      
      expect(result.isAccessible).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should reject invalid URLs', async () => {
      const result = await externalLinkService.checkAccessibility('invalid-url');
      
      expect(result.isAccessible).toBe(false);
      expect(result.error).toContain('Invalid URL');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from HTML response', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="This is a test page">
            <link rel="icon" href="/favicon.ico">
          </head>
          <body>Content</body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/html' : null
        },
        text: () => Promise.resolve(mockHtml)
      } as any);

      const result = await externalLinkService.extractMetadata('https://example.com');
      
      expect(result.url).toBe('https://example.com/');
      expect(result.title).toBe('Test Page');
      expect(result.description).toBe('This is a test page');
      expect(result.favicon).toBe('https://example.com/favicon.ico');
      expect(result.isSecure).toBe(true);
      expect(result.domain).toBe('example.com');
    });

    it('should detect platform from domain', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error')); // Metadata fetch fails, but basic info should work

      const result = await externalLinkService.extractMetadata('https://discord.gg/abc123');
      
      expect(result.platform).toBe('Discord');
      expect(result.domain).toBe('discord.gg');
    });

    it('should handle non-HTML responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        }
      } as any);

      const result = await externalLinkService.extractMetadata('https://api.example.com');
      
      expect(result.url).toBe('https://api.example.com/');
      expect(result.title).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('should handle metadata extraction failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await externalLinkService.extractMetadata('https://example.com');
      
      expect(result.url).toBe('https://example.com/');
      expect(result.domain).toBe('example.com');
      expect(result.isSecure).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      await expect(externalLinkService.extractMetadata('invalid-url'))
        .rejects.toThrow('Failed to extract metadata');
    });
  });

  describe('openExternalLink', () => {
    it('should open valid URLs in new window', () => {
      const mockOpen = window.open as jest.Mock;
      mockOpen.mockReturnValueOnce({} as Window);

      const result = externalLinkService.openExternalLink('https://example.com');
      
      expect(result).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');
    });

    it('should handle popup blocking', () => {
      const mockOpen = window.open as jest.Mock;
      mockOpen.mockReturnValueOnce(null); // Simulates popup blocked

      const result = externalLinkService.openExternalLink('https://example.com');
      
      expect(result).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const result = externalLinkService.openExternalLink('invalid-url');
      
      expect(result).toBe(false);
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should support different targets', () => {
      const mockOpen = window.open as jest.Mock;
      mockOpen.mockReturnValueOnce({} as Window);

      externalLinkService.openExternalLink('https://example.com', '_self');
      
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/', '_self', 'noopener,noreferrer');
    });
  });

  describe('createSafeLinkProps', () => {
    it('should create safe link props for valid URLs', () => {
      const props = externalLinkService.createSafeLinkProps('https://example.com');
      
      expect(props).not.toBeNull();
      expect(props!.href).toBe('https://example.com/');
      expect(props!.target).toBe('_blank');
      expect(props!.rel).toBe('noopener noreferrer');
      expect(props!.onClick).toBeDefined();
    });

    it('should return null for invalid URLs', () => {
      const props = externalLinkService.createSafeLinkProps('invalid-url');
      
      expect(props).toBeNull();
    });

    it('should handle click events safely', () => {
      const props = externalLinkService.createSafeLinkProps('https://example.com');
      const mockEvent = {
        preventDefault: jest.fn()
      } as any;

      const mockOpen = window.open as jest.Mock;
      mockOpen.mockReturnValueOnce({} as Window);

      props!.onClick!(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');
    });
  });

  describe('validateMultipleUrls', () => {
    it('should validate multiple URLs', () => {
      const urls = [
        'https://example.com',
        'invalid-url',
        'https://discord.gg/abc123'
      ];

      const results = externalLinkService.validateMultipleUrls(urls);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });

    it('should handle empty array', () => {
      const results = externalLinkService.validateMultipleUrls([]);
      
      expect(results).toHaveLength(0);
    });
  });
});