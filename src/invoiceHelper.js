// src/invoiceHelper.js

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const xpath = require('xpath');
const { SignedXml } = require('xml-crypto');
const crypto = require('crypto');

/**
 * Insert IDs, CSID, PIH, and optional InstructionNote.
 */
function modifyXml(xmlString, opts) {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
  const select = xpath.useNamespaces({
    cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'
  });

  const idNode = select('//cbc:ID', doc)[0];
  if (!idNode) throw new Error('<cbc:ID> not found');
  idNode.textContent = opts.id;

  const itc = select('//cbc:InvoiceTypeCode', doc)[0];
  if (!itc) throw new Error('<cbc:InvoiceTypeCode> not found');
  itc.textContent = opts.invoiceTypeValue;
  itc.setAttribute('name', opts.invoiceTypeName);

  const icvNode = select("//cac:AdditionalDocumentReference[cbc:ID='ICV']/cbc:UUID", doc)[0];
  if (icvNode) icvNode.textContent = opts.icv;

  const pihNode = select("//cac:AdditionalDocumentReference[cbc:ID='PIH']/cac:Attachment/cbc:EmbeddedDocumentBinaryObject", doc)[0];
  if (pihNode) pihNode.textContent = opts.pih;

  if (opts.instructionNote) {
    const pm = select('//cac:PaymentMeans', doc)[0];
    if (pm) {
      const instr = doc.createElement('cbc:InstructionNote');
      instr.textContent = opts.instructionNote;
      pm.appendChild(instr);
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Compute base64‑encoded SHA256 of the <Invoice> node.
 */
function computeInvoiceHash(signedXml) {
  const doc = new DOMParser().parseFromString(signedXml, 'application/xml');
  const select = xpath.useNamespaces({
    cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'
  });
  const node = select("//*[local-name()='Invoice']", doc)[0];
  if (!node) throw new Error('<Invoice> node not found');

  const c14n = new SignedXml()
    .getCanonAlgorithm('http://www.w3.org/TR/2001/REC-xml-c14n-20010315');
  const canonXml = c14n.process(node, doc);

  return crypto.createHash('sha256').update(canonXml).digest('base64');
}

/**
 * Extract the QR code payload (base64).
 */
function extractQrCode(signedXml) {
  const doc = new DOMParser().parseFromString(signedXml, 'application/xml');
  const select = xpath.useNamespaces({
    cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'
  });
  const qr = select("//cac:AdditionalDocumentReference[cbc:ID='QR']/cac:Attachment/cbc:EmbeddedDocumentBinaryObject", doc)[0];
  return qr ? qr.textContent : null;
}

module.exports = { modifyXml, computeInvoiceHash, extractQrCode };
