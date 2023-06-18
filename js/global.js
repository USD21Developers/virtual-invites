let globalContent = "";
let pageContent = "";
let previewContent = "";
var hidden, visibilityChange;

/*
  FUNCTIONS:

  invitesCrypto
    .decrypt
    .decryptMessage
    .deserialize
    .encrypt
    .encryptMessage
    .generateIV
    .generateKey
    .getMessageEncoding
    .hash
    .importSecretKey
    .serialize
  breakify
  clearErrorMessages
  clearStorage
  customScrollTo
  enableTooltips
  formError
  formErrorsReset
  getAccessToken
  getChurches
  getApiHost
  getApiServicesHost
  getCountryName
  getCountries
  getFollowedUser
  getHash
  getLang
  getCountry
  getLocale
  getNextRecurringWeekday
  getPhrase
  getGlobalPhrase
  getPreviewPhrase
  getRecurringWeekdayName
  getStoredChurch
  getTimezoneOffset
  getUserChurchId
  getUserId
  globalHidePageSpinner
  globalShowPageSpinner
  hamburgerClose
  hide
  hideToast
  isMobileDevice
  populateContent
  populateGlobalContent
  popupQuantityOfEvents
  randomIntFromInterval
  refreshFloatingLabels
  refreshFloatingLabelsListener
  setCountry
  show
  showAlert
  showEventDateTime
  showMaterialIcons
  showModal
  showToast
  spacify
  updateFollowActivity
  validateEmail
*/

const invitesCrypto = {
  decrypt: async (strKey, encryptionObject) => {
    const key = await invitesCrypto.key.deserialize(strKey);
    const iv = invitesCrypto.iv.deserialize(encryptionObject.iv);
    const ciphertextBase64 = encryptionObject.ciphertext;
    const ciphertextArray = new Uint8Array(
      atob(ciphertextBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const plainText = await invitesCrypto.decryptMessage(
      key,
      iv,
      ciphertextArray.buffer
    );
    return plainText;
  },

  decryptMessage: async (key, iv, ciphertext) => {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-CTR",
        counter: iv,
        length: 64,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  },

  encrypt: async (strKey, plaintext) => {
    if (typeof strKey !== "string" || strKey.length === 0)
      return new Error("key must be a string");
    const iv = invitesCrypto.iv.generate();
    const strIV = invitesCrypto.iv.serialize(iv);
    const algorithm = { name: "AES-CTR", counter: iv, length: 64 };
    const key = await invitesCrypto.key.deserialize(strKey);
    const plaintextBuffer = new TextEncoder().encode(plaintext).buffer;
    const ciphertext = await crypto.subtle.encrypt(
      algorithm,
      key,
      plaintextBuffer
    );
    const ciphertextBase64 = btoa(
      String.fromCharCode(...new Uint8Array(ciphertext))
    );
    const encryptionObject = {
      iv: strIV,
      ciphertext: ciphertextBase64,
    };

    return encryptionObject;
  },

  encryptMessage: async (key, iv, message) => {
    const encoded = invitesCrypto.getMessageEncoding(message);
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoded
    );

    return ciphertext;
  },

  generateKey: () => {
    return new Promise((resolve, reject) => {
      window.crypto.subtle
        .generateKey(
          {
            name: "AES-CTR",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"]
        )
        .then(async (cryptoKey) => {
          const arrayBuffer = await window.crypto.subtle.exportKey(
            "raw",
            cryptoKey
          );
          const strKey = invitesCrypto.key.serialize(arrayBuffer);
          resolve(strKey);
        })
        .catch((err) => {
          reject(new Error(err));
        });
    });
  },

  getMessageEncoding: (message) => {
    const enc = new TextEncoder();
    return enc.encode(message);
  },

  hash: async (str) => {
    const buf = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder("utf-8").encode(str)
    );
    return Array.prototype.map
      .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  },

  importSecretKey: (rawKey) => {
    return window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
  },

  iv: {
    generate: () => {
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      return iv;
    },
    serialize: (iv) => {
      const encoded = String.fromCharCode(...iv);
      const strIV = btoa(encoded);
      return strIV;
    },
    deserialize: (strIV) => {
      const encoded = atob(strIV);
      const iv = Uint8Array.from(encoded, (c) => c.charCodeAt(0));
      return iv;
    },
  },

  key: {
    serialize: (key) => {
      const buffer = new Uint8Array(key);
      const strKey = JSON.stringify(Array.from(buffer));
      return strKey;
    },

    deserialize: (strKey) => {
      return new Promise(async (resolve, reject) => {
        const array = atob(localStorage.getItem("datakey"))
          .split(",")
          .map(Number);
        const key = await window.crypto.subtle.importKey(
          "raw",
          new Uint8Array(array),
          "AES-CTR",
          true,
          ["encrypt", "decrypt"]
        );

        resolve(key);
      });
    },
  },

  serialize: (buffer) => {
    const serialized = JSON.stringify(Array.from(buffer));
    return serialized;
  },

  test: async () => {
    const message = "Cuppa coffee for the big time!";
    console.log(message);
    const strKey = await invitesCrypto.generateKey();
    const encryptionObject = await invitesCrypto.encrypt(strKey, message);
    console.log(encryptionObject);
    const decrypted = await invitesCrypto.decrypt(strKey, encryptionObject);
    console.log(decrypted);
  },
};

function breakify(text) {
  return text.replace(/(?:\r\n|\r|\n)/g, "<br>\n");
}

function clearErrorMessages() {
  document.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });
}

async function clearStorage() {
  await localforage.clear().catch((err) => console.error(err));
  localStorage.removeItem("lastEventSelected");
  localStorage.removeItem("country");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("datakey");
  sessionStorage.removeItem("accessToken");
}

function configureLocalForage() {
  if (typeof localforage === "undefined") return;
  localforage.config({
    name: "invites",
    version: 1.0,
    storeName: "keyvaluepairs",
    description: "Data store for the Invites app",
  });
}

function customScrollTo(selector) {
  const element = document.querySelector(selector);
  const offset = 94;
  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = element.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({ top: offsetPosition, behavior: "smooth", block: "center" });
  if (!isMobileDevice()) element.focus();
}

function enableTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

function formError(selector, message = "") {
  const element = document.querySelector(selector);
  const feedback = document.querySelector(`${selector} + .invalid-feedback`);

  if (feedback) feedback.innerHTML = message;

  element.classList.add("is-invalid");
  customScrollTo(selector);

  if (element.tagName === "INPUT") {
    const type = element.getAttribute("type");

    if (
      [
        "color",
        "date",
        "datetime-local",
        "email",
        "month",
        "number",
        "search",
        "tel",
        "text",
        "time",
        "url",
        "week",
      ].includes(type)
    ) {
      element.addEventListener("blur", (e) => {
        if (e.target.value !== "") {
          e.target.classList.remove("is-invalid");
        }
      });
    } else if (type === "radio") {
      const radioName = element.getAttribute("name");
      let anyRadioChecked = false;
      let blankRadioChecked = false;
      element.parentElement
        .querySelectorAll(`input[type="radio"][name=${radioName}]`)
        .forEach((item) => {
          if (item.checked === true) {
            anyRadioChecked = true;
          }

          if (item.value === "") {
            blankRadioChecked = true;
          }
        });
      if (anyRadioChecked && !blankRadioChecked) {
        element.parentElement.querySelector(".invalid-feedback").innerText = "";
        element.parentElement
          .querySelectorAll(`input[type="radio"][name=${radioName}]`)
          .forEach((item) => {
            item.classList.remove("is-invalid");
          });
      }
    }
  } else if (element.tagName === "TEXTAREA") {
    element.addEventListener("blur", (e) => {
      e.target.value.trim();
      if (e.target.value !== "") {
        e.target.classList.remove("is-invalid");
      }
    });
  } else if (element.tagName === "SELECT") {
    element.addEventListener("change", (e) => {
      if (e.target.value !== "") {
        e.target.classList.remove("is-invalid");
      }
    });
  }

  if (!isMobileDevice()) element.focus();
}

function formErrorsReset() {
  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));
  document
    .querySelectorAll(".invalid-feedback")
    .forEach((item) => (item.innerHTML = ""));
  document
    .querySelectorAll(".invalid-feedback-unbound")
    .forEach((item) => item.classList.add("d-none"));
}

function getAccessToken() {
  let needToRefresh = false;
  const accessToken = sessionStorage.getItem("accessToken") || "";
  const now = Date.now().valueOf() / 1000;
  let expiry = now;
  try {
    expiry = JSON.parse(atob(accessToken.split(".")[1])).exp;
    if (expiry < now) needToRefresh = true;
  } catch (err) {
    needToRefresh = true;
  }
  return new Promise((resolve, reject) => {
    if (!needToRefresh) return resolve(accessToken);
    const refreshToken = localStorage.getItem("refreshToken") || "";
    if (!refreshToken.length) return reject("refresh token missing");

    const endpoint = `${getAPIHost()}/invites/refresh-token`;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "tokens renewed":
            const { accessToken, refreshToken } = data;
            localStorage.setItem("refreshToken", refreshToken);
            sessionStorage.setItem("accessToken", accessToken);
            const country =
              JSON.parse(atob(accessToken.split(".")[1])).country || "us";
            setCountry(country);
            resolve(accessToken);
            break;
          default:
            resolve("could not get access token");
            break;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function getChurches() {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiServicesHost()}/churches`;
    const churchesStored = localStorage.getItem("churches") || "";

    if (churchesStored.length) {
      return resolve(JSON.parse(churchesStored));
    }

    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msgType) {
          case "success":
            localStorage.setItem("churches", JSON.stringify(data.churches));
            resolve(data.churches);
            break;
          default:
            console.error(data.msg);
            reject(data.msg);
        }
      });
  });
}

function getApiHost() {
  let host;

  switch (window.location.hostname) {
    case "staging.invites.mobi":
      host = "https://api.usd21.org/invites";
      break;
    case "staging.invites.usd21.org":
      host = "https://api.usd21.org/invites";
      break;
    case "invites.mobi":
      host = "https://api.usd21.org/invites";
      break;
    case "invites.usd21.org":
      host = "https://api.usd21.org/invites";
      break;
    default:
      host = `http://${window.location.hostname}:4000/invites`;
      break;
  }

  return host;
}

function getApiServicesHost() {
  let host;

  switch (window.location.hostname) {
    case "staging.invites.mobi":
      host = "https://api.usd21.org/services";
      break;
    case "staging.invites.usd21.org":
      host = "https://api.usd21.org/services";
      break;
    case "invites.mobi":
      host = "https://api.usd21.org/services";
      break;
    case "invites.usd21.org":
      host = "https://api.usd21.org/services";
      break;
    default:
      host = `http://${window.location.hostname}:4000/services`;
      break;
  }

  return host;
}

function getCountryName(iso, countryData) {
  if (!Array.isArray(countryData)) return;

  const countryDataLength = countryData.length;

  let countryName = "";
  for (let i = 0; i < countryDataLength; i++) {
    if (countryData[i].iso === iso) {
      countryName = countryData[i].name;
      break;
    }
  }

  return countryName;
}

function getCountries(lang) {
  const endpoint = `${getApiServicesHost()}/country-names/${lang}`;
  const countriesStored = localStorage.getItem("countries") || "";
  const isOffline = navigator.onLine ? false : true;

  return new Promise(async (resolve, reject) => {
    // Validate
    if (typeof lang !== "string")
      return reject(new Error("language code is required"));
    if (lang.length !== 2)
      return reject(new Error("language code must be exactly 2 characters"));

    // Use locally stored data if possible
    if (countriesStored.length) {
      const countriesParsed = JSON.parse(countriesStored);
      const langStored = countriesParsed.lang;

      if (langStored === lang) {
        return resolve(countriesParsed);
      }
    }

    if (isOffline) {
      reject(new Error("user is offline"));
    }

    // Fetch data
    const accessToken = await getAccessToken();
    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msgType) {
          case "success":
            localStorage.setItem(
              "countries",
              JSON.stringify(data.countryNames)
            );
            resolve(data.countryNames);
          default:
            reject(new Error(data.msg));
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function getFollowedUser(userid) {
  return new Promise(async (resolve, reject) => {
    if (!typeof localforage)
      reject(new Error("localforage is a required dependency"));
    const followedUsers = await localforage.getItem("followedUsers");
    if (!followedUsers)
      return new Error("missing followedUsers key in IndexedDB");
    const user = followedUsers.find((item) => (item.userid = userid));
    if (!user) return reject(false);
    return resolve(user);
  });
}

function getHash() {
  return (
    document.location.hash.substring(1, document.location.hash.length) || ""
  );
}

function getLang() {
  const refreshToken = localStorage.getItem("refreshToken");
  let lang = "en";

  if (typeof refreshToken === "string") {
    lang = JSON.parse(
      atob(localStorage.getItem("refreshToken").split(".")[1])
    ).lang;
    if (typeof lang === "undefined") {
      return (window.location.href = "/logout/");
    }
  } else {
    try {
      lang = navigator.language.substring(0, 2);
    } catch (e) {
      console.error(e);
    }
  }

  return lang;
}

function getCountry() {
  const refreshToken = localStorage.getItem("refreshToken");
  let country = "US";

  if (typeof refreshToken === "string") {
    country = JSON.parse(
      atob(localStorage.getItem("refreshToken").split(".")[1])
    ).country;
    if (typeof country === "undefined") {
      return (window.location.href = "/logout/");
    }
  } else {
    try {
      const detectedCountry = navigator.language.substring(3, 6);
      if (detectedCountry.length === 2) country = detectedCountry;
    } catch (e) {
      console.error(e);
    }
  }

  return country;
}

function getLocale() {
  const lang = getLang().toLowerCase();
  const country = getCountry().toUpperCase();
  const locale = `${lang}-${country}`;

  if (locale.length !== 5) {
    return "en-US";
  }

  return locale;
}

function getNextRecurringWeekday(date, time) {
  const isValidDate = moment(`${date} ${time}`).isValid();

  if (!isValidDate) {
    return console.error(
      "The date and time passed to getNextRecurringWeekday() are invalid:",
      date,
      time
    );
  }

  const initialDateTime = moment(`${date} ${time}`);
  const now = moment();
  const weekdayOfEvent = initialDateTime.day();
  const weekdayOfToday = now.day();

  // If the initial date and time are in the FUTURE, then the next occurrence is in the future.  Use "initialDateTime."
  if (initialDateTime > now) return initialDateTime.format("YYYY-MM-DD");

  // If the initial date is in the PAST, calculate a future date based on the difference in weekdays and use it as the next occurrence.  Use "futureDateTime."
  const numDaysAhead =
    weekdayOfEvent >= weekdayOfToday
      ? weekdayOfEvent - weekdayOfToday
      : 7 - (weekdayOfToday - weekdayOfEvent);
  const futureDate = now.add(numDaysAhead, "days").format("YYYY-MM-DD");
  const futureDateTime = moment(`${futureDate} ${time}`);
  return futureDateTime.format("YYYY-MM-DD");
}

function getPhrase(key) {
  let content = "";
  const errorMessage = `phrase key "${key}" was not found`;
  if (!key) throw errorMessage;
  if (!pageContent.hasOwnProperty("phrases")) throw errorMessage;
  if (!Array.isArray(pageContent.phrases)) throw errorMessage;
  const phrase = pageContent.phrases.find((item) => item.key == key);
  if (!phrase) throw errorMessage;
  content = phrase.translated || "";
  const hasChanges = Array.isArray(phrase.changes);
  if (hasChanges) {
    phrase.changes.forEach((change) => {
      const { original, translated, bold, italic, underline, link } = change;
      let changed = translated;
      if (link) changed = `<a href="${link}" class="alert-link">${changed}</a>`;
      if (bold) changed = `<strong>${changed}</strong>`;
      if (italic) changed = `<em>${changed}</em>`;
      if (underline) changed = `<u>${changed}</u>`;
      content = content.replaceAll(original, changed);
    });
  }
  try {
    return content;
  } catch (err) {
    console.error(err);
    return content;
  }
}

function getGlobalPhrase(key) {
  let content = "";
  const errorMessage = `phrase key "${key}" was not found`;
  if (!key) throw errorMessage;
  if (!globalContent.hasOwnProperty("phrases")) throw errorMessage;
  if (!Array.isArray(globalContent.phrases)) throw errorMessage;
  const phrase = globalContent.phrases.find((item) => item.key == key);
  if (!phrase) throw errorMessage;
  content = phrase.translated || "";
  const hasChanges = Array.isArray(phrase.changes);
  if (hasChanges) {
    phrase.changes.forEach((change) => {
      const { original, translated, bold, italic, underline, link } = change;
      let changed = translated;
      if (link) changed = `<a href="${link}" class="alert-link">${changed}</a>`;
      if (bold) changed = `<strong>${changed}</strong>`;
      if (italic) changed = `<em>${changed}</em>`;
      if (underline) changed = `<u>${changed}</u>`;
      content = content.replaceAll(original, changed);
    });
  }
  try {
    return content;
  } catch (err) {
    console.error(err);
    return content;
  }
}

function getPreviewPhrase(key) {
  let content = "";
  const errorMessage = `phrase key "${key}" was not found`;
  if (!key) throw errorMessage;
  if (!previewContent.hasOwnProperty("phrases")) throw errorMessage;
  if (!Array.isArray(previewContent.phrases)) throw errorMessage;
  const phrase = previewContent.phrases.find((item) => item.key == key);
  if (!phrase) throw errorMessage;
  content = phrase.translated || "";
  const hasChanges = Array.isArray(phrase.changes);
  if (hasChanges) {
    phrase.changes.forEach((change) => {
      const { original, translated, bold, italic, underline, link } = change;
      let changed = translated;
      if (link) changed = `<a href="${link}" class="alert-link">${changed}</a>`;
      if (bold) changed = `<strong>${changed}</strong>`;
      if (italic) changed = `<em>${changed}</em>`;
      if (underline) changed = `<u>${changed}</u>`;
      content = content.replaceAll(original, changed);
    });
  }
  try {
    return content;
  } catch (err) {
    console.error(err);
    return content;
  }
}

function getRecurringWeekdayName(frequency) {
  let weekday = "";

  switch (frequency) {
    case "Every Sunday":
      weekday = getGlobalPhrase("frequencyEverySunday");
      break;
    case "Every Monday":
      weekday = getGlobalPhrase("frequencyEveryMonday");
      break;
    case "Every Tuesday":
      weekday = getGlobalPhrase("frequencyEveryTuesday");
      break;
    case "Every Wednesday":
      weekday = getGlobalPhrase("frequencyEveryWednesday");
      break;
    case "Every Thursday":
      weekday = getGlobalPhrase("frequencyEveryThursday");
      break;
    case "Every Friday":
      weekday = getGlobalPhrase("frequencyEveryFriday");
      break;
    case "Every Saturday":
      weekday = getGlobalPhrase("frequencyEverySaturday");
      break;
  }

  return weekday;
}

function getStoredChurch(churchid) {
  const churchesJSON = localStorage.getItem("churches");

  if (!churchesJSON) return;

  const churches = JSON.parse(churchesJSON);
  const church = churches.find((item) => item.id === churchid);

  return church;
}

function getTimezoneOffset(timezoneName) {
  const offset = moment.tz(timezoneName)._offset;
  const hours = Math.floor(offset / 60);
  const minutes = Math.abs(Math.floor(offset % 60));
  const returnVal = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;

  return returnVal;
}

function getUserChurchId(userid) {
  const churchid = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;
  return churchid;
}

function getUserId() {
  const userid = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).userid;
  return userid;
}

function globalHidePageSpinner() {
  const breadcrumbs = document.querySelector("#breadcrumbs");
  const pageSpinner = document.querySelector("#pageSpinner");
  const mainContent = document.querySelector(".mainContent");

  if (breadcrumbs) {
    breadcrumbs.querySelector(".breadcrumb").style.display = "flex";
    breadcrumbs.classList.remove("d-none");
  }

  pageSpinner.classList.add("d-none");
  mainContent.classList.remove("d-none");
}

function globalShowPageSpinner() {
  const breadcrumbs = document.querySelector("#breadcrumbs");
  const pageSpinner = document.querySelector("#pageSpinner");
  const mainContent = document.querySelector(".mainContent");

  breadcrumbs?.classList.add("d-none");
  pageSpinner.classList.remove("d-none");
  mainContent.classList.add("d-none");
}

function hamburgerClose() {
  const navdrawerDefault = document.querySelector("#navdrawerDefault");
  const backdrop = document.querySelector(".navdrawer-backdrop");
  navdrawerDefault.classList.remove("show");
  backdrop.classList.remove("show");
}

function randomIntFromInterval(min = 0, max = 500) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function hide(selector) {
  selector.classList.add("d-none");
}

function isMobileDevice() {
  const result = "ontouchstart" in document.documentElement ? true : false;
  return result;
}

async function populateContent(customEndpoint, variable = "pageContent") {
  return new Promise((resolve, reject) => {
    const lang = localStorage.getItem("lang") || "en";
    const endpoint = customEndpoint ? customEndpoint : `i18n/${lang}.json`;

    fetch(endpoint)
      .then((res) => res.json())
      .then(async (data) => {
        if (variable === "previewContent") {
          previewContent = data;
        } else {
          pageContent = data;
        }
        const contentitems = [];
        data.phrases.forEach((phrase) => {
          const { key, translated, changes } = phrase;
          const hasChanges = Array.isArray(changes);
          let content = translated;
          content = content.replaceAll("  ", " &nbsp;");
          if (hasChanges) {
            changes.forEach((change) => {
              const {
                original,
                translated,
                bold,
                italic,
                underline,
                link,
                code,
              } = change;
              let changed = translated;
              if (link) changed = `<a href="${link}">${changed}</a>`;
              if (code) changed = `<code>${changed}</code>`;
              if (bold) changed = `<strong>${changed}</strong>`;
              if (italic) changed = `<em>${changed}</em>`;
              if (underline) changed = `<u>${changed}</u>`;
              content = content.replaceAll(original, changed);
            });
          }
          contentitems.push({ key: key, content: content });
        });
        document.querySelectorAll("[data-i18n]").forEach((item) => {
          const key = item.getAttribute("data-i18n");
          const matchedcontent = contentitems.find(
            (contentitem) => contentitem.key == key
          )?.content;
          if (matchedcontent) item.innerHTML = matchedcontent;
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach((item) => {
          const key = item.getAttribute("data-i18n-placeholder");
          const matchedcontent = contentitems.find(
            (contentitem) => contentitem.key == key
          )?.content;
          if (matchedcontent) item.setAttribute("placeholder", matchedcontent);
        });
        await populateGlobalContent();
        refreshFloatingLabels();
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function populateGlobalContent() {
  return new Promise((resolve, reject) => {
    const lang = localStorage.getItem("lang") || "en";
    const endpoint = `/i18n-global/${lang}.json`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        globalContent = data;
        const contentitems = [];
        data.phrases.forEach((phrase) => {
          const { key, translated, changes } = phrase;
          const hasChanges = Array.isArray(changes);
          let content = translated;
          content = content.replaceAll("  ", " &nbsp;");
          if (hasChanges) {
            changes.forEach((change) => {
              const {
                original,
                translated,
                bold,
                italic,
                underline,
                link,
                code,
              } = change;
              let changed = translated;
              if (link) changed = `<a href="${link}">${changed}</a>`;
              if (code) changed = `<code>${changed}</code>`;
              if (bold) changed = `<strong>${changed}</strong>`;
              if (italic) changed = `<em>${changed}</em>`;
              if (underline) changed = `<u>${changed}</u>`;
              content = content.replaceAll(original, changed);
            });
          }
          contentitems.push({ key: key, content: content });
        });
        document.querySelectorAll("[data-i18n-global]").forEach((item) => {
          const key = item.getAttribute("data-i18n-global");
          const matchedcontent = contentitems.find(
            (contentitem) => contentitem.key == key
          )?.content;
          if (matchedcontent) item.innerHTML = matchedcontent;
        });
        document
          .querySelectorAll("[data-i18n-global-aria-label]")
          .forEach((item) => {
            const key = item.getAttribute("data-i18n-global-aria-label");
            const matchedcontent = contentitems.find(
              (contentitem) => contentitem.key == key
            )?.content;
            if (matchedcontent) item.setAttribute("aria-label", matchedcontent);
          });
        const profileImageNav = document.querySelector(".profileImageNav");
        const refreshToken = localStorage.getItem("refreshToken");
        const accessToken = sessionStorage.getItem("accessToken");
        if (profileImageNav && refreshToken && accessToken) {
          const { firstname, lastname, profilephoto } = JSON.parse(
            atob(localStorage.getItem("refreshToken").split(".")[1])
          );
          const userFullName = `${firstname} ${lastname}`;
          const profilePhotoNav = profilephoto.replace("400", "140");
          const altText = getGlobalPhrase("profilePhotoAlt").replace(
            "{name}",
            userFullName
          );
          const img = `<img src="${profilePhotoNav}" alt="${altText}" />`;
          profileImageNav.innerHTML = img;
          profileImageNav
            ?.querySelector("img")
            .setAttribute("src", profilePhotoNav);
          profileImageNav?.classList.remove("d-none");
        }
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function popupQuantityOfEvents(type) {
  const eventsByUser = await localforage.getItem("events");
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  const quantityEventsByUser = eventsByUser ? eventsByUser.length : 0;
  const quantityEventsByFollowedUsers = eventsByFollowedUsers
    ? eventsByFollowedUsers.length
    : 0;
  const totalQuantity = quantityEventsByUser + quantityEventsByFollowedUsers;
  const phraseEvents = getGlobalPhrase("events");
  const phrasePlural = getGlobalPhrase("quantityOfEvents").replace(
    "{quantity}",
    totalQuantity
  );
  const phraseSingular = getGlobalPhrase("quantityOfEvents1");

  const phrase = totalQuantity === 1 ? phraseSingular : phrasePlural;
  const toastHTML = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="99%">
          ${phrase}
        </td>
        
        <td width="1%">
          <div class="text-right">
            <a class="btn btn-sm btn-light ml-4 border border-dark" href="/events/">${phraseEvents}</a>
          </div>
        </td>
      </tr>
    </table>
  `;

  let selector;
  const followSelector = "#eventsToastOnFollow";
  const unfollowSelector = "#eventsToastOnUnfollow";

  if (type === "unfollow") {
    selector = followSelector;
    hideToast(unfollowSelector);
  } else if (type === "follow") {
    selector = unfollowSelector;
    hideToast(followSelector);
  }

  if (window.location.pathname === "/events/") {
    showToast(phrase, 4000, "info", selector);
  } else {
    showToast(toastHTML, 4000, "info", selector);
  }
}

function refreshFloatingLabels() {
  if (!document[hidden]) {
    document.querySelectorAll("input, select").forEach((item) => {
      if (item.value !== "") {
        item.parentElement.classList.add("has-value");
      }
    });
  }
}

function refreshFloatingLabelsListener() {
  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  window.addEventListener(visibilityChange, refreshFloatingLabels);
}

function setCountry(country) {
  localStorage.setItem("country", country);
}

function show(selector) {
  selector.classList.remove("d-none");
}

function showAlert(selectorObject, message, headline = "") {
  const offset = selectorObject.offsetTop - 64;
  const contentEl = selectorObject.querySelector(".alert");
  const html = headline.length
    ? `<h3 class="alert-heading">${headline}</h3>${message}`
    : message;

  contentEl.innerHTML = html;
  selectorObject.classList.remove("d-none");
  window.scroll({ top: offset, behavior: "smooth" });
}

function showEventDateTime(eventObj) {
  return new Promise(async (resolve, reject) => {
    const {
      country,
      frequency,
      duration,
      startdate,
      multidaybegindate,
      multidayenddate,
      timezone,
    } = eventObj;
    const lang = getLang();
    const locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
    const eventPhrasesAll = await fetch(`/events/i18n/${lang}.json`).then(
      (res) => res.json()
    );
    const eventPhrases = eventPhrasesAll.phrases;
    const from = eventPhrases.filter((item) => item.key === "from")[0]
      .translated;
    const to = eventPhrases.filter((item) => item.key === "to")[0].translated;
    const frequencyEverySunday = eventPhrases.filter(
      (item) => item.key === "frequencyEverySunday"
    )[0].translated;
    const frequencyEveryMonday = eventPhrases.filter(
      (item) => item.key === "frequencyEveryMonday"
    )[0].translated;
    const frequencyEveryTuesday = eventPhrases.filter(
      (item) => item.key === "frequencyEveryTuesday"
    )[0].translated;
    const frequencyEveryWednesday = eventPhrases.filter(
      (item) => item.key === "frequencyEveryWednesday"
    )[0].translated;
    const frequencyEveryThursday = eventPhrases.filter(
      (item) => item.key === "frequencyEveryThursday"
    )[0].translated;
    const frequencyEveryFriday = eventPhrases.filter(
      (item) => item.key === "frequencyEveryFriday"
    )[0].translated;
    const frequencyEverySaturday = eventPhrases.filter(
      (item) => item.key === "frequencyEverySaturday"
    )[0].translated;
    const isRecurring = frequency !== "once";
    let html = "";

    if (isRecurring) {
      const whenTimeLocal = new Date(moment.tz(startdate, timezone).format());
      const whenTime = Intl.DateTimeFormat(locale, {
        timeStyle: "short",
      }).format(whenTimeLocal);
      let whenDate;
      switch (frequency) {
        case "Every Sunday":
          whenDate = frequencyEverySunday;
          break;
        case "Every Monday":
          whenDate = frequencyEveryMonday;
          break;
        case "Every Tuesday":
          whenDate = frequencyEveryTuesday;
          break;
        case "Every Wednesday":
          whenDate = frequencyEveryWednesday;
          break;
        case "Every Thursday":
          whenDate = frequencyEveryThursday;
          break;
        case "Every Friday":
          whenDate = frequencyEveryFriday;
          break;
        case "Every Saturday":
          whenDate = frequencyEverySaturday;
          break;
      }
      html = `<span class="eventDate">${whenDate}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime">${whenTime}</span>`;
    } else if (duration === "same day") {
      const whenDateLocal = new Date(moment.tz(startdate, timezone).format());
      const whenDate = Intl.DateTimeFormat(locale, {
        dateStyle: "short",
      }).format(whenDateLocal);
      const whenTime = Intl.DateTimeFormat(locale, {
        timeStyle: "short",
      }).format(whenDateLocal);
      html = `<span class="eventDate">${whenDate}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime">${whenTime}</span>`;
    } else if (duration === "multiple days") {
      const multidayBeginDateLocal = new Date(
        moment.tz(multidaybegindate, timezone).format()
      );
      const multidayEndDateLocal = new Date(
        moment.tz(multidayenddate, timezone).format()
      );
      const whenDateFrom = Intl.DateTimeFormat(locale, {
        dateStyle: "short",
      }).format(multidayBeginDateLocal);
      const whenTimeFrom = Intl.DateTimeFormat(locale, {
        timeStyle: "short",
      }).format(multidayBeginDateLocal);
      const whenDateTo = Intl.DateTimeFormat(locale, {
        dateStyle: "short",
      }).format(multidayEndDateLocal);
      const whenTimeTo = Intl.DateTimeFormat(locale, {
        timeStyle: "short",
      }).format(multidayEndDateLocal);
      html = `
        <span class="eventLabel from">${from}</span> <span class="eventDate from">${whenDateFrom}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime from">${whenTimeFrom}</span><br>
        <span class="eventLabel to">${to}</span> <span class="eventDate to">${whenDateTo}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime to">${whenTimeTo}</span><br>
      `;
    }

    resolve(html);
  });
}

function showMaterialIcons() {
  document
    .querySelectorAll(".material-icons")
    .forEach((item) => (item.style.opacity = "1"));
}

function showModal(
  body = "",
  title = "",
  backdrop = "static",
  selector = "#modal"
) {
  const modal = document.querySelector(selector);
  const modalTitle = modal.querySelector(".modal-title");

  if (title === "") {
    modalTitle.innerHTML = "";
    modalTitle.classList.add("d-none");
  } else {
    modalTitle.innerHTML = title;
    modalTitle.classList.remove("d-none");
  }

  modal.querySelector(".modal-body").innerHTML = body;

  $(selector).modal({
    backdrop: backdrop,
  });
}

function hideToast(selector = ".snackbar") {
  const toast = document.querySelector(selector);
  if (toast) {
    toast.classList.remove("show");
  }
}

function showToast(
  message,
  duration = 5000,
  type = "dark",
  selector = ".snackbar"
) {
  const snackbar = document.querySelector(selector);
  const body = snackbar.querySelector(".snackbar-body");
  [
    "bg-danger",
    "bg-dark",
    "bg-info",
    "bg-light",
    "bg-primary",
    "bg-secondary",
    "bg-success",
    "bg-warning",
    "border-danger",
    "border-dark",
    "border-info",
    "border-light",
    "border-primary",
    "border-secondary",
    "border-warning",
  ].forEach((item) => snackbar.classList.remove(item));

  body.innerHTML = message;

  switch (type) {
    case "danger":
      snackbar.classList.add("bg-danger");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "dark":
      snackbar.classList.add("bg-dark");
      snackbar.classList.add("border");
      snackbar.classList.add("border-light");
      break;
    case "info":
      snackbar.classList.add("bg-info");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "light":
      snackbar.classList.add("bg-light");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "primary":
      snackbar.classList.add("bg-primary");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "secondary":
      snackbar.classList.add("bg-secondary");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "success":
      snackbar.classList.add("bg-success");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    case "warning":
      snackbar.classList.add("bg-warning");
      snackbar.classList.add("border");
      snackbar.classList.add("border-dark");
      break;
    default:
      snackbar.classList.add("bg-dark");
      snackbar.classList.add("border");
      snackbar.classList.add("border-light");
      break;
  }

  snackbar.classList.add("show");

  if (typeof duration === "number") {
    if (duration !== 0) {
      setTimeout(() => {
        snackbar.classList.remove("show");
      }, duration);
    }
  }
}

function spacify(text) {
  return text.split("  ").join("&nbsp;&nbsp;");
}

function updateFollowActivity(userid, when, action) {
  const followActivityJSON =
    sessionStorage.getItem("followActivity") || JSON.stringify([]);
  let followActivity = JSON.parse(followActivityJSON);

  followActivity = followActivity.filter((item) => item.userid !== userid);

  followActivity.push({
    userid: userid,
    when: when,
    action: action,
  });

  sessionStorage.setItem("followActivity", JSON.stringify(followActivity));
}

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function initGlobal() {
  showMaterialIcons();
  refreshFloatingLabelsListener();
  configureLocalForage();
}

initGlobal();
