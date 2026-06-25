import { APIError, NotInitializedError } from '../types';
import { Session, BASE_URL } from '../session';
import { TtlCache } from '../helpers';

export abstract class BaseAPI {
  protected readonly cache = new TtlCache();

  constructor(protected readonly session: Session) {}

  protected ensureInit(): void {
    if (!this.session.initialized) {
      throw new NotInitializedError('Call client.initialize() before using the API');
    }
  }

  protected async apiPost<T>(path: string, extra?: Record<string, unknown>): Promise<T> {
    this.ensureInit();
    const body = { ...this.session.basePayload, ...extra };
    const response = await this.session.fetch(BASE_URL + path, {
      method: 'POST',
      headers: this.session.apiHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new APIError(response.status, await response.text());
    const text = await response.text();
    return (text.trim() ? JSON.parse(text) : null) as T;
  }

  protected async apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    this.ensureInit();
    const url = new URL(BASE_URL + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    }
    const response = await this.session.fetch(url.toString(), {
      headers: this.session.apiHeaders(),
    });
    if (!response.ok) throw new APIError(response.status, await response.text());
    const text = await response.text();
    return (text.trim() ? JSON.parse(text) : null) as T;
  }
}
