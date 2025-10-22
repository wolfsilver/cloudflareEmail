// R2 storage operations for attachments and images

import type { R2Bucket } from '@cloudflare/workers-types';
import type { UploadedFile } from './types';

export class Storage {
  constructor(private bucket: R2Bucket) {}

  async uploadFile(
    file: ArrayBuffer,
    filename: string,
    contentType: string
  ): Promise<UploadedFile> {
    const id = crypto.randomUUID();
    const key = `${id}/${filename}`;

    await this.bucket.put(key, file, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      id,
      filename,
      contentType,
      size: file.byteLength,
      url: `/api/files/${id}/${filename}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getFile(id: string, filename: string): Promise<R2ObjectBody | null> {
    const key = `${id}/${filename}`;
    return await this.bucket.get(key);
  }

  async deleteFile(id: string, filename: string): Promise<boolean> {
    const key = `${id}/${filename}`;
    await this.bucket.delete(key);
    return true;
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const list = await this.bucket.list({ prefix });
    return list.objects.map((obj) => obj.key);
  }
}
