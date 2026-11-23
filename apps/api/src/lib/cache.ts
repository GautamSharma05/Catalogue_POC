/**
 * Minimal in-memory TTL cache. Good enough to avoid hammering an upstream
 * product API in a PoC; swap for Redis/etc. without touching callers if this
 * ever needs to run across multiple instances.
 */
export class TtlCache<T> {
  private value: T | undefined;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) {}

  /** Returns the cached value if still fresh, otherwise undefined. */
  get(): T | undefined {
    if (this.value !== undefined && Date.now() < this.expiresAt) {
      return this.value;
    }
    return undefined;
  }

  set(value: T): void {
    this.value = value;
    this.expiresAt = Date.now() + this.ttlMs;
  }

  clear(): void {
    this.value = undefined;
    this.expiresAt = 0;
  }
}
