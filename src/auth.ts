import { load } from 'cheerio';
import { AuthError } from './types';
import { Session, BASE_URL } from './session';

function extractJsonObject(text: string, afterPattern: RegExp): Record<string, unknown> | null {
  const match = afterPattern.exec(text);
  if (!match) return null;

  const start = text.indexOf('{', match.index + match[0].length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>;
    }
  }
  return null;
}

export async function login(session: Session, identifier: string, token: string, usePuk: boolean): Promise<void> {
  const path = usePuk ? '/de/customer/login/puk' : '/de/customer/login/account';
  const response = await session.fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
      'X-AUTH-SELF-CARE': '1',
    },
    body: JSON.stringify({ identifier, token }),
  });

  if (!response.ok) {
    throw new AuthError(`Login failed: HTTP ${response.status}`);
  }
}

export async function initSession(session: Session): Promise<void> {
  const response = await session.fetch(`${BASE_URL}/customer/dashboard/`);
  if (!response.ok) {
    throw new AuthError(`Failed to fetch dashboard: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);

  const csrfToken = $('meta[name="csrf-token"]').attr('content');
  if (!csrfToken) throw new AuthError('CSRF token not found in dashboard response');
  session.csrfToken = csrfToken;

  let allScripts = '';
  $('script').each((_, el) => { allScripts += $(el).html() ?? ''; });

  const userData = extractJsonObject(allScripts, /'user'\s*:\s*/);
  if (!userData) throw new AuthError('Could not find user data in dashboard');

  session.userId = userData['id'] as number;
  const accounts = userData['accounts'] as Array<{ endpoints: Array<{ id: number }> }>;
  if (!accounts?.length || !accounts[0].endpoints?.length) {
    throw new AuthError('No endpoints found for this account');
  }

  session.endpointId = accounts[0].endpoints[0].id;
  session.initialized = true;
}

export async function logout(session: Session): Promise<void> {
  try {
    await session.fetch(`${BASE_URL}/de/customer/logout`);
  } finally {
    session.initialized = false;
    session.csrfToken = null;
  }
}
