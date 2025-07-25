# zatca-phase2-js

**ZATCA Phase 2 JavaScript SDK**
A Node.js client library for Saudi ZATCA e‑invoicing Phase 2 (UBL invoice generation, signing & submission).

## Features

* CSR/key generation (RSA 2048 + PEM/DER)
* Builds UBL‑compliant XML invoices & credit notes
* Inserts CSID, ICV/PIH, InstructionNote
* Enveloped XML‑DSIG signing (RSA‑SHA256)
* Submits to ZATCA compliance & clearance/reporting endpoints

## Installation

```bash
npm install
```

## Usage

### Onboard (get CSR + key)

```js
const { ZatcaClient } = require('zatca-phase2-js');
(async () => {
  const client = new ZatcaClient(require('./config/zatca.json'), 'Simulation');
  const { privateKey, csr } = await client.onboard();
  console.log('Private key (base64):', privateKey);
  console.log('CSR (base64):', csr);
})();
```

### Compliance & Production CSID

```js
await client.complianceCsid({ privateKey, csr, OTP: '123456' });
await client.productionCsid();
```

### Report an Invoice

```js
const invoiceData = require('./examples/invoice.json');
const customer    = require('./examples/customer.json');
const result      = await client.report(invoiceData, customer, 'STDSI');
console.log(result);
```

## Scripts

* `npm run onboard`
* `npm run report`

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR
