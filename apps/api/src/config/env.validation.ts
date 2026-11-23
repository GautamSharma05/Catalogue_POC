import { z } from 'zod';

/**
 * All fields are optional because configuration.ts falls back to sane
 * defaults for every one of them (this is a PoC, not a service where a
 * missing SALES_INBOX_EMAIL should be impossible to boot without) - this
 * schema's job is to catch a value that's *present but wrong* (an
 * unparsable PORT, an email address without an @), not to force every
 * env var to be set.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().optional(),
  SALES_INBOX_EMAIL: z.string().email('SALES_INBOX_EMAIL must be a valid email address').optional(),
  CORS_ORIGIN: z.string().optional(),
  EMAIL_LOG_PATH: z.string().optional(),
});

/**
 * Wired into ConfigModule.forRoot({ validate: validateEnv }) so a bad
 * value fails the boot immediately with a clear message, instead of
 * limping along until something downstream breaks in a confusing way
 * (e.g. an unparsable PORT silently becoming NaN and the server failing
 * to bind with an opaque Node error).
 *
 * Returns the original config object unchanged - this is a validation
 * gate, not a transform step. configuration.ts does its own coercion
 * into the shape callers actually read via ConfigService.
 */
export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return config;
}
