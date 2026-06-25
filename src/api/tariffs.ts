import { BaseAPI } from './base';
import { TariffOption, CatalogTariff, Balance, PackageCounter } from '../types';

interface RawPackage {
  itemId: string;
  category: string;
  name: string;
  description: string;
  featured: boolean;
  visible: boolean;
  sort: number;
  id: number;
  grossPrice: number;
  validFrom: string;
  validTo: string;
  counters: PackageCounter[];
  translations: Record<string, { name?: string; content?: string; teaser?: string }>;
}

function toTariffOption(raw: RawPackage): TariffOption {
  return {
    itemId: raw.itemId,
    grossPrice: raw.grossPrice,
    validFrom: raw.validFrom,
    validTo: raw.validTo,
    counters: raw.counters ?? [],
    raw: raw as unknown as Record<string, unknown>,
  };
}

function toCatalogTariff(raw: RawPackage): CatalogTariff {
  return {
    itemId: raw.itemId,
    name: raw.name,
    description: raw.description,
    featured: raw.featured,
    visible: raw.visible,
    sort: raw.sort ?? 0,
    translations: raw.translations ?? {},
    raw: raw as unknown as Record<string, unknown>,
  };
}

export class TariffsAPI extends BaseAPI {
  /** CMS tariff catalog: names, descriptions, pricing, translations. */
  async getCatalog(): Promise<CatalogTariff[]> {
    return this.cache.get('catalog', 60, async () => {
      const data = await this.apiPost<RawPackage[]>('/customer/tariffs/all-packages');
      return data.filter(p => p.category === 'TARIFF').map(toCatalogTariff);
    });
  }

  /** Tariffs you can switch to at the next billing cycle. */
  async getSwitchable(): Promise<TariffOption[]> {
    return this.cache.get('switchable', 30, async () => {
      const data = await this.apiPost<{ tariffs: RawPackage[] }>('/customer/tariffs/switchable-packages');
      return (data.tariffs ?? []).map(toTariffOption);
    });
  }

  /** Add-on packages available for immediate purchase. */
  async getPurchasable(): Promise<TariffOption[]> {
    return this.cache.get('purchasable', 30, async () => {
      const data = await this.apiPost<{ packages: RawPackage[] }>('/customer/tariffs/purchasable-packages');
      return (data.packages ?? []).map(toTariffOption);
    });
  }

  /** Current account balance. */
  async getBalance(): Promise<Balance> {
    return this.apiPost<Balance>('/customer/tariffs/endpoint-balance');
  }

  /** Schedule a tariff switch for the next billing cycle. */
  async switch(itemId: string): Promise<void> {
    await this.apiPost('/customer/tariffs/switch-package', { itemId });
    this.cache.invalidate('switchable');
  }

  /** Buy an add-on package immediately. */
  async buy(itemId: string): Promise<void> {
    await this.apiPost('/customer/tariffs/buy-package', { itemId });
    this.cache.invalidate('purchasable');
  }
}
