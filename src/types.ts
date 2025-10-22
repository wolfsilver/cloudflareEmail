// Type definitions for the email worker

export interface Env {
  EMAIL_ATTACHMENTS: R2Bucket;
  DB: D1Database;
  SEB: any; // Email binding
}

export interface MailingList {
  id: string;
  name: string;
  description?: string;
  emails: string[];
  created_at: string;
  updated_at: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: ArrayBuffer;
  contentType: string;
}

export interface EmailRequest {
  to: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: EmailRecipient;
  replyTo?: string;
  attachments?: EmailAttachment[];
  mailingListId?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  uploadedAt: string;
}
