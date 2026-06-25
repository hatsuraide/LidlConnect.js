import { BaseAPI } from './base';
import { UserData } from '../types';

interface RawUser {
  id: number;
  name: string;
  userType: string;
  hasPassword: boolean;
  birthDate: string | null;
  customerType: string;
  customerLanguage: string;
  notificationSettings: { emailEnabled: boolean; smsEnabled: boolean } | null;
  accounts: Array<{
    id: number;
    endpoints: Array<{
      id: number;
      name: string;
      status: string;
      ocsBalance: number;
      ocsBonusBalance: number;
      activationDate: string | null;
      deactivationDate: string | null;
      imsis: Array<{ imsi: string; iccid: string; esim: boolean }>;
    }>;
  }>;
}

export class UserAPI extends BaseAPI {
  async get(): Promise<UserData> {
    return this.cache.get('user', 30, async () => {
      const raw = await this.apiPost<RawUser>('/customer/dashboard/login-check');

      const endpoint = raw.accounts
        .flatMap(a => a.endpoints)
        .find(ep => ep.id === this.session.endpointId);

      const imsi = endpoint?.imsis?.[0];

      return {
        id: raw.id,
        name: raw.name,
        phoneNumber: endpoint?.name ?? '',
        balance: endpoint?.ocsBalance ?? 0,
        bonusBalance: endpoint?.ocsBonusBalance ?? 0,
        status: endpoint?.status ?? '',
        customerType: raw.customerType,
        customerLanguage: raw.customerLanguage,
        hasPassword: raw.hasPassword,
        birthDate: raw.birthDate ?? null,
        activationDate: endpoint?.activationDate ?? null,
        deactivationDate: endpoint?.deactivationDate ?? null,
        imsi: imsi?.imsi ?? null,
        iccid: imsi?.iccid ?? null,
        isEsim: imsi?.esim ?? false,
        notificationSettings: raw.notificationSettings ?? null,
        raw: raw as unknown as Record<string, unknown>,
      };
    });
  }
}
