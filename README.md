# lidlconnect

Unofficial Node.js client for the Lidl Connect Self-Care API (Austria). (Rewritten from the [python](https://github.com/hatsuraide/LidlConnect.py) package)

## Installation

```bash
npm install lidlconnect
```

## Usage

```ts
import { LidlConnect } from 'lidlconnect';

const client = await LidlConnect.create('069012345678', { puk: '12345678' });

const user = await client.user.get();
console.log(user.name, user.balance);

const data = await client.usage.data;
console.log(`Data: ${data.remaining}/${data.total} ${data.unit}`);

await client.logout();
```

If you are on TypeScript 5.2+ / Node 22+ you can use `await using` for automatic cleanup:

```ts
await using client = await LidlConnect.create('069012345678', { puk: '12345678' });
const usage = await client.usage.get();
```

Or initialize manually:

```ts
const client = new LidlConnect('069012345678', { puk: '12345678' });
await client.initialize();

// ...

await client.logout();
```

Password auth is also supported:

```ts
const client = await LidlConnect.create('069012345678', { password: 'yourPassword' });
```

## API

### `client.user`

```ts
await client.user.get()               // full user object
await client.user.name
await client.user.phoneNumber
await client.user.balance
await client.user.bonusBalance
await client.user.status
await client.user.hasPassword
await client.user.birthDate
await client.user.customerType
await client.user.customerLanguage
await client.user.activationDate
await client.user.deactivationDate
await client.user.imsi
await client.user.iccid
await client.user.isEsim
await client.user.notificationSettings
await client.user.topupSettings
```

### `client.usage`

```ts
await client.usage.get()              // full usage object
await client.usage.data               // { remaining, total, used, unit }
await client.usage.euData
await client.usage.minutes
await client.usage.internationalMinutes
await client.usage.tariffName
await client.usage.validFrom
await client.usage.validTo
await client.usage.nextRenewal
await client.usage.grossPrice
await client.usage.downloadSpeed      // bytes/sec or null
await client.usage.uploadSpeed
await client.usage.queued
```

### `client.tariffs`

```ts
await client.tariffs.getCatalog()       // CMS catalog with names and descriptions
await client.tariffs.getSwitchable()    // tariffs switchable at next billing cycle
await client.tariffs.getPurchasable()   // add-ons available to buy now
await client.tariffs.getBalance()       // account balance
await client.tariffs.switch(itemId)     // schedule a tariff switch
await client.tariffs.buy(itemId)        // buy an add-on immediately
```

### `client.invoices`

```ts
await client.invoices.getInvoices()
await client.invoices.getVouchers()
await client.invoices.getCalls({ page, size })
await client.invoices.getConfig()
await client.invoices.getTimeline()
await client.invoices.downloadCalls()   // returns Uint8Array
await client.invoices.totalSpent()
await client.invoices.lastPaymentDate()
```

### `client.settings`

```ts
await client.settings.getServices()
await client.settings.getTopup()
await client.settings.getConsents()
await client.settings.getEgn()
await client.settings.updateService(serviceId, active)
await client.settings.updateTopup(settings)
await client.settings.updateNotifications(emailEnabled, smsEnabled)
await client.settings.updateEgn(maskPremium, maskNonPremium)
await client.settings.updateConsents(consents)
```

### `client.credit`

```ts
await client.credit.topup(code)
await client.credit.getBalance()
await client.credit.getPaymentChannels()
```

## Error handling

```ts
import { LidlConnect, AuthError, APIError } from 'lidlconnect';

try {
  const client = await LidlConnect.create('069012345678', { puk: '12345678' });
  console.log(await client.user.balance);
  await client.logout();
} catch (e) {
  if (e instanceof AuthError) {
    console.error('Login failed:', e.message);
  } else if (e instanceof APIError) {
    console.error(`API error ${e.statusCode}:`, e.message);
  } else {
    throw e;
  }
}
```

## Requirements

- Node 18+
- `cheerio` (installed automatically as a dependency)

## License

MIT

## Disclaimer

This is an unofficial library, not affiliated with or endorsed by Lidl or any of its affiliates.
