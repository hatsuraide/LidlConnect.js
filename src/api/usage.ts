import { BaseAPI } from './base';
import { Counter, UsageData } from '../types';

interface RawCounter {
  counterId: string;
  niceValue: { type: string; initialValue: number; value: number };
  baseValue: { type: string };
}

interface RawElement {
  validFrom: string;
  validTo: string;
  counters?: RawCounter[];
  grossPrice?: number;
}

interface RawGroup {
  itemId: string;
  itemCategory: string;
  itemName: string;
  itemAllowsProlongation?: boolean;
  nextProlongation?: string;
  instanceElements: RawElement[];
}

interface RawUsage {
  instanceGroups: RawGroup[];
  queues: unknown[];
  qosProfiles: Record<string, { qosValues: Record<string, string> }>;
}

function findCounter(groups: RawGroup[], counterId: string): Counter {
  for (const group of groups) {
    for (const elem of group.instanceElements) {
      for (const counter of elem.counters ?? []) {
        if (counter.counterId === counterId) {
          const nv = counter.niceValue;
          return {
            remaining: nv.value,
            total: nv.initialValue,
            used: nv.initialValue - nv.value,
            unit: nv.type || counter.baseValue?.type || '',
          };
        }
      }
    }
  }
  return { remaining: 0, total: 0, used: 0, unit: '' };
}

export class UsageAPI extends BaseAPI {
  async get(): Promise<UsageData> {
    return this.cache.get('usage', 30, async () => {
      const raw = await this.apiPost<RawUsage>('/customer/usage/');
      const groups = raw.instanceGroups ?? [];
      const pkg = groups.find(g => g.itemCategory === 'TARIFF_PACKAGE');
      const pkgElem = pkg?.instanceElements?.[0];

      const qosProfile = Object.values(raw.qosProfiles ?? {})[0];
      const qosValues = qosProfile?.qosValues ?? {};

      return {
        data: findCounter(groups, 'DATA'),
        euData: findCounter(groups, 'DATA_EU'),
        minutes: findCounter(groups, 'VOICE_SMS'),
        internationalMinutes: findCounter(groups, 'VOICE_SMS_INT'),
        tariffName: pkg?.itemName ?? null,
        validFrom: pkgElem?.validFrom ?? null,
        validTo: pkgElem?.validTo ?? null,
        nextRenewal: pkg?.nextProlongation ?? null,
        grossPrice: pkgElem?.grossPrice ?? null,
        downloadSpeed: qosValues['DOWNLOAD_SPEED_IN_BYTES_PER_SEC']
          ? Number(qosValues['DOWNLOAD_SPEED_IN_BYTES_PER_SEC'])
          : null,
        uploadSpeed: qosValues['UPLOAD_SPEED_IN_BYTES_PER_SEC']
          ? Number(qosValues['UPLOAD_SPEED_IN_BYTES_PER_SEC'])
          : null,
        queued: raw.queues ?? [],
        raw: raw as unknown as Record<string, unknown>,
      };
    });
  }
}
