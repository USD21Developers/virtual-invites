const axios = require("axios");

// Looks up an IANA timezone name (e.g. "America/Phoenix") for the given IP
// using AbstractAPI's IP Geolocation endpoint. Returns null when the lookup
// can't be performed or the response doesn't include a timezone.
module.exports = async function getTimezoneFromIp(ip) {
  if (!ip) return null;

  const apiKey = process.env.ABSTRACTAPI_IP_GEOLOCATION_KEY;
  if (!apiKey) return null;

  const endpoint = `https://ipgeolocation.abstractapi.com/v1/?api_key=${apiKey}&ip_address=${encodeURIComponent(
    ip,
  )}`;

  try {
    const response = await axios.get(endpoint);
    const name =
      response && response.data && response.data.timezone
        ? response.data.timezone.name
        : null;
    return name || null;
  } catch (err) {
    return null;
  }
};
