// Database operations for mailing lists

import type { D1Database } from '@cloudflare/workers-types';
import type { MailingList } from './types';

export class Database {
  constructor(private db: D1Database) {}

  async initialize() {
    // Create mailing lists table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS mailing_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create mailing list emails table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS mailing_list_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        FOREIGN KEY (list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE,
        UNIQUE(list_id, email)
      )
    `);
  }

  async createMailingList(name: string, description?: string): Promise<MailingList> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO mailing_lists (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(id, name, description || null, now, now)
      .run();

    return {
      id,
      name,
      description,
      emails: [],
      created_at: now,
      updated_at: now,
    };
  }

  async getMailingList(id: string): Promise<MailingList | null> {
    const list = await this.db
      .prepare('SELECT * FROM mailing_lists WHERE id = ?')
      .bind(id)
      .first<{
        id: string;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>();

    if (!list) return null;

    const emails = await this.db
      .prepare('SELECT email FROM mailing_list_emails WHERE list_id = ?')
      .bind(id)
      .all<{ email: string }>();

    return {
      id: list.id,
      name: list.name,
      description: list.description || undefined,
      emails: emails.results.map((e) => e.email),
      created_at: list.created_at,
      updated_at: list.updated_at,
    };
  }

  async getAllMailingLists(): Promise<MailingList[]> {
    const lists = await this.db
      .prepare('SELECT * FROM mailing_lists ORDER BY created_at DESC')
      .all<{
        id: string;
        name: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>();

    const result: MailingList[] = [];
    for (const list of lists.results) {
      const emails = await this.db
        .prepare('SELECT email FROM mailing_list_emails WHERE list_id = ?')
        .bind(list.id)
        .all<{ email: string }>();

      result.push({
        id: list.id,
        name: list.name,
        description: list.description || undefined,
        emails: emails.results.map((e) => e.email),
        created_at: list.created_at,
        updated_at: list.updated_at,
      });
    }

    return result;
  }

  async updateMailingList(
    id: string,
    name?: string,
    description?: string
  ): Promise<MailingList | null> {
    const now = new Date().toISOString();
    const list = await this.getMailingList(id);
    if (!list) return null;

    await this.db
      .prepare('UPDATE mailing_lists SET name = ?, description = ?, updated_at = ? WHERE id = ?')
      .bind(name || list.name, description !== undefined ? description : list.description, now, id)
      .run();

    return this.getMailingList(id);
  }

  async deleteMailingList(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM mailing_lists WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }

  async addEmailToList(listId: string, email: string, name?: string): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT INTO mailing_list_emails (list_id, email, name) VALUES (?, ?, ?)')
        .bind(listId, email, name || null)
        .run();

      // Update the list's updated_at timestamp
      await this.db
        .prepare('UPDATE mailing_lists SET updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), listId)
        .run();

      return true;
    } catch (error) {
      console.error('Error adding email to list:', error);
      return false;
    }
  }

  async removeEmailFromList(listId: string, email: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM mailing_list_emails WHERE list_id = ? AND email = ?')
      .bind(listId, email)
      .run();

    if (result.success) {
      // Update the list's updated_at timestamp
      await this.db
        .prepare('UPDATE mailing_lists SET updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), listId)
        .run();
    }

    return result.success;
  }

  async getEmailsFromList(listId: string): Promise<string[]> {
    const emails = await this.db
      .prepare('SELECT email FROM mailing_list_emails WHERE list_id = ?')
      .bind(listId)
      .all<{ email: string }>();

    return emails.results.map((e) => e.email);
  }
}
