# Cloudflare Email Worker

A complete email sending system built on Cloudflare Workers with mailing list management, rich text editor, image uploads, and attachment storage.

[中文文档](./README_CN.md) | English

## Features

✅ **Email Sending**
- HTML rich text emails
- Multiple recipients support
- Custom sender information
- Subject and content editing

✅ **Mailing List Management**
- Create and manage mailing lists
- Add/remove email addresses
- Bulk email sending to lists
- List descriptions and categorization

✅ **Rich Text Editor**
- Text formatting (bold, italic, underline)
- Ordered and unordered lists
- Image insertion
- HTML content preview

✅ **File Storage (R2)**
- Image upload and management
- Attachment storage
- File download and deletion
- Multiple file type support

## Tech Stack

- **Cloudflare Workers**: Serverless compute platform
- **Cloudflare Email Workers**: Email sending API
- **Cloudflare R2**: Object storage for images and attachments
- **Cloudflare D1**: SQLite database for mailing lists
- **Hono**: Lightweight web framework
- **TypeScript**: Type-safe development

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `wrangler.toml`:

```toml
# R2 bucket
[[r2_buckets]]
binding = "EMAIL_ATTACHMENTS"
bucket_name = "your-bucket-name"

# D1 database
[[d1_databases]]
binding = "DB"
database_name = "email_database"
database_id = "your-database-id"

# Email configuration
send_email = [
  {name = "SEB", destination_address = "verified@example.com"}
]
```

### 3. Create R2 Bucket

```bash
wrangler r2 bucket create email-attachments
```

### 4. Create D1 Database

```bash
wrangler d1 create email_database
```

Copy the returned `database_id` to `wrangler.toml`.

### 5. Initialize Database

After deployment, call:
```
POST /api/init
```

### 6. Local Development

```bash
npm run dev
```

Visit `http://localhost:8787` to see the UI.

### 7. Deploy to Cloudflare

```bash
npm run deploy
```

## API Documentation

### Email Sending

#### Send Single Email
```http
POST /api/send
Content-Type: application/json

{
  "to": [
    {"email": "recipient@example.com", "name": "Recipient Name"}
  ],
  "subject": "Email Subject",
  "htmlBody": "<p>Email content</p>",
  "from": {"email": "sender@example.com", "name": "Sender Name"}
}
```

#### Send to Mailing List
```http
POST /api/send-to-list/:listId
Content-Type: application/json

{
  "subject": "Email Subject",
  "htmlBody": "<p>Email content</p>",
  "from": {"email": "sender@example.com"}
}
```

### Mailing List Management

#### Get All Lists
```http
GET /api/lists
```

#### Get Single List
```http
GET /api/lists/:id
```

#### Create List
```http
POST /api/lists
Content-Type: application/json

{
  "name": "List Name",
  "description": "List Description"
}
```

#### Update List
```http
PUT /api/lists/:id
Content-Type: application/json

{
  "name": "New Name",
  "description": "New Description"
}
```

#### Delete List
```http
DELETE /api/lists/:id
```

#### Add Email to List
```http
POST /api/lists/:id/emails
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name"
}
```

#### Remove Email from List
```http
DELETE /api/lists/:id/emails/:email
```

### File Management

#### Upload File
```http
POST /api/files
Content-Type: multipart/form-data

file: <binary data>
```

#### Get File
```http
GET /api/files/:id/:filename
```

#### Delete File
```http
DELETE /api/files/:id/:filename
```

## Project Structure

```
cloudflareEmail/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── database.ts       # D1 database operations
│   ├── storage.ts        # R2 storage operations
│   └── email.ts          # Email sending logic
├── public/
│   └── index.html        # Web UI interface
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## Usage

### Web UI

After deployment, access the Worker URL to see a three-tab interface:

1. **Send Email**: Compose and send emails
   - Select mailing list or add recipients manually
   - Enter subject and content
   - Use rich text editor for formatting
   - Upload attachments

2. **Mailing Lists**: Manage mailing lists
   - Create new lists
   - View existing lists
   - Add/remove email addresses
   - Delete lists

3. **File Management**: Manage uploaded files
   - Upload images and attachments
   - View uploaded files
   - Delete files

## Configuration

### Email Workers Setup

1. **Verify Domain** in Cloudflare Dashboard:
   - Go to Email Routing
   - Add and verify your domain
   - Configure DNS records

2. **Set Sender Address** in `wrangler.toml`:
```toml
send_email = [
  {name = "SEB", destination_address = "noreply@yourdomain.com"}
]
```

3. **Test Email Sending**:
```bash
curl -X POST https://your-worker.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlBody": "<p>Hello from Cloudflare Workers!</p>"
  }'
```

## Security Recommendations

1. **Access Control**: Add authentication middleware
2. **Rate Limiting**: Prevent email abuse
3. **Input Validation**: Validate all user inputs
4. **CORS Configuration**: Restrict allowed origins
5. **Environment Variables**: Use secrets for sensitive data

## Development

### Adding New Features

1. Add new modules in `src/` directory
2. Register routes in `src/index.ts`
3. Update type definitions in `src/types.ts`
4. Test and deploy

### Debugging

```bash
# View logs
wrangler tail

# Local testing
npm run dev
```

## FAQ

**Q: Why is email sending failing?**
A: Check:
- Domain verification status
- Sender address configuration
- Email content compliance

**Q: How to increase mailing list capacity?**
A: D1 database supports large datasets with tens of thousands of email addresses.

**Q: What are R2 storage costs?**
A: R2 is very affordable - first 10GB free, then ~$0.015/GB/month.

**Q: Can I schedule emails?**
A: Yes, combine with Cloudflare Cron Triggers for scheduled tasks.

## References

- [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!