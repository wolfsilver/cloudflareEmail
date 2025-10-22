// Email sending functionality using Cloudflare Email Workers

import type { EmailMessage } from '@cloudflare/workers-types';
import type { EmailRequest, EmailRecipient } from './types';

export class EmailService {
  constructor(private emailBinding: any) {}

  async sendEmail(request: EmailRequest): Promise<boolean> {
    try {
      const { to, subject, htmlBody, textBody, from, replyTo, attachments } = request;

      // Prepare email message
      const message: any = {
        from: from
          ? `${from.name || ''} <${from.email}>`.trim()
          : 'noreply@example.com',
        to: to.map((recipient) =>
          recipient.name
            ? `${recipient.name} <${recipient.email}>`
            : recipient.email
        ),
        subject,
      };

      // Add reply-to if specified
      if (replyTo) {
        message.headers = {
          'Reply-To': replyTo,
        };
      }

      // Add HTML content
      if (htmlBody) {
        message.contentType = 'text/html';
        message.content = htmlBody;
      }

      // Add plain text content if provided
      if (textBody && !htmlBody) {
        message.contentType = 'text/plain';
        message.content = textBody;
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        message.attachments = attachments.map((att) => ({
          filename: att.filename,
          data: att.content,
          type: att.contentType,
        }));
      }

      // Send email using Cloudflare Email Workers API
      await this.emailBinding.send(message);

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendBulkEmail(
    recipients: EmailRecipient[],
    subject: string,
    htmlBody: string,
    from?: EmailRecipient
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient) => {
        try {
          await this.sendEmail({
            to: [recipient],
            subject,
            htmlBody,
            from,
          });
          sent++;
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);
    }

    return { sent, failed };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateRecipients(recipients: EmailRecipient[]): boolean {
    return recipients.every((recipient) => this.validateEmail(recipient.email));
  }
}
