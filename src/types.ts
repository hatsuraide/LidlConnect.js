// Errors
export class LidlConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends LidlConnectError {}

export class APIError extends LidlConnectError {
  constructor(public readonly statusCode: number, body: string) {
    super(`HTTP ${statusCode}: ${body}`);
  }
}

export class NotInitializedError extends LidlConnectError {}

// Shared
export interface Counter {
  remaining: number;
  total: number;
  used: number;
  unit: string;
}

// User
export interface UserData {
  id: number;
  name: string;
  phoneNumber: string;
  balance: number;
  bonusBalance: number;
  status: string;
  customerType: string;
  customerLanguage: string;
  hasPassword: boolean;
  birthDate: string | null;
  activationDate: string | null;
  deactivationDate: string | null;
  imsi: string | null;
  iccid: string | null;
  isEsim: boolean;
  notificationSettings: { emailEnabled: boolean; smsEnabled: boolean } | null;
  raw: Record<string, unknown>;
}

// Usage
export interface UsageData {
  data: Counter;
  euData: Counter;
  minutes: Counter;
  internationalMinutes: Counter;
  tariffName: string | null;
  validFrom: string | null;
  validTo: string | null;
  nextRenewal: string | null;
  grossPrice: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  queued: unknown[];
  raw: Record<string, unknown>;
}

// Tariffs
export interface PackageCounter {
  counterId: string;
  niceValue: {
    type: string;
    initialValue: number;
    decimalPlaces: number;
  };
}

export interface TariffOption {
  itemId: string;
  grossPrice: number;
  validFrom: string;
  validTo: string;
  counters: PackageCounter[];
  raw: Record<string, unknown>;
}

export interface CatalogTariff {
  itemId: string;
  name: string;
  description: string;
  featured: boolean;
  visible: boolean;
  sort: number;
  translations: Record<string, { name?: string; content?: string; teaser?: string }>;
  raw: Record<string, unknown>;
}

export interface Balance {
  balance: number;
  bonusBalance: number;
}

// Invoices
export interface Invoice {
  id: number;
  amount: number;
  postingDate: string;
  type: string;
  provider: string;
  channel: string;
  raw: Record<string, unknown>;
}

export interface Voucher {
  id: number;
  serial: string;
  value: number;
  consumedDate: string;
  raw: Record<string, unknown>;
}

export interface CallEvent {
  id: number;
  endpointId: number;
  eventType: string;
  eventSubType: string;
  destination: string;
  startTimestamp: string;
  consumedUnitType: string;
  totalConsumedUnitCount: number;
}

export interface CallList {
  events: CallEvent[];
  count: number;
  filtered: number;
}

export interface InvoiceConfig {
  monthsToDisplay: number;
  statement: boolean;
  topUp: boolean;
  callList: boolean;
  callListMonths: number;
  startWithDate: string;
}

//  Settings
export interface ServiceSetting {
  id: string;
  key: string;
  type: string;
  active: boolean;
  value: boolean;
  translationKey: string;
}

export interface ServiceGroup {
  group_name: string;
  translationKey: string;
  settings: ServiceSetting[];
}

export interface TopupSettings {
  enableThresholdTopup: boolean;
  thresholdTopupThreshold: number;
  thresholdTopupAmount: number;
  enablePriceBasedTopup: boolean;
}

export interface EgnSettings {
  maskPremiumNumbers: boolean;
  maskNonPremiumNumbers: boolean;
}

// Credit
export interface PaymentChannel {
  paymentProviderId: string;
  paymentChannel: string;
  oneTimePayment: boolean;
  recurringPayment: boolean;
}
