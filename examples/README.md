# Examples

This directory contains examples of how to use the Cloudflare Email Worker API.

## Prerequisites

Before running these examples, make sure:
1. You have deployed the worker
2. You have updated `API_URL` in each example to point to your worker
3. The database has been initialized (`POST /api/init`)

## Available Examples

### 1. Send Email (`send-email.js`)

Demonstrates how to send a simple HTML email using the API.

**Features:**
- HTML email content
- Custom sender information
- Recipient with name

**Usage:**
```bash
node send-email.js
```

### 2. Manage Lists (`manage-lists.js`)

Shows how to create and manage mailing lists, add emails, and send bulk emails.

**Features:**
- Create mailing list
- Add multiple emails to list
- Send email to entire list

**Usage:**
```bash
node manage-lists.js
```

### 3. Upload Files (`upload-files.js`)

Demonstrates file upload to R2 and using the uploaded files in emails.

**Features:**
- Upload images to R2
- Embed uploaded images in emails
- Retrieve file URLs

**Usage:**
```bash
node upload-files.js
```

Note: This example requires Node.js with fetch API support (Node 18+) or you can use `node-fetch`.

## Advanced Examples

### Send Email with Attachments

```javascript
const API_URL = 'https://your-worker.workers.dev';

async function sendEmailWithAttachments() {
  // First, upload the attachment
  const formData = new FormData();
  formData.append('file', fileBlob, 'document.pdf');
  
  const uploadResponse = await fetch(`${API_URL}/api/files`, {
    method: 'POST',
    body: formData
  });
  
  const { file } = await uploadResponse.json();
  
  // Then send the email (attachments would need to be fetched from R2 in the worker)
  const response = await fetch(`${API_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: [{ email: 'recipient@example.com' }],
      subject: 'Document Attached',
      htmlBody: `<p>Please find the document attached.</p>
                 <p><a href="${API_URL}${file.url}">Download Document</a></p>`
    })
  });
}
```

### Batch Import Emails to List

```javascript
async function importEmailsFromCSV(listId, csvContent) {
  const lines = csvContent.split('\n');
  const emails = lines.slice(1) // Skip header
    .map(line => line.split(','))
    .filter(parts => parts.length >= 2);
  
  for (const [email, name] of emails) {
    await fetch(`${API_URL}/api/lists/${listId}/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), name: name.trim() })
    });
  }
}
```

### Scheduled Newsletter

```javascript
// This would be in a Cloudflare Worker with Cron Triggers
export default {
  async scheduled(event, env, ctx) {
    const db = new Database(env.DB);
    const emailService = new EmailService(env.SEB);
    
    // Get newsletter list
    const emails = await db.getEmailsFromList('newsletter-list-id');
    
    // Send weekly newsletter
    const result = await emailService.sendBulkEmail(
      emails.map(email => ({ email })),
      'Weekly Newsletter',
      generateNewsletterHTML(),
      { email: 'newsletter@example.com', name: 'Newsletter' }
    );
    
    console.log(`Newsletter sent: ${result.sent} successful, ${result.failed} failed`);
  }
}
```

### Email Template with Dynamic Content

```javascript
async function sendPersonalizedEmail(recipients) {
  for (const recipient of recipients) {
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background: #667eea; color: white; padding: 20px; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hello, ${recipient.name}!</h1>
          </div>
          <div class="content">
            <p>This is a personalized message for you.</p>
            <p>Your account status: ${recipient.status}</p>
            <a href="${recipient.actionUrl}">Take Action</a>
          </div>
        </body>
      </html>
    `;
    
    await fetch(`${API_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [{ email: recipient.email, name: recipient.name }],
        subject: `Update for ${recipient.name}`,
        htmlBody
      })
    });
  }
}
```

## Testing with cURL

### Send a test email
```bash
curl -X POST https://your-worker.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlBody": "<h1>Hello!</h1><p>This is a test.</p>"
  }'
```

### Create a mailing list
```bash
curl -X POST https://your-worker.workers.dev/api/lists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test List",
    "description": "Testing purposes"
  }'
```

### Add email to list
```bash
curl -X POST https://your-worker.workers.dev/api/lists/{list-id}/emails \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Upload a file
```bash
curl -X POST https://your-worker.workers.dev/api/files \
  -F "file=@/path/to/file.jpg"
```

## Error Handling

Always handle errors in production code:

```javascript
async function sendEmailSafely(emailData) {
  try {
    const response = await fetch(`${API_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Email send failed:', data.error);
      // Handle failure (retry, log, alert, etc.)
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Network error:', error);
    // Handle network errors
    return false;
  }
}
```

## Rate Limiting

Be mindful of rate limits when sending bulk emails:

```javascript
async function sendEmailsWithRateLimit(emails, delayMs = 100) {
  for (const email of emails) {
    await sendEmail(email);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
```

## Best Practices

1. **Always validate email addresses** before sending
2. **Use meaningful subject lines** to avoid spam filters
3. **Include unsubscribe links** for bulk emails
4. **Test with small batches** before bulk sending
5. **Monitor error rates** and adjust accordingly
6. **Keep HTML simple** for better compatibility
7. **Provide plain text alternative** when possible
8. **Use proper error handling** in production

## Need Help?

- Check the [main README](../README.md) for API documentation
- Review the [deployment guide](../DEPLOYMENT.md) for setup instructions
- Visit [Cloudflare Docs](https://developers.cloudflare.com/) for platform-specific help
