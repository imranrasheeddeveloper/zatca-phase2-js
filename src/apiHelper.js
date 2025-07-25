const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

async function sendRequestWithRetry(url, headers, payload, auth, method = 'post') {
  const cfg = { url, method, headers, data: payload };
  if (auth) cfg.auth = { username: auth.username, password: auth.password };
  const res = await axios(cfg);
  return res.data;
}

async function complianceCsid(certInfo) {
  return sendRequestWithRetry(
    certInfo.complianceCsidUrl,
    {
      Accept: 'application/json',
      'Accept-Version': 'V2',
      OTP: certInfo.OTP,
      'Content-Type': 'application/json'
    },
    JSON.stringify({ csr: certInfo.csr })
  );
}

async function productionCsid(certInfo) {
  return sendRequestWithRetry(
    certInfo.productionCsidUrl,
    {
      Accept: 'application/json',
      'Accept-Version': 'V2',
      'Content-Type': 'application/json'
    },
    JSON.stringify({ compliance_request_id: certInfo.ccsid_requestID }),
    { username: certInfo.ccsid_binarySecurityToken, password: certInfo.ccsid_secret }
  );
}

async function invoiceReporting(certInfo, payload) {
  return sendRequestWithRetry(
    certInfo.reportingUrl,
    {
      Accept: 'application/json',
      'Accept-Version': 'V2',
      'Clearance-Status': '0',
      'Content-Type': 'application/json'
    },
    payload,
    { username: certInfo.pcsid_binarySecurityToken, password: certInfo.pcsid_secret }
  );
}

async function invoiceClearance(certInfo, payload) {
  return sendRequestWithRetry(
    certInfo.clearanceUrl,
    {
      Accept: 'application/json',
      'Accept-Version': 'V2',
      'Clearance-Status': '1',
      'Content-Type': 'application/json'
    },
    payload,
    { username: certInfo.pcsid_binarySecurityToken, password: certInfo.pcsid_secret }
  );
}

module.exports = {
  complianceCsid,
  productionCsid,
  invoiceReporting,
  invoiceClearance
};
