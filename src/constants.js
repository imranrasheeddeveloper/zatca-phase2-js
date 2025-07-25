// Payment means codes
const PAYMENT_TYPES = {
  CASH: '10',
  CREDIT: '30',
  BANK_ACCOUNT: '42',
  BANK_CARD: '48',
  MULTIPLE: '1',
};

// Document definitions
const DOCUMENT_TYPES = [
  { prefix: 'STDSI', typeCode: '388', description: 'Standard Invoice', instructionNote: '' },
  { prefix: 'STDCN', typeCode: '383', description: 'Standard CreditNote', instructionNote: '' },
  { prefix: 'STDDN', typeCode: '381', description: 'Standard DebitNote', instructionNote: '' },
  { prefix: 'SIMSI', typeCode: '388', description: 'Simplified Invoice', instructionNote: '' },
  { prefix: 'SIMCN', typeCode: '383', description: 'Simplified CreditNote', instructionNote: '' },
  { prefix: 'SIMDN', typeCode: '381', description: 'Simplified DebitNote', instructionNote: '' }
];

module.exports = { PAYMENT_TYPES, DOCUMENT_TYPES };
