import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConsoleEmailAdapter } from './console-email.adapter.js';

describe('ConsoleEmailAdapter', () => {
  let dir: string;
  let logPath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'catalogue-poc-email-'));
    logPath = join(dir, 'nested', 'sent-emails.log');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes a JSON line with to/subject/body to the log file on send', async () => {
    const adapter = new ConsoleEmailAdapter(logPath);

    await adapter.send({ to: 'sales@example.com', subject: 'New enquiry', body: 'hello' });

    const contents = await readFile(logPath, 'utf8');
    const lines = contents.trim().split('\n');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!);
    expect(parsed).toMatchObject({ to: 'sales@example.com', subject: 'New enquiry', body: 'hello' });
  });

  it('resolves without throwing when the log directory does not yet exist', async () => {
    const adapter = new ConsoleEmailAdapter(logPath);

    await expect(
      adapter.send({ to: 'sales@example.com', subject: 'x', body: 'y' }),
    ).resolves.toBeUndefined();
  });

  it('appends two valid JSON lines, not interleaved bytes, for two sequential sends', async () => {
    const adapter = new ConsoleEmailAdapter(logPath);

    await adapter.send({ to: 'a@example.com', subject: 'first', body: '1' });
    await adapter.send({ to: 'b@example.com', subject: 'second', body: '2' });

    const contents = await readFile(logPath, 'utf8');
    const lines = contents.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(() => JSON.parse(lines[0]!)).not.toThrow();
    expect(() => JSON.parse(lines[1]!)).not.toThrow();
  });
});
