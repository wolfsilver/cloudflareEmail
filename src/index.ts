// Main Cloudflare Worker entry point

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Env, EmailRequest, EmailRecipient } from './types';
import { Database } from './database';
import { Storage } from './storage';
import { EmailService } from './email';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('/*', cors());

// Serve static files from public directory
app.get('/', serveStatic({ path: './index.html', root: './public' }));

// API health check endpoint
app.get('/api', (c) => {
  return c.json({
    status: 'ok',
    message: 'Cloudflare Email Worker API',
    version: '1.0.0',
  });
});

// Initialize database
app.post('/api/init', async (c) => {
  try {
    const db = new Database(c.env.DB);
    await db.initialize();
    return c.json({ success: true, message: 'Database initialized' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mailing List Endpoints

// Get all mailing lists
app.get('/api/lists', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const lists = await db.getAllMailingLists();
    return c.json({ success: true, lists });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get a specific mailing list
app.get('/api/lists/:id', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const list = await db.getMailingList(c.req.param('id'));
    if (!list) {
      return c.json({ success: false, error: 'List not found' }, 404);
    }
    return c.json({ success: true, list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create a new mailing list
app.post('/api/lists', async (c) => {
  try {
    const { name, description } = await c.req.json();
    if (!name) {
      return c.json({ success: false, error: 'Name is required' }, 400);
    }

    const db = new Database(c.env.DB);
    const list = await db.createMailingList(name, description);
    return c.json({ success: true, list }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update a mailing list
app.put('/api/lists/:id', async (c) => {
  try {
    const { name, description } = await c.req.json();
    const db = new Database(c.env.DB);
    const list = await db.updateMailingList(c.req.param('id'), name, description);
    if (!list) {
      return c.json({ success: false, error: 'List not found' }, 404);
    }
    return c.json({ success: true, list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete a mailing list
app.delete('/api/lists/:id', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const success = await db.deleteMailingList(c.req.param('id'));
    if (!success) {
      return c.json({ success: false, error: 'List not found' }, 404);
    }
    return c.json({ success: true, message: 'List deleted' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add email to mailing list
app.post('/api/lists/:id/emails', async (c) => {
  try {
    const { email, name } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const emailService = new EmailService(c.env.SEB);
    if (!emailService.validateEmail(email)) {
      return c.json({ success: false, error: 'Invalid email address' }, 400);
    }

    const db = new Database(c.env.DB);
    const success = await db.addEmailToList(c.req.param('id'), email, name);
    if (!success) {
      return c.json({ success: false, error: 'Failed to add email to list' }, 400);
    }

    return c.json({ success: true, message: 'Email added to list' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Remove email from mailing list
app.delete('/api/lists/:id/emails/:email', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const success = await db.removeEmailFromList(
      c.req.param('id'),
      decodeURIComponent(c.req.param('email'))
    );
    if (!success) {
      return c.json({ success: false, error: 'Email not found in list' }, 404);
    }
    return c.json({ success: true, message: 'Email removed from list' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// File Upload Endpoints

// Upload a file (image or attachment)
app.post('/api/files', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    const storage = new Storage(c.env.EMAIL_ATTACHMENTS);
    const arrayBuffer = await file.arrayBuffer();
    const uploadedFile = await storage.uploadFile(arrayBuffer, file.name, file.type);

    return c.json({ success: true, file: uploadedFile }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get a file
app.get('/api/files/:id/:filename', async (c) => {
  try {
    const storage = new Storage(c.env.EMAIL_ATTACHMENTS);
    const file = await storage.getFile(c.req.param('id'), c.req.param('filename'));

    if (!file) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    return new Response(file.body, {
      headers: {
        'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${c.req.param('filename')}"`,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete a file
app.delete('/api/files/:id/:filename', async (c) => {
  try {
    const storage = new Storage(c.env.EMAIL_ATTACHMENTS);
    await storage.deleteFile(c.req.param('id'), c.req.param('filename'));
    return c.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Email Sending Endpoints

// Send email
app.post('/api/send', async (c) => {
  try {
    const request: EmailRequest = await c.req.json();

    // Validate request
    if (!request.to || request.to.length === 0) {
      return c.json({ success: false, error: 'Recipients are required' }, 400);
    }
    if (!request.subject) {
      return c.json({ success: false, error: 'Subject is required' }, 400);
    }
    if (!request.htmlBody && !request.textBody) {
      return c.json({ success: false, error: 'Email body is required' }, 400);
    }

    const emailService = new EmailService(c.env.SEB);

    // Validate email addresses
    if (!emailService.validateRecipients(request.to)) {
      return c.json({ success: false, error: 'Invalid email address(es)' }, 400);
    }

    // If mailing list is specified, get emails from list
    let recipients = request.to;
    if (request.mailingListId) {
      const db = new Database(c.env.DB);
      const emails = await db.getEmailsFromList(request.mailingListId);
      recipients = emails.map((email) => ({ email }));
    }

    // Handle attachments from R2 if provided
    if (request.attachments) {
      const storage = new Storage(c.env.EMAIL_ATTACHMENTS);
      for (const attachment of request.attachments) {
        // Attachments are already in the correct format
        // In a real implementation, you might need to fetch from R2 if only IDs are provided
      }
    }

    // Send email
    await emailService.sendEmail({
      ...request,
      to: recipients,
    });

    return c.json({
      success: true,
      message: 'Email sent successfully',
      recipientCount: recipients.length,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Send email to mailing list
app.post('/api/send-to-list/:listId', async (c) => {
  try {
    const { subject, htmlBody, from } = await c.req.json();

    if (!subject || !htmlBody) {
      return c.json({ success: false, error: 'Subject and body are required' }, 400);
    }

    const db = new Database(c.env.DB);
    const emails = await db.getEmailsFromList(c.req.param('listId'));

    if (emails.length === 0) {
      return c.json({ success: false, error: 'Mailing list is empty' }, 400);
    }

    const recipients: EmailRecipient[] = emails.map((email) => ({ email }));
    const emailService = new EmailService(c.env.SEB);

    const result = await emailService.sendBulkEmail(recipients, subject, htmlBody, from);

    return c.json({
      success: true,
      message: 'Bulk email sent',
      sent: result.sent,
      failed: result.failed,
      total: emails.length,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
