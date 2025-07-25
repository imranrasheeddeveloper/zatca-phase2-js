// src/invoiceBuilder.js

const { create } = require('xmlbuilder2');
const { PAYMENT_TYPES } = require('./constants');
const { v4: uuidv4 } = require('uuid');

/**
 * Build the JSON payload for a ZATCA UBL invoice / credit note.
 */
function buildInvoiceData(invoiceData, clientData, typeCode, config) {
  const ICV = config.ICV;
  const PIH = config.PIH;
  const vatRate = config.vatRate ?? 15;
  const uuid = uuidv4();

  let lineExtensionAmount = 0;
  let taxExclusiveAmount   = 0;
  let allowanceTotalAmount = 0;
  const items = [];

  invoiceData.services.forEach((svc, idx) => {
    const price    = parseFloat(svc.amount);
    const qty      = parseFloat(svc.quantity ?? 1);
    const gross    = +(price * qty).toFixed(2);
    lineExtensionAmount += gross;

    const discUnit = svc.discount_type === '%'
      ? +(price * svc.discount / 100).toFixed(2)
      : +svc.discount;
    const totalDisc = +(discUnit * qty).toFixed(2);
    allowanceTotalAmount += totalDisc;

    const netLine = +(gross - totalDisc).toFixed(2);
    taxExclusiveAmount += netLine;

    const taxAmt   = +(netLine * vatRate / 100).toFixed(2);
    const roundAmt = +(netLine + taxAmt).toFixed(2);

    items.push({
      id:                    idx + 1,
      quantity:              qty,
      line_extension_amount: gross.toFixed(2),
      tax_total: {
        tax_amount:      taxAmt.toFixed(2),
        rounding_amount: roundAmt.toFixed(2)
      },
      name:                 svc.original_name,
      price_amount:         price.toFixed(2),
      allowance_charge: {
        charge_indicator:            totalDisc > 0 ? 'true' : 'false',
        allowance_charge_reason:     totalDisc > 0 ? 'discount' : null,
        amount:                      totalDisc.toFixed(2)
      }
    });
  });

  const taxTotalAmount    = +(taxExclusiveAmount * vatRate / 100).toFixed(2);
  const taxInclusiveAmount = +(taxExclusiveAmount + taxTotalAmount).toFixed(2);

  const paymentMeans = (invoiceData.sale_type || '').toLowerCase() === 'credit'
    ? PAYMENT_TYPES.CREDIT
    : PAYMENT_TYPES.CASH;

  return {
    invoice_number:   invoiceData.invoice_number,
    uuid,
    invoice_date:     invoiceData.issue_date.split('T')[0],
    invoice_time:     invoiceData.issue_date.split('T')[1].replace(/Z$/, ''),
    billing_reference:
      (typeCode === '388' ? 'Invoice Number: ' : 'Credit Note Number: ')
      + invoiceData.invoice_number + '; '
      + (typeCode === '388'
         ? 'Invoice Issue Date: '
         : 'Credit Note Issue Date: ')
      + invoiceData.issue_date.split('T')[0],
    ICV,
    PIH,
    supplier:         config.supplier,
    customer: {
      id:              clientData.cr_no,
      legal_name:      clientData.client_name,
      tax_id:          clientData.vat_no,
      address: {
        street:        clientData.StreetName,
        building_number: clientData.BuildingNumber,
        city_subdivision: clientData.District,
        city:            clientData.CityName,
        postal_zone:     clientData.PostalZone
      }
    },
    delivery_date:    invoiceData.invoice_supply_date,
    payment_means:    paymentMeans,
    allowance_charge: {
      charge_indicator:        allowanceTotalAmount > 0 ? 'true' : 'false',
      allowance_charge_reason: 'discount',
      amount:                  allowanceTotalAmount.toFixed(2)
    },
    items,
    totals: {
      currency_code:         'SAR',
      tax_total_amount:      taxTotalAmount.toFixed(2),
      line_extension_amount: lineExtensionAmount.toFixed(2),
      tax_exclusive_amount:  taxExclusiveAmount.toFixed(2),
      tax_inclusive_amount:  taxInclusiveAmount.toFixed(2),
      allowance_total_amount:allowanceTotalAmount.toFixed(2),
      payable_amount:         taxInclusiveAmount.toFixed(2),
      prepaid_amount:        '0.00'
    },
    typeCode
  };
}

/**
 * Generate minimal UBL Invoice XML; modifyXml will fill in CSID, PIH, lines, etc.
 */
function buildXml(data) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${data.invoice_number}</cbc:ID>
  <cbc:UUID>${data.uuid}</cbc:UUID>
  <cbc:IssueDate>${data.invoice_date}</cbc:IssueDate>
  <cbc:IssueTime>${data.invoice_time}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="">${data.typeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${data.billing_reference}</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${data.ICV}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject>${data.PIH}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
</Invoice>`;
}

module.exports = { buildInvoiceData, buildXml };
