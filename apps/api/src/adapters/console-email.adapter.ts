import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { EmailPort, type EmailMessage } from '../domain/ports/email.port.js';

const DEFAULT_LOG_PATH = './tmp/sent-emails.log';

/**
 * Zero-account EmailPort implementation: logs to stdout and appends a JSON
 * line to a local file so tests/reviewers can inspect "sent" mail without a
 * real email provider. Swap `EMAIL_PROVIDER` to point at a real adapter
 * later without touching the enquiry use-case.
 */
export class ConsoleEmailAdapter implements EmailPort {
  constructor(private readonly logPath: string = DEFAULT_LOG_PATH) {}

  async send(message: EmailMessage): Promise<void> {
    const line = JSON.stringify({ ...message, sentAt: new Date().toISOString() });
    console.log(`[email] to=${message.to} subject=${message.subject}`);
    await mkdir(dirname(this.logPath), { recursive: true });
    await appendFile(this.logPath, `${line}\n`, 'utf8');
  }
}
