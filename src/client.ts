import { login, initSession, logout } from './auth';
import { Session } from './session';
import { UserAPI } from './api/user';
import { UsageAPI } from './api/usage';
import { TariffsAPI } from './api/tariffs';
import { InvoicesAPI } from './api/invoices';
import { SettingsAPI } from './api/settings';
import { CreditAPI } from './api/credit';

export interface LidlConnectOptions {
  puk?: string;
  password?: string;
}

/**
 * Client for the Lidl Connect selfcare portal.
 *
 * @example
 * ```ts
 * const client = new LidlConnect('069012345678', { puk: '12345678' });
 * await client.initialize();
 *
 * const user = await client.user.get();
 * console.log(user.name, user.balance);
 *
 * await client.logout();
 * ```
 *
 * Or with `using` (TypeScript 5.2+ / Node 22+):
 * ```ts
 * await using client = await LidlConnect.create('069012345678', { puk: '12345678' });
 * const usage = await client.usage.get();
 * ```
 */
export class LidlConnect {
  readonly user: UserAPI;
  readonly usage: UsageAPI;
  readonly tariffs: TariffsAPI;
  readonly invoices: InvoicesAPI;
  readonly settings: SettingsAPI;
  readonly credit: CreditAPI;

  private readonly session: Session;
  private readonly identifier: string;
  private readonly token: string;
  private readonly usePuk: boolean;

  constructor(identifier: string, options: LidlConnectOptions) {
    const { puk, password } = options;
    if (!puk && !password) throw new Error('Either puk or password must be provided');

    this.identifier = identifier;
    this.token = (puk ?? password)!;
    this.usePuk = !!puk;
    this.session = new Session();

    this.user = new UserAPI(this.session);
    this.usage = new UsageAPI(this.session);
    this.tariffs = new TariffsAPI(this.session);
    this.invoices = new InvoicesAPI(this.session);
    this.settings = new SettingsAPI(this.session);
    this.credit = new CreditAPI(this.session);
  }

  /** Login and fetch session tokens. */
  async initialize(): Promise<this> {
    await login(this.session, this.identifier, this.token, this.usePuk);
    await initSession(this.session);
    return this;
  }

  /** Log out and invalidate the session. */
  async logout(): Promise<void> {
    if (this.session.initialized) {
      await logout(this.session);
    }
  }

  get loggedIn(): boolean { return this.session.initialized; }
  get userId(): number | null { return this.session.userId; }
  get endpointId(): number | null { return this.session.endpointId; }

  // Support for `await using` (TC39 Explicit Resource Management)
  async [Symbol.asyncDispose](): Promise<void> {
    await this.logout();
  }

  /** Creates and initializes in one call. */
  static async create(identifier: string, options: LidlConnectOptions): Promise<LidlConnect> {
    return new LidlConnect(identifier, options).initialize();
  }
}
