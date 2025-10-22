# Security Guide

This document outlines security considerations and best practices for the Cloudflare Email Worker.

## Security Features

### 1. Input Validation

All user inputs are validated before processing:

- **Email addresses**: RFC-compliant validation with length limits
- **Subject lines**: Maximum 998 characters
- **HTML content**: Size limits (1MB) and sanitization
- **File names**: Path traversal protection, invalid character filtering
- **File sizes**: Maximum 25MB per file
- **MIME types**: Whitelist of allowed file types

### 2. HTML Sanitization

HTML content is automatically sanitized to prevent:
- Script injection (XSS attacks)
- Event handler injection
- JavaScript URLs

**Note**: For production use, integrate a more robust HTML sanitizer like DOMPurify.

### 3. SQL Injection Protection

All database queries use parameterized statements via D1's prepared statements:

```typescript
// Safe - parameters are properly bound
await db.prepare('SELECT * FROM lists WHERE id = ?').bind(id).first();

// Unsafe - never do this
await db.prepare(`SELECT * FROM lists WHERE id = ${id}`).first();
```

### 4. CORS Configuration

CORS is enabled but should be restricted in production:

```typescript
app.use('/*', cors({
  origin: ['https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

## Recommended Security Enhancements

### 1. Add Authentication

Implement API key authentication:

```typescript
// Middleware for API key authentication
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});
```

Set the API key as a secret:
```bash
wrangler secret put API_KEY
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import { RateLimiter } from '@cloudflare/workers-rate-limiter';

const limiter = new RateLimiter({
  limit: 100,
  window: 60 * 1000, // 1 minute
});

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP');
  
  if (await limiter.isRateLimited(ip)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  await next();
});
```

### 3. Email Verification

Add double opt-in for mailing lists:

```typescript
async function addEmailWithVerification(listId: string, email: string) {
  // Generate verification token
  const token = crypto.randomUUID();
  
  // Store pending verification
  await db.prepare(
    'INSERT INTO pending_verifications (token, list_id, email) VALUES (?, ?, ?)'
  ).bind(token, listId, email).run();
  
  // Send verification email
  await sendVerificationEmail(email, token);
}
```

### 4. Content Security Policy

Add CSP headers to the web interface:

```typescript
app.use('/*', async (c, next) => {
  await next();
  
  c.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:;"
  );
});
```

### 5. Implement Logging and Monitoring

Log important events for security auditing:

```typescript
async function logSecurityEvent(event: string, details: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    details
  }));
}

// Log failed authentication attempts
logSecurityEvent('auth_failed', { ip, apiKey: 'masked' });

// Log bulk email sends
logSecurityEvent('bulk_send', { recipientCount, listId });
```

### 6. Secure File Storage

Add virus scanning for uploaded files (using a third-party service):

```typescript
async function scanFile(buffer: ArrayBuffer): Promise<boolean> {
  // Integrate with a virus scanning API
  // Return true if clean, false if infected
  return true;
}

app.post('/api/files', async (c) => {
  const file = formData.get('file') as File;
  const buffer = await file.arrayBuffer();
  
  if (!await scanFile(buffer)) {
    return c.json({ error: 'File failed security scan' }, 400);
  }
  
  // Continue with upload...
});
```

## Email Security Best Practices

### 1. SPF, DKIM, and DMARC

Ensure your domain has proper email authentication records:

**SPF Record:**
```
v=spf1 include:_spf.mx.cloudflare.net ~all
```

**DKIM**: Configured automatically by Cloudflare Email Routing

**DMARC Record:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 2. Unsubscribe Links

Always include unsubscribe links in bulk emails:

```typescript
function addUnsubscribeLink(htmlBody: string, email: string): string {
  const unsubToken = generateToken(email);
  const unsubLink = `https://yourdomain.com/unsubscribe?token=${unsubToken}`;
  
  return htmlBody + `
    <hr>
    <p style="font-size: 12px; color: #666;">
      <a href="${unsubLink}">Unsubscribe</a> from this list
    </p>
  `;
}
```

### 3. Email Content Guidelines

- Avoid spam trigger words
- Keep HTML clean and simple
- Always provide plain text alternative
- Use proper subject lines
- Include sender information

## Data Protection

### 1. GDPR Compliance

If sending emails to EU residents:

- Get explicit consent before adding to lists
- Allow users to view their data
- Implement right to erasure
- Keep audit logs

```typescript
// Delete user data
async function deleteUserData(email: string) {
  // Remove from all mailing lists
  await db.prepare(
    'DELETE FROM mailing_list_emails WHERE email = ?'
  ).bind(email).run();
  
  // Log deletion
  logSecurityEvent('data_deletion', { email });
}
```

### 2. Data Encryption

Sensitive data should be encrypted:

```typescript
// Encrypt email addresses in database
async function encryptEmail(email: string, key: string): Promise<string> {
  // Use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyData,
    data
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

## Incident Response

### 1. Monitoring

Set up alerts for:
- Failed authentication attempts
- Unusual sending patterns
- API errors
- Rate limit violations

### 2. Response Plan

If a security incident occurs:

1. **Identify**: Detect and assess the incident
2. **Contain**: Limit the damage
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

### 3. Emergency Actions

```bash
# Disable worker immediately
wrangler delete cloudflare-email-worker

# Rotate API keys
wrangler secret put API_KEY

# Review logs
wrangler tail --format json > incident.log
```

## Security Checklist

Before going to production:

- [ ] Add authentication (API keys or OAuth)
- [ ] Implement rate limiting
- [ ] Restrict CORS origins
- [ ] Add input validation to all endpoints
- [ ] Sanitize HTML content
- [ ] Enable logging and monitoring
- [ ] Set up alerts for suspicious activity
- [ ] Add virus scanning for file uploads
- [ ] Implement unsubscribe functionality
- [ ] Configure SPF, DKIM, DMARC
- [ ] Add CAPTCHA for public forms
- [ ] Encrypt sensitive data
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Document security procedures

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security contact directly
3. Provide detailed information
4. Allow reasonable time for fix

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security](https://www.cloudflare.com/security/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Email Security Best Practices](https://emailsecurity.cert.europa.eu/)

## Updates

This security guide should be reviewed and updated regularly as new threats emerge and best practices evolve.

Last updated: 2024-10-22
