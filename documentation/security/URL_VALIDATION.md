# URL Validation Security Documentation

## Overview

This document describes the URL validation security measures implemented in Rhizome to prevent URL bypass attacks and phishing attempts. The system validates social media profile URLs and external link embeds using proper hostname parsing instead of unsafe substring matching.

## Security Upgrade (v2.0)

### What Changed

**Before (VULNERABLE):**
```javascript
// ❌ INSECURE - Can be bypassed
if (url.includes('linkedin.com')) {
  // Allow URL
}
```

**Bypass Examples:**
- `https://evil.com/linkedin.com/phishing` ✅ Would pass (domain in path)
- `https://linkedin.com.attacker.net/` ✅ Would pass (domain as prefix)
- `https://evil.com?redirect=linkedin.com` ✅ Would pass (domain in query)

**After (SECURE):**
```javascript
// ✅ SECURE - Validates actual hostname
const parsedUrl = new URL(url);
const hostname = parsedUrl.hostname.toLowerCase();

if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) {
  // Allow URL
}
```

**Protection:**
- ❌ Rejects domain in path
- ❌ Rejects domain as subdomain of malicious site
- ❌ Rejects domain in query parameters
- ✅ Accepts legitimate subdomains (e.g., `blog.linkedin.com`)

## Affected Components

### Backend
- **File**: `backend/src/middleware/validation.middleware.js`
- **Function**: `validateProfileLinks()`
- **Platforms**: LinkedIn, GitHub, Twitter, Instagram, Facebook, YouTube, Discord, Behance, Dribbble, Strava, Spotify

### Frontend
- **File**: `front/src/components/blocks/LinkPreviewCard.tsx`
- **Function**: `isValidDomain()`
- **Embeds**: YouTube, Instagram, TikTok

## Technical Details

### Validation Algorithm

```javascript
/**
 * Validates that a URL belongs to an allowed domain
 * @param {string} url - URL to validate
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {boolean} True if domain is valid
 */
const isValidDomain = (url, allowedDomains) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return allowedDomains.some(domain => {
      // Exact match: hostname === 'linkedin.com'
      // Subdomain match: hostname === 'blog.linkedin.com'
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  } catch {
    return false; // Invalid URL format
  }
};
```

### Allowed Domains by Platform

| Platform | Allowed Domains |
|----------|----------------|
| LinkedIn | `linkedin.com`, `www.linkedin.com` |
| GitHub | `github.com`, `www.github.com`, `gist.github.com` |
| Twitter | `twitter.com`, `www.twitter.com`, `x.com`, `www.x.com` |
| Instagram | `instagram.com`, `www.instagram.com` |
| Facebook | `facebook.com`, `www.facebook.com`, `fb.com`, `www.fb.com` |
| YouTube | `youtube.com`, `www.youtube.com`, `youtu.be`, `m.youtube.com` |
| TikTok | `tiktok.com`, `www.tiktok.com`, `m.tiktok.com` |
| Discord | `discord.com`, `www.discord.com`, `discord.gg` |
| Behance | `behance.net`, `www.behance.net` |
| Dribbble | `dribbble.com`, `www.dribbble.com` |
| Strava | `strava.com`, `www.strava.com` |
| Spotify | `spotify.com`, `www.spotify.com`, `open.spotify.com` |

### Validation Flow

```mermaid
graph TD
    A[Receive URL] --> B{Valid URL format?}
    B -->|No| C[Reject: Invalid URL]
    B -->|Yes| D[Parse URL]
    D --> E[Extract hostname]
    E --> F[Normalize to lowercase]
    F --> G{Hostname in allowed list?}
    G -->|No| H{Subdomain of allowed?}
    H -->|No| I[Reject: Invalid domain]
    H -->|Yes| J[Accept URL]
    G -->|Yes| J
```

## Attack Vectors Prevented

### 1. Path-Based Bypass
**Attack**: `https://evil.com/linkedin.com/phishing`

**Old Method**: ✅ Passes (contains 'linkedin.com')
**New Method**: ❌ Rejected (hostname is 'evil.com')

### 2. Subdomain Spoofing
**Attack**: `https://linkedin.com.attacker.net/fake`

**Old Method**: ✅ Passes (contains 'linkedin.com')
**New Method**: ❌ Rejected (hostname is 'linkedin.com.attacker.net')

### 3. Query Parameter Injection
**Attack**: `https://evil.com?redirect=linkedin.com`

**Old Method**: ✅ Passes (contains 'linkedin.com')
**New Method**: ❌ Rejected (hostname is 'evil.com')

### 4. Homograph Attacks
**Attack**: `https://linkedìn.com/phishing` (note: 'ì' instead of 'i')

**Protection**: URL parsing handles internationalized domain names (IDN) correctly

### 5. Protocol Manipulation
**Attack**: `javascript:alert('xss')`

**Protection**: validator.isURL() only allows `http://` and `https://`

## Usage Examples

### Backend Validation

```javascript
// In your route handler
import { validateProfileLinks } from './middleware/validation.middleware.js';

app.post('/api/profile/update',
  validateProfileLinks, // Middleware validates URLs
  async (req, reply) => {
    // URLs are validated and safe to use
    const { linkedin, github, twitter } = req.body;

    // Save to database...
  }
);
```

### Frontend Validation

```typescript
// In LinkPreviewCard component
const isValidDomain = (url: string, allowedDomains: string[]): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return allowedDomains.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  } catch {
    return false;
  }
};

// Use before creating iframe embed
if (isValidDomain(url, ['youtube.com', 'www.youtube.com', 'youtu.be'])) {
  // Safe to embed YouTube video
  return <iframe src={embedUrl} />;
}
```

## Testing

### Running Tests

```bash
cd backend
npm run test:security
```

### Test Coverage

22 comprehensive tests covering:
- ✅ Valid URLs for all platforms
- ✅ Path-based bypass attempts
- ✅ Subdomain spoofing attacks
- ✅ Query parameter injection
- ✅ Multiple field validation
- ✅ Edge cases (empty strings, case sensitivity)
- ✅ Protocol validation (javascript:, data:)
- ✅ Performance with multiple URLs

### Example Test

```javascript
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
```

## Security Best Practices

### For Developers

1. **Never use `includes()` for domain validation**
   ```javascript
   // ❌ WRONG
   if (url.includes('example.com')) { ... }

   // ✅ CORRECT
   const hostname = new URL(url).hostname;
   if (hostname === 'example.com') { ... }
   ```

2. **Always parse URLs before validation**
   ```javascript
   // ✅ CORRECT
   try {
     const parsedUrl = new URL(url);
     const hostname = parsedUrl.hostname;
     // Validate hostname...
   } catch {
     // Invalid URL format
   }
   ```

3. **Normalize hostnames to lowercase**
   ```javascript
   const hostname = parsedUrl.hostname.toLowerCase();
   ```

4. **Use allowlist, not denylist**
   ```javascript
   // ✅ CORRECT - Only allow specific domains
   const allowed = ['example.com', 'sub.example.com'];

   // ❌ WRONG - Trying to block everything bad
   const blocked = ['evil.com', 'bad.net']; // Incomplete, will miss attacks
   ```

5. **Handle subdomains explicitly**
   ```javascript
   // Allow both exact match and legitimate subdomains
   hostname === domain || hostname.endsWith('.' + domain)
   ```

### For Security Reviewers

When reviewing URL validation code, check for:
- [ ] Uses `new URL()` to parse hostnames
- [ ] Validates hostname, not full URL string
- [ ] Uses allowlist of approved domains
- [ ] Handles subdomains correctly
- [ ] Normalizes to lowercase
- [ ] Has proper error handling
- [ ] Includes security tests with bypass attempts

## Error Handling

### Backend Error Responses

```json
{
  "success": false,
  "message": "linkedin URL must be from linkedin.com domain",
  "errorCode": "linkedin-invalid-domain",
  "errorKey": 400303
}
```

### Frontend Error Handling

Frontend silently skips invalid embeds and falls back to link preview:
```typescript
try {
  if (isValidDomain(url, allowedDomains)) {
    // Render embed
  } else {
    // Fall back to link preview card
  }
} catch (error) {
  console.warn('Error rendering embed:', error);
  return null;
}
```

## Performance

- **URL parsing**: ~0.01ms per URL
- **Validation**: O(n) where n = number of allowed domains (typically < 5)
- **Multiple URLs**: Can validate 10+ URLs in < 1ms

Performance is excellent due to:
- Native `URL()` constructor (fast C++ implementation)
- Simple string comparisons
- No regex (which can be slow)

## Migration Notes

### Backward Compatibility

✅ **No breaking changes** - stricter validation only rejects invalid/malicious URLs

### Impact

- Legitimate social media URLs continue to work
- Malicious bypass attempts now properly rejected
- Users cannot save phishing links in profiles
- Iframe embeds only work for legitimate domains

## Troubleshooting

### Issue: Valid URL rejected

**Cause**: Domain not in allowlist

**Solution**: Add domain to `platformDomains` object
```javascript
const platformDomains = {
  'linkedin': ['linkedin.com', 'www.linkedin.com', 'new-subdomain.linkedin.com'],
  // ...
};
```

### Issue: Subdomain not working

**Cause**: Subdomain validation logic

**Solution**: Check if using correct pattern
```javascript
// This allows any subdomain of linkedin.com:
hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')

// To allow only specific subdomains:
['linkedin.com', 'blog.linkedin.com', 'help.linkedin.com'].includes(hostname)
```

### Issue: Case sensitivity problems

**Cause**: Not normalizing hostname

**Solution**: Always lowercase
```javascript
const hostname = parsedUrl.hostname.toLowerCase();
```

## References

- [OWASP URL Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html#url-validation)
- [MDN: URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [CWE-601: URL Redirection to Untrusted Site](https://cwe.mitre.org/data/definitions/601.html)
- CodeQL Security Audit Report: `results.md` (Issues #2, #3)

## Security Audit Trail

| Date | Issue | Resolution |
|------|-------|------------|
| 2025-10-07 | CodeQL: Incomplete URL substring sanitization (HIGH) | Implemented proper hostname parsing |
| 2025-10-07 | Backend: LinkedIn/GitHub validation bypass | Fixed with URL parsing in middleware |
| 2025-10-07 | Frontend: YouTube/TikTok validation bypass | Fixed with isValidDomain helper |
| 2025-10-07 | No test coverage for URL validation | Added 22 comprehensive security tests |

## Related Issues

- Fixes security audit finding #2 (HIGH severity) - Backend URL validation
- Fixes security audit finding #3 (HIGH severity) - Frontend URL validation
- Prevents phishing attacks via profile links
- Prevents malicious iframe embedding

## Support

For security concerns:
1. Review this documentation
2. Check `results.md` security audit report (Issues #2, #3)
3. Run tests: `npm run test:security`
4. Contact security team for urgent issues
