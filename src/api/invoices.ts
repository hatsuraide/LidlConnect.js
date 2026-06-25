import { BaseAPI } from './base';
import { Invoice, Voucher, CallList, InvoiceConfig } from '../types';
import { BASE_URL } from '../session';
import { APIError } from '../types';

interface RawInvoice {
  id: number;
  amount: number;
  postingDate: string;
  type: string;
  provider: string;
  channel: string;
}

interface RawVoucher {
  id: number;
  serial: string;
  balanceAdvice: number;
  consumedDate: string;
}

export class InvoicesAPI extends BaseAPI {
  async getInvoices(): Promise<Invoice[]> {
    return this.cache.get('invoices', 60, async () => {
      const data = await this.apiPost<RawInvoice[]>('/customer/invoices/invoice-list', {
        accountId: this.session.endpointId,
      });
      return (Array.isArray(data) ? data : []).map(r => ({
        id: r.id,
        amount: r.amount,
        postingDate: r.postingDate,
        type: r.type,
        provider: r.provider,
        channel: r.channel,
        raw: r as unknown as Record<string, unknown>,
      }));
    });
  }

  async getVouchers(): Promise<Voucher[]> {
    return this.cache.get('vouchers', 60, async () => {
      const data = await this.apiPost<RawVoucher[]>('/customer/invoices/consumed-vouchers');
      return (Array.isArray(data) ? data : []).map(r => ({
        id: r.id,
        serial: r.serial,
        value: r.balanceAdvice,
        consumedDate: r.consumedDate,
        raw: r as unknown as Record<string, unknown>,
      }));
    });
  }

  /** Itemised call/SMS/data event log. */
  async getCalls(opts: { page?: number; size?: number } = {}): Promise<CallList> {
    return this.apiPost<CallList>('/customer/invoices/call-list', {
      page: opts.page ?? 1,
      size: opts.size ?? 50,
    });
  }

  async getConfig(): Promise<InvoiceConfig> {
    return this.apiPost<InvoiceConfig>('/customer/invoices/config');
  }

  /** Unified timeline of all usage events. */
  async getTimeline(): Promise<CallList> {
    return this.cache.get('timeline', 120, () =>
      this.apiPost<CallList>('/customer/timeline/'),
    );
  }

  /** Download call list as raw bytes (format depends on server). */
  async downloadCalls(): Promise<Uint8Array> {
    this.ensureInit();
    const url = `${BASE_URL}/customer/invoices/download-calls/${this.session.endpointId}`;
    const response = await this.session.fetch(url, { headers: this.session.apiHeaders() });
    if (!response.ok) throw new APIError(response.status, await response.text());
    return new Uint8Array(await response.arrayBuffer());
  }

  async totalSpent(): Promise<number> {
    const [invoices, vouchers] = await Promise.all([this.getInvoices(), this.getVouchers()]);
    return (
      invoices.reduce((s, i) => s + i.amount, 0) +
      vouchers.reduce((s, v) => s + v.value, 0)
    );
  }

  async lastPaymentDate(): Promise<string | null> {
    const [invoices, vouchers] = await Promise.all([this.getInvoices(), this.getVouchers()]);
    const dates = [
      ...invoices.map(i => i.postingDate),
      ...vouchers.map(v => v.consumedDate),
    ].filter(Boolean);
    return dates.length ? dates.sort().at(-1)! : null;
  }
}
