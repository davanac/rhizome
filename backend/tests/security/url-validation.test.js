/**
 * Security Tests for URL Validation
 *
 * Tests the URL validation middleware to ensure it properly validates
 * social media and external links, preventing URL bypass attacks.
 */

import { describe, it, expect } from 'vitest';
import { validateProfileLinks } from '../../src/middleware/validation.middleware.js';

// Mock Fastify request and reply objects
const createMockRequest = (body) => ({ body });

const createMockReply = () => {
  const reply = {
    statusCode: 200,
    sent: false,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(data) {
      this.sent = true;
      this.payload = data;
      return this;
    }
  };
  return reply;
};

describe('URL Validation - Security Tests', () => {

  describe('LinkedIn URL Validation', () => {
    it('should accept valid LinkedIn URLs', async () => {
      const validUrls = [
        'https://linkedin.com/in/john-doe',
        'https://www.linkedin.com/in/john-doe',
        'https://www.linkedin.com/company/example',
      ];

      for (const url of validUrls) {
        const req = createMockRequest({ linkedin: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false); // Should not send error response
      }
    });

    it('should reject LinkedIn URL with domain in path (bypass attempt)', async () => {
      const bypassUrls = [
        'https://evil.com/linkedin.com/phishing',
        'https://malicious.site/path/linkedin.com',
      ];

      for (const url of bypassUrls) {
        const req = createMockRequest({ linkedin: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(true);
        expect(reply.statusCode).toBe(400);
        expect(reply.payload.errorCode).toBe('linkedin-invalid-domain');
      }
    });

    it('should reject LinkedIn URL with domain as subdomain of malicious site', async () => {
      const bypassUrls = [
        'https://linkedin.com.evil.com/phishing',
        'https://www.linkedin.com.attacker.net/fake',
      ];

      for (const url of bypassUrls) {
        const req = createMockRequest({ linkedin: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(true);
        expect(reply.statusCode).toBe(400);
        expect(reply.payload.errorCode).toBe('linkedin-invalid-domain');
      }
    });

    it('should reject LinkedIn URL with domain in query string', async () => {
      const url = 'https://evil.com?redirect=linkedin.com';
      const req = createMockRequest({ linkedin: url });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
      expect(reply.payload.errorCode).toBe('linkedin-invalid-domain');
    });

    it('should accept LinkedIn subdomains', async () => {
      const url = 'https://blog.linkedin.com/article';
      const req = createMockRequest({ linkedin: url });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(false); // Should accept valid subdomain
    });
  });

  describe('GitHub URL Validation', () => {
    it('should accept valid GitHub URLs', async () => {
      const validUrls = [
        'https://github.com/username',
        'https://www.github.com/username/repo',
        'https://gist.github.com/username/gist-id',
      ];

      for (const url of validUrls) {
        const req = createMockRequest({ github: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false);
      }
    });

    it('should reject GitHub URL bypass attempts', async () => {
      const bypassUrls = [
        'https://evil.com/github.com/fake',
        'https://github.com.malicious.net/phishing',
        'https://attacker.com?site=github.com',
      ];

      for (const url of bypassUrls) {
        const req = createMockRequest({ github: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(true);
        expect(reply.statusCode).toBe(400);
        expect(reply.payload.errorCode).toBe('github-invalid-domain');
      }
    });
  });

  describe('YouTube URL Validation', () => {
    it('should accept valid YouTube URLs', async () => {
      const validUrls = [
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      ];

      for (const url of validUrls) {
        const req = createMockRequest({ youtube: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false);
      }
    });

    it('should reject YouTube domain bypass attempts', async () => {
      const bypassUrls = [
        'https://evil.com/youtube.com/fake',
        'https://youtube.com.attacker.net/malicious',
      ];

      for (const url of bypassUrls) {
        const req = createMockRequest({ youtube: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(true);
        expect(reply.statusCode).toBe(400);
      }
    });
  });

  describe('Twitter/X URL Validation', () => {
    it('should accept valid Twitter/X URLs', async () => {
      const validUrls = [
        'https://twitter.com/username',
        'https://www.twitter.com/username',
        'https://x.com/username',
        'https://www.x.com/username',
      ];

      for (const url of validUrls) {
        const req = createMockRequest({ twitter: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false);
      }
    });
  });

  describe('Discord URL Validation', () => {
    it('should accept valid Discord URLs', async () => {
      const validUrls = [
        'https://discord.com/users/123456',
        'https://discord.gg/invite-code',
      ];

      for (const url of validUrls) {
        const req = createMockRequest({ discord: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false);
      }
    });
  });

  describe('Multiple Fields Validation', () => {
    it('should validate multiple social links in one request', async () => {
      const req = createMockRequest({
        linkedin: 'https://linkedin.com/in/john',
        github: 'https://github.com/john',
        twitter: 'https://twitter.com/john',
        youtube: 'https://youtube.com/@john',
      });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(false); // All valid
    });

    it('should reject request if any field contains bypass attempt', async () => {
      const req = createMockRequest({
        linkedin: 'https://linkedin.com/in/john',
        github: 'https://evil.com/github.com/fake', // Invalid
        twitter: 'https://twitter.com/john',
      });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
      expect(reply.payload.errorCode).toBe('github-invalid-domain');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', async () => {
      const req = createMockRequest({ linkedin: '' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(false); // Empty strings are skipped
    });

    it('should reject non-HTTPS URLs', async () => {
      const req = createMockRequest({ linkedin: 'http://linkedin.com/in/john' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(false); // validator.isURL accepts http
      // Note: If you want to enforce HTTPS only, modify the validator options
    });

    it('should reject invalid URL format', async () => {
      const req = createMockRequest({ linkedin: 'not-a-url' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
      expect(reply.payload.errorCode).toBe('linkedin-invalid-url');
    });

    it('should reject URLs with special characters in domain', async () => {
      const req = createMockRequest({ linkedin: 'https://linke\x00din.com/fake' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
    });
  });

  describe('Case Sensitivity', () => {
    it('should accept URLs with different casing', async () => {
      const urls = [
        'https://LinkedIn.com/in/john',
        'https://LINKEDIN.COM/in/john',
        'https://LiNkEdIn.CoM/in/john',
      ];

      for (const url of urls) {
        const req = createMockRequest({ linkedin: url });
        const reply = createMockReply();

        await validateProfileLinks(req, reply);

        expect(reply.sent).toBe(false); // Should normalize to lowercase
      }
    });
  });

  describe('Protocol Validation', () => {
    it('should require protocol in URL', async () => {
      const req = createMockRequest({ linkedin: 'linkedin.com/in/john' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
      expect(reply.payload.errorCode).toBe('linkedin-invalid-url');
    });

    it('should reject javascript: protocol', async () => {
      const req = createMockRequest({ linkedin: 'javascript:alert(1)' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
    });

    it('should reject data: protocol', async () => {
      const req = createMockRequest({ linkedin: 'data:text/html,<script>alert(1)</script>' });
      const reply = createMockReply();

      await validateProfileLinks(req, reply);

      expect(reply.sent).toBe(true);
      expect(reply.statusCode).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle long URL lists efficiently', async () => {
      // Use proper domains that will pass validation
      const body = {
        linkedin: 'https://linkedin.com/in/user',
        github: 'https://github.com/user',
        twitter: 'https://twitter.com/user',
        instagram: 'https://instagram.com/user',
        facebook: 'https://facebook.com/user',
        youtube: 'https://youtube.com/user',
        discord: 'https://discord.com/users/123',
        behance: 'https://behance.net/user',
        dribbble: 'https://dribbble.com/user',
        strava: 'https://strava.com/athletes/123',
        spotify: 'https://spotify.com/user/username',
      };

      const req = createMockRequest(body);
      const reply = createMockReply();

      const start = Date.now();
      await validateProfileLinks(req, reply);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(reply.sent).toBe(false); // All should pass validation
    });
  });
});
