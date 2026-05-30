const fs = require("fs");
const path = require("path");

// Cache parsed phrase maps in memory, keyed by language code, so we only read
// and parse each i18n file from disk once per process.
const cache = {};

/**
 * Loads the invite-page i18n phrases for the given language and returns them as
 * a flat { key: translated } map.
 *
 * These are the same phrase files the static front end used to send to the API
 * as `emailPhrases` / `pushPhrases`.  In the server-rendered architecture we
 * read them directly off disk instead.  Falls back to English when the
 * requested language is unavailable.
 *
 * @param {string} lang - language code (e.g. "en", "es")
 * @returns {Object} flat map of phrase key -> translated string
 */
module.exports = function getInvitePhrases(lang) {
  const requested = (lang || "en").toLowerCase();

  const tryLangs = requested === "en" ? ["en"] : [requested, "en"];

  for (const code of tryLangs) {
    if (cache[code]) return cache[code];

    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "i",
      "i18n",
      `${code}.json`,
    );

    let raw;
    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      continue; // file for this language doesn't exist; try the next fallback
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.log(`unable to parse invite phrases for "${code}":`, err);
      continue;
    }

    const phrases = {};
    if (Array.isArray(parsed.phrases)) {
      parsed.phrases.forEach((item) => {
        if (item && item.key) {
          phrases[item.key] = item.translated;
        }
      });
    }

    cache[code] = phrases;
    return phrases;
  }

  return {};
};
