# Deployment Guide

This guide will help you deploy the Cloudflare Email Worker to your Cloudflare account.

## Prerequisites

1. A Cloudflare account (free or paid)
2. Node.js 18+ installed
3. Wrangler CLI installed (`npm install -g wrangler`)
4. A verified domain in Cloudflare Email Routing

## Step-by-Step Deployment

### 1. Clone and Install

```bash
git clone <repository-url>
cd cloudflareEmail
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with Cloudflare.

### 3. Create R2 Bucket

Create an R2 bucket for storing attachments and images:

```bash
wrangler r2 bucket create email-attachments
```

Note the bucket name for the next step.

### 4. Create D1 Database

Create a D1 database for storing mailing lists:

```bash
wrangler d1 create email_database
```

You'll get output like:
```
✅ Successfully created DB 'email_database'!

[[d1_databases]]
binding = "DB"
database_name = "email_database"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` value.

### 5. Configure wrangler.toml

Update `wrangler.toml` with your values:

```toml
name = "cloudflare-email-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Update with your R2 bucket name
[[r2_buckets]]
binding = "EMAIL_ATTACHMENTS"
bucket_name = "email-attachments"  # Use your bucket name

# Update with your D1 database ID
[[d1_databases]]
binding = "DB"
database_name = "email_database"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Use your database ID

# Update with your verified email address
send_email = [
  {name = "SEB", destination_address = "noreply@yourdomain.com"}
]

[vars]
ALLOWED_ORIGINS = "*"
```

### 6. Set Up Email Routing

#### 6.1 Verify Your Domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Go to **Email Routing**
4. Click **Get started**
5. Follow the steps to verify your domain

#### 6.2 Configure Destination Address

1. In Email Routing, go to **Destination addresses**
2. Add and verify the email address you want to use as the sender
3. Update `wrangler.toml` with this verified address

### 7. Deploy the Worker

```bash
npm run deploy
```

This will:
- Build your TypeScript code
- Upload the worker to Cloudflare
- Configure bindings (R2, D1, Email)

You'll get output like:
```
✨ Built successfully!
📡 Uploading...
✨ Deployment complete!

https://cloudflare-email-worker.<your-subdomain>.workers.dev
```

### 8. Initialize the Database

After deployment, initialize the database tables:

```bash
curl -X POST https://cloudflare-email-worker.<your-subdomain>.workers.dev/api/init
```

You should get:
```json
{"success": true, "message": "Database initialized"}
```

### 9. Test the Deployment

#### Test Health Check
```bash
curl https://cloudflare-email-worker.<your-subdomain>.workers.dev/api
```

Expected response:
```json
{
  "status": "ok",
  "message": "Cloudflare Email Worker API",
  "version": "1.0.0"
}
```

#### Test Mailing List Creation
```bash
curl -X POST https://cloudflare-email-worker.<your-subdomain>.workers.dev/api/lists \
  -H "Content-Type: application/json" \
  -d '{"name": "Test List", "description": "My first mailing list"}'
```

#### Test Email Sending
```bash
curl -X POST https://cloudflare-email-worker.<your-subdomain>.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "your-email@example.com"}],
    "subject": "Test Email",
    "htmlBody": "<h1>Hello!</h1><p>This is a test email from Cloudflare Workers.</p>"
  }'
```

### 10. Access the Web UI

Open your browser and visit:
```
https://cloudflare-email-worker.<your-subdomain>.workers.dev
```

You should see the email management interface.

## Custom Domain Setup (Optional)

To use a custom domain:

### 1. Add Route in wrangler.toml

```toml
routes = [
  { pattern = "email.yourdomain.com", custom_domain = true }
]
```

### 2. Deploy Again

```bash
npm run deploy
```

Cloudflare will automatically:
- Create DNS records
- Provision SSL certificates
- Route traffic to your worker

## Environment Variables and Secrets

### Setting Secrets

For sensitive data like API keys:

```bash
wrangler secret put SECRET_NAME
```

Example:
```bash
wrangler secret put SENDGRID_API_KEY
```

Then access in your code:
```typescript
const apiKey = env.SENDGRID_API_KEY;
```

### Environment-Specific Variables

Update `wrangler.toml` for different environments:

```toml
[env.production]
name = "email-worker-prod"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "email-worker-staging"
vars = { ENVIRONMENT = "staging" }
```

Deploy to specific environment:
```bash
wrangler deploy --env production
```

## Monitoring and Debugging

### View Real-time Logs

```bash
wrangler tail
```

### View Historical Logs

Go to Cloudflare Dashboard → Workers → Your Worker → Logs

### Monitor Metrics

Dashboard shows:
- Request count
- Error rate
- CPU time
- Duration

## Troubleshooting

### Issue: Email not sending

**Solution:**
1. Verify domain is validated in Email Routing
2. Check destination address is verified
3. View logs: `wrangler tail`
4. Test with simple email first

### Issue: Database not found

**Solution:**
1. Verify database ID in `wrangler.toml`
2. Run migration: `curl -X POST .../api/init`
3. Check bindings in Dashboard

### Issue: R2 bucket access denied

**Solution:**
1. Verify bucket name in `wrangler.toml`
2. Check bucket exists: `wrangler r2 bucket list`
3. Verify binding name matches code

### Issue: CORS errors

**Solution:**
1. Check CORS configuration in `src/index.ts`
2. Update allowed origins in `wrangler.toml`
3. Test with simple curl request first

## Updating the Worker

### Update Code

1. Make changes to source files
2. Test locally: `npm run dev`
3. Deploy: `npm run deploy`

### Update Dependencies

```bash
npm update
npm run deploy
```

### Rollback

```bash
wrangler rollback
```

## Cost Estimation

### Free Tier Limits

- **Workers**: 100,000 requests/day
- **D1**: 5 GB storage, 5M reads/day
- **R2**: 10 GB storage, 10M reads/month
- **Email**: 100 emails/day on free plan

### Paid Plan

For higher usage:
- **Workers**: $5/month for 10M requests
- **D1**: Pay-as-you-go beyond free tier
- **R2**: $0.015/GB/month storage
- **Email**: Contact Cloudflare for limits

## Security Best Practices

1. **Add Authentication**
   - Implement API key authentication
   - Use Cloudflare Access for UI protection

2. **Rate Limiting**
   - Add rate limiting to prevent abuse
   - Use Workers Rate Limiting API

3. **Input Validation**
   - Validate all email addresses
   - Sanitize HTML content
   - Check file types and sizes

4. **Monitoring**
   - Set up alerts for errors
   - Monitor unusual traffic patterns
   - Review logs regularly

## Next Steps

1. ✅ Deploy successfully
2. 📧 Send your first email
3. 📋 Create mailing lists
4. 🎨 Customize the UI
5. 🔒 Add authentication
6. 📊 Set up monitoring
7. 🚀 Scale your usage

## Support

For issues and questions:
- Check the [FAQ](README.md#faq)
- View [Cloudflare Docs](https://developers.cloudflare.com/)
- Open an issue on GitHub

## References

- [Wrangler Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Email Workers Guide](https://developers.cloudflare.com/email-routing/email-workers/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
