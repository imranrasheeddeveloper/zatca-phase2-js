// src/xmlSigner.js

const { SignedXml } = require('xml-crypto');

/**
 * Enveloped-sign the <Invoice> element using RSA-SHA256 with xml-crypto.
 * @param {string} xmlString  Raw UBL Invoice XML string
 * @param {string} certBase64 Base64 (no headers) DER-encoded X.509 certificate
 * @param {string} keyBase64  Base64 (no headers) PKCS#8 RSA private key
 * @returns {string}          Full signed XML string
 */
function signXml(xmlString, certBase64, keyBase64) {
  // Wrap certificate and key in PEM format
  const certPem = `-----BEGIN CERTIFICATE-----
${certBase64}
-----END CERTIFICATE-----`;
  // Use RSA PRIVATE KEY wrapper (PKCS#1) if the key is PKCS#1
  const keyPem  = `-----BEGIN RSA PRIVATE KEY-----
${keyBase64}
-----END RSA PRIVATE KEY-----`;

  // Initialize the signer
  const sig = new SignedXml();
  sig.signingKey = keyPem;
  // Use RSA-SHA256
  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  
  // Include certificate in KeyInfo
  sig.keyInfoProvider = {
    getKeyInfo: () =>
      `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`
  };

  // Reference the Invoice element
  sig.addReference(
    "//*[local-name()='Invoice']",
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
    'http://www.w3.org/2001/04/xmlenc#sha256'
  );

  // Compute signature directly on the XML string
  sig.computeSignature(xmlString, {
    location: {
      reference: "//*[local-name()='Invoice']",
      action: 'append'
    }
  });

  // Return the signed XML
  return sig.getSignedXml();
}

module.exports = { signXml };
