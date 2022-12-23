function isBrowserOK() {
  let isBrowserOK = true;

  const supportsFetch = !!window.fetch;
  const supportsCrypto = !!window.crypto;
  const supportsCryptoSubtle = supportsCrypto && !!window.crypto.subtle;
  const supportsKeyExport =
    supportsCryptoSubtle && !!window.crypto.subtle.exportKey;

  if (!supportsFetch) isBrowserOK = false;
  if (!supportsCrypto) isBrowserOK = false;
  if (!supportsCryptoSubtle) isBrowserOK = false;
  if (!supportsKeyExport) isBrowserOK = false;

  return isBrowserOK;
}
