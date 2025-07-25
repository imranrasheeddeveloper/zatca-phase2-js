// examples/onboard.js

const fs = require('fs');
const path = require('path');
const { ZatcaClient } = require('../src/index');
const config = require('./zatca-config.json');

(async () => {
  try {
    // 1) Instantiate the client in Simulation mode
    const client = new ZatcaClient(config, 'Simulation');

    // 2) Generate EC private key & CSR
    const { privateKey, csr } = await client.onboard();

    console.log('--- Generated Credentials ---');
    console.log('Private Key (base64):', privateKey);
    console.log('CSR (base64):', csr);

    // 3) Persist to disk
    const outDir = path.join(__dirname);
    fs.writeFileSync(path.join(outDir, 'privateKey.b64'), privateKey, 'utf8');
    fs.writeFileSync(path.join(outDir, 'csr.b64'), csr, 'utf8');
    console.log('Saved to examples/privateKey.b64 and examples/csr.b64');
  } catch (err) {
    console.error('Onboard failed:', err);
    process.exit(1);
  }
})();
