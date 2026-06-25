import { BaseAPI } from './base';
import { ServiceGroup, ServiceSetting, TopupSettings, EgnSettings } from '../types';

export class SettingsAPI extends BaseAPI {
  /** Service settings grouped by category (voicemail, calls/SMS, data, roaming). */
  async getServices(): Promise<ServiceGroup[]> {
    return this.cache.get('services', 60, () =>
      this.apiPost<ServiceGroup[]>('/customer/settings/'),
    );
  }

  async getTopup(): Promise<TopupSettings> {
    return this.cache.get('topup', 30, () =>
      this.apiPost<TopupSettings>('/customer/settings/top-up-settings'),
    );
  }

  async getConsents(): Promise<Record<string, unknown>> {
    return this.cache.get('consents', 300, () =>
      this.apiPost<Record<string, unknown>>('/customer/settings/consents'),
    );
  }

  async getEgn(): Promise<EgnSettings> {
    return this.cache.get('egn', 300, () =>
      this.apiPost<EgnSettings>('/customer/settings/egn-settings'),
    );
  }

  /** Enable or disable a service by its ID (e.g. 'VOICEMAIL', 'VOICE_ROAMING'). */
  async updateService(serviceId: string, active: boolean): Promise<void> {
    const groups = await this.getServices();
    let setting: ServiceSetting | undefined;
    for (const group of groups) {
      setting = group.settings.find(s => s.id === serviceId);
      if (setting) break;
    }
    const payload: ServiceSetting = setting
      ? { ...setting, active, value: active }
      : { id: serviceId, key: serviceId, type: 'services', active, value: active, translationKey: '' };

    await this.apiPost('/customer/settings/update-settings', { setting: payload });
    this.cache.invalidate('services');
  }

  /** Update auto top-up settings. */
  async updateTopup(settings: Partial<TopupSettings>): Promise<void> {
    await this.apiPost('/customer/settings/top-up-settings/update', settings as Record<string, unknown>);
    this.cache.invalidate('topup');
  }

  /** Update notification channel preferences. */
  async updateNotifications(emailEnabled: boolean, smsEnabled: boolean): Promise<void> {
    await this.apiPost('/customer/settings/notifications/update', {
      settings: { emailEnabled, smsEnabled },
    });
  }

  /** Update number masking (EGN) settings. */
  async updateEgn(maskPremium: boolean, maskNonPremium: boolean): Promise<void> {
    await this.apiPost('/customer/settings/egn-settings/update', {
      maskPremiumNumbers: maskPremium,
      maskNonPremiumNumbers: maskNonPremium,
    });
    this.cache.invalidate('egn');
  }

  /** Update GDPR consent list. */
  async updateConsents(consents: unknown[]): Promise<void> {
    await this.apiPost('/customer/settings/consents/update', { consents });
    this.cache.invalidate('consents');
  }
}
