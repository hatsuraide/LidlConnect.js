import { BaseAPI } from './base';
import { Balance, PaymentChannel } from '../types';
import { BASE_URL } from '../session';
import { APIError } from '../types';

export class CreditAPI extends BaseAPI {
  /** Redeem a voucher/scratch-card code. */
  async topup(code: string): Promise<void> {
    const phoneNumber = await this.phoneNumber();
    const response = await this.session.fetch(`${BASE_URL}/credit/code`, {
      method: 'POST',
      headers: this.session.apiHeaders(),
      body: JSON.stringify({
        phoneNumber,
        code: {
          label: 'credit_top_up.bon',
          code_fields: 1,
          code_field_length: 16,
          code_validation: '^([a-zA-Z0-9]+)$',
          active: true,
          api_type: 'VOUCHER_WITH_ACTIVATION_NUMBER',
          code,
        },
        userId: this.session.userId,
        endpointId: this.session.endpointId,
      }),
    });
    if (!response.ok) throw new APIError(response.status, await response.text());
  }

  /** Current account balance: { balance, bonusBalance }. */
  async getBalance(): Promise<Balance> {
    return this.apiPost<Balance>('/customer/tariffs/endpoint-balance');
  }

  /** Available payment channels (card, banking, etc.). */
  async getPaymentChannels(phoneNumber?: string): Promise<PaymentChannel[]> {
    return this.apiPost<PaymentChannel[]>('/credit/fetch-payment-channels', {
      phoneNumber: phoneNumber ?? (await this.phoneNumber()),
    });
  }

  private async phoneNumber(): Promise<string> {
    this.ensureInit();
    const response = await this.apiPost<{ accounts: Array<{ endpoints: Array<{ id: number; name: string }> }> }>(
      '/customer/dashboard/login-check',
    );
    const endpoint = response.accounts
      .flatMap(a => a.endpoints)
      .find(ep => ep.id === this.session.endpointId);
    if (!endpoint) throw new Error('Could not determine phone number');
    return endpoint.name;
  }
}
