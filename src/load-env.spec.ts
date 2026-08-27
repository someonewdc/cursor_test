import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnv } from './load-env';

describe('loadEnv', () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = original;
    }
  });

  it('sets DATABASE_URL from the env file when unset', () => {
    delete process.env.DATABASE_URL;
    const dir = mkdtempSync(join(tmpdir(), 'load-env-'));
    const file = join(dir, '.env');
    writeFileSync(file, 'DATABASE_URL="file:./from-env-file.db"\n');

    try {
      loadEnv(file);
      expect(process.env.DATABASE_URL).toBe('file:./from-env-file.db');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('does not override an existing DATABASE_URL', () => {
    process.env.DATABASE_URL = 'file:./already-set.db';
    const dir = mkdtempSync(join(tmpdir(), 'load-env-'));
    const file = join(dir, '.env');
    writeFileSync(file, 'DATABASE_URL="file:./from-env-file.db"\n');

    try {
      loadEnv(file);
      expect(process.env.DATABASE_URL).toBe('file:./already-set.db');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
