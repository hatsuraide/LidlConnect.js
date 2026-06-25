export const BASE_URL = 'https://selfcare.lidl-connect.at';

export class Session {
  private readonly cookies = new Map<string, string>();

  csrfToken: string | null = null;
  userId: number | null = null;
  endpointId: number | null = null;
  initialized = false;

  private cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private storeCookies(headers: Headers): void {
    // Node 18+ exposes getSetCookie(); fall back to parsing the raw header
    const raw: string[] =
      typeof (headers as unknown as { getSetCookie(): string[] }).getSetCookie === 'function'
        ? (headers as unknown as { getSetCookie(): string[] }).getSetCookie()
        : (headers.get('set-cookie') ?? '').split(/,(?=[^;,]+=)/).filter(Boolean);

    for (const cookie of raw) {
      const nameValue = cookie.split(';')[0].trim();
      const eq = nameValue.indexOf('=');
      if (eq > 0) {
        this.cookies.set(nameValue.slice(0, eq).trim(), nameValue.slice(eq + 1).trim());
      }
    }
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const cookieStr = this.cookieHeader();
    if (cookieStr) headers.set('Cookie', cookieStr);

    const response = await globalThis.fetch(url, { ...init, headers });
    this.storeCookies(response.headers);
    return response;
  }

  get basePayload(): { userId: number; endpointId: number } {
    return { userId: this.userId!, endpointId: this.endpointId! };
  }

  apiHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: BASE_URL,
      Referer: `${BASE_URL}/customer/dashboard/`,
      'X-CSRF-TOKEN': this.csrfToken ?? '',
      'X-SELF-CARE': '1',
    };
  }
}
