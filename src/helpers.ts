export class TtlCache {
  private readonly store = new Map<string, { value: unknown; ts: number }>();

  async get<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.store.get(key);
    if (cached && now - cached.ts < ttlSeconds * 1000) {
      return cached.value as T;
    }
    const value = await fetcher();
    this.store.set(key, { value, ts: now });
    return value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
