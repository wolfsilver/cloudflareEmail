// Input validation and security utilities

export class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateSubject(subject: string): boolean {
    return subject.length > 0 && subject.length <= 998;
  }

  static validateHTMLContent(html: string): boolean {
    // Basic check - content exists and not too large (1MB limit)
    return html.length > 0 && html.length <= 1024 * 1024;
  }

  static sanitizeHTML(html: string): string {
    // Remove potentially dangerous scripts
    // Note: This is a basic sanitization. For production, use a proper HTML sanitizer
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  static validateFileName(filename: string): boolean {
    // Check for path traversal and invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    const pathTraversal = /\.\./;
    
    return (
      filename.length > 0 &&
      filename.length <= 255 &&
      !invalidChars.test(filename) &&
      !pathTraversal.test(filename)
    );
  }

  static validateFileSize(size: number, maxSize: number = 25 * 1024 * 1024): boolean {
    // Default max size: 25MB
    return size > 0 && size <= maxSize;
  }

  static isValidMimeType(mimeType: string, allowedTypes: string[] = []): boolean {
    if (allowedTypes.length === 0) {
      // Allow common email attachment types
      allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ];
    }
    
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return mimeType.startsWith(type.slice(0, -2));
      }
      return mimeType === type;
    });
  }

  static validateListName(name: string): boolean {
    return name.length > 0 && name.length <= 255;
  }

  static validateDescription(description: string): boolean {
    return description.length <= 1000;
  }

  static validateRecipientCount(count: number, maxCount: number = 100): boolean {
    return count > 0 && count <= maxCount;
  }

  static sanitizeInput(input: string): string {
    // Remove any control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
}
