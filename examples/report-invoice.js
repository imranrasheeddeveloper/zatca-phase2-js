// examples/report-invoice.js

const { ZatcaClient } = require('../src/index');
const config = require('./zatca-config.json');

async function reportExample() {
  const client = new ZatcaClient(config, 'Simulation');

  // 1) Load your previously saved certInfo (after CSID calls)
  //    For demo, we mock these values:
  client.certInfo = {
    ccsid_binarySecurityToken: '…base64Cert…',
    ccsid_secret:              '…secret…',
    pcsid_binarySecurityToken: '…base64Cert…',
    pcsid_secret:              '…secret…',
    reportingUrl:              config.reportingUrl,
    clearanceUrl:              config.clearanceUrl
  };

  // 2) Your raw invoice data
  const invoiceData = {
    invoice_number:      'INV-1001',
    issue_date:          '2025-07-25T14:30:00Z',
    invoice_supply_date: '2025-07-25',
    sale_type:           'Cash',
    services: [
      { amount: '100.00', quantity: 2, discount: 5, discount_type: '%', original_name: 'Widget A' },
      { amount: ' 50.00', quantity: 1, discount: 0, discount_type: 'fixed', original_name: 'Widget B' }
    ]
  };

  // 3) Customer info
  const clientData = {
    cr_no:         '7001234567',
    client_name:   'Acme Corp',
    vat_no:        '300987654300003',
    StreetName:    'King Fahd Rd',
    BuildingNumber:'12',
    District:      'Olaya',
    CityName:      'Riyadh',
    PostalZone:    '11564'
  };

  // 4) Submit a Standard Invoice ("STDSI")
  const response = await client.report(invoiceData, clientData, 'STDSI');
  console.log('ZATCA API response:', response);
}

reportExample().catch(err => {
  console.error('Report failed:', err);
  process.exit(1);
});
