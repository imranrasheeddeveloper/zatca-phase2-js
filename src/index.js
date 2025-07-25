// src/index.js

const { generateCsr }  = require('./csrGenerator');
const apiHelper        = require('./apiHelper');
const { buildInvoiceData, buildXml } = require('./invoiceBuilder');
const { signXml }      = require('./xmlSigner');
const { modifyXml, computeInvoiceHash, extractQrCode } = require('./invoiceHelper');
const { DOCUMENT_TYPES } = require('./constants');

class ZatcaClient {
  constructor(config, env = 'Simulation') {
    this.config   = config;
    this.env      = env;
    this.certInfo = null;
  }

  async onboard() {
    return await generateCsr(this.config, this.env);
  }

  async complianceCsid(certInfo) {
    const resp = await apiHelper.complianceCsid(certInfo);
    this.certInfo = { ...certInfo, ...resp };
    return resp;
  }

  async productionCsid() {
    if (!this.certInfo) throw new Error('Run complianceCsid first');
    const resp = await apiHelper.productionCsid(this.certInfo);
    this.certInfo = { ...this.certInfo, ...resp };
    return resp;
  }

  async report(invoiceData, clientData, prefix) {
    if (!this.certInfo) throw new Error('Missing certInfo');

    const docDef = DOCUMENT_TYPES.find(d => d.prefix === prefix);
    if (!docDef) throw new Error(`Unknown prefix: ${prefix}`);

    // 1) Build JSON → XML
    const data        = buildInvoiceData(invoiceData, clientData, docDef.typeCode, this.config);
    const unsignedXml = buildXml(data);

    // 2) Inject IDs, ICV/PIH, etc.
    const xmlWithRefs = modifyXml(unsignedXml, {
      id:               `${prefix}-0001`,
      invoiceTypeName:  prefix.startsWith('SIM') ? '0200000' : '0100000',
      invoiceTypeValue: docDef.typeCode,
      icv:              data.ICV,
      pih:              data.PIH,
      instructionNote:  docDef.instructionNote
    });

    // 3) Sign
    const signedXml = signXml(
      xmlWithRefs,
      this.certInfo.ccsid_binarySecurityToken,
      this.certInfo.ccsid_secret
    );

    // 4) Hash + QR
    const invoiceHash = computeInvoiceHash(signedXml);
    const qrCode      = extractQrCode(signedXml);

    // 5) Submit
    const response = prefix.startsWith('SIM')
      ? await apiHelper.invoiceReporting(this.certInfo, signedXml)
      : await apiHelper.invoiceClearance(this.certInfo, signedXml);

    return { response, invoiceHash, qrCode };
  }
}

module.exports = { ZatcaClient };
