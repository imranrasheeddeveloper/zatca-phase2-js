// src/csrGenerator.js

const pem = require('pem');
const { promisify } = require('util');

// Promisify pem functions
const createCSR = promisify(pem.createCSR);
const createPrivateKey = promisify(pem.createPrivateKey);

/**
 * Determine the ASN.1 template name based on the environment.
 * @param {string} envType - 'NonProduction'|'Simulation'|'Production'
 * @returns {string}
 */
function getAsnTemplate(envType) {
  switch (envType) {
    case 'NonProduction': return 'TSTZATCA-Code-Signing';
    case 'Simulation':    return 'PREZATCA-Code-Signing';
    case 'Production':    return 'ZATCA-Code-Signing';
    default:
      throw new Error(`Invalid environment type: ${envType}`);
  }
}

/**
 * Generate a secp256k1 EC private key and CSR.
 * Uses OpenSSL via the pem module under the hood.
 * @param {object} config - CSR subject fields:
 *   { 'csr.common.name', 'csr.organization.name', 'csr.organization.unit.name', 'csr.country.name' }
 * @param {string} envType - Environment (for future use)
 * @returns {Promise<{ privateKey: string, csr: string }>} base64-encoded PEM bodies
 */
async function generateCsr(config, envType) {
  // 1) Generate EC private key (secp256k1)
  const keyResult = await createPrivateKey({
    type: 'ec',
    curve: 'secp256k1'
  });
  const privateKeyPem = keyResult.key;

  // 2) Build CSR options
  const csrOptions = {
    clientKey:        privateKeyPem,
    csrKey:           privateKeyPem,
    commonName:       config['csr.common.name'],
    organization:     config['csr.organization.name'],
    organizationUnit: config['csr.organization.unit.name'],
    country:          config['csr.country.name'],
    altNames:         []
  };

  // 3) Create CSR
  const { csr } = await createCSR(csrOptions);

  // 4) Strip PEM headers/footers and newlines
  const stripRegex = /-----BEGIN [^-]+-----|-----END [^-]+-----|\r?\n/g;
  const csrBase64       = Buffer.from(csr.replace(stripRegex, ''), 'utf8').toString('base64');
  const privateKeyBase64 = Buffer.from(privateKeyPem.replace(stripRegex, ''), 'utf8').toString('base64');

  return {
    privateKey: privateKeyBase64,
    csr:        csrBase64
  };
}

module.exports = { generateCsr };
