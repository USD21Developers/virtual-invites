let globalContent = "";
let pageContent = "";
let previewContent = "";
var hidden, visibilityChange;

const invitesCrypto = {
  decrypt: (serializedKey, encryptionObject) => {
    const key = invitesCrypto.deserialize(serializedKey);
    const { iv: serializedIV, ciphertext: serializedCiphertext } =
      encryptionObject;
    const iv = invitesCrypto.deserialize(serializedIV);
    const ciphertext = invitesCrypto.deserialize(serializedCiphertext);
    const plainText = invitesCrypto.decryptMessage(key, iv, ciphertext);
    return plainText;
  },

  decryptMessage: async (key, iv, ciphertext) => {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  },

  deserialize: (serializedString) => {
    const buffer = atob(serializedString);
    return buffer;
  },

  encrypt: async (serializedKey, message) => {
    if (typeof serializedKey !== "string" || serializedKey.length === 0)
      return new Error("key must be a string");
    let key;
    try {
      key = await window.crypto.importSecretKey(invitesCrypto.deserialize(serializedKey));
    } catch (err) {
      return new Error(err);
    }
    const iv = invitesCrypto.generateIV();
    const ciphertext = await invitesCrypto.encryptMessage(key, iv, message);
    const encryptionObject = {
      iv: invitesCrypto.serialize(iv),
      ciphertext: invitesCrypto.serialize(ciphertext),
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

  exportCryptoKey: async (key) => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const exportedKeyBuffer = new Uint8Array(exported);

    return exportedKeyBuffer;
  },

  generateIV: () => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    return iv;
  },

  generateKey: () => {
    return new Promise((resolve, reject) => {
      window.crypto.subtle
        .generateKey(
          {
            name: "AES-GCM",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"]
        )
        .then((key) => {
          resolve(key);
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
    const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
  },

  importSecretKey: (rawKey) => {
    return window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
  },

  serialize: (buffer) => {
    return btoa(buffer);
  },
};

function breakify(text) {
  return text.replace(/(?:\r\n|\r|\n)/g, '<br>\n');
}

function clearErrorMessages() {
  document.querySelectorAll(".is-invalid").forEach(item => {
    item.classList.remove("is-invalid");
  });
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

  if (!isMobileDevice()) element.focus();
}

function formErrorsReset() {
  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));
  document
    .querySelectorAll(".invalid-feedback")
    .forEach((item) => (item.innerHTML = ""));
  document.querySelectorAll(".invalid-feedback-unbound").forEach((item) => item.classList.add("d-none"));
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

function getHash() {
  return (
    document.location.hash.substring(1, document.location.hash.length) || ""
  );
}

function getLang() {
  const refreshToken = localStorage.getItem("refreshToken");
  let lang = "en";

  if (typeof refreshToken === "string") {
    lang = JSON.parse(atob(localStorage.getItem("refreshToken").split(".")[1])).lang;
    if (typeof lang === "undefined") {
      return window.location.href = "/logout/";
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
    country = JSON.parse(atob(localStorage.getItem("refreshToken").split(".")[1])).country;
    if (typeof country === "undefined") {
      return window.location.href = "/logout/";
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

function getNextRecurringWeekday(initialDate) {
  const now = moment();
  const firstOccurrence = moment(initialDate);
  const weekdayNumber = firstOccurrence.day();
  const militaryTime = firstOccurrence.format("HH:mm");
  const nextOccurrence = moment( moment().day(weekdayNumber).format(`YYYY-MM-DDT${militaryTime}`) )

  if (firstOccurrence.isBefore(now)) {
    return nextOccurrence;
  } else {
    return firstOccurrence;
  }
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

function getTimezoneOffset(timezoneName) {
  const offset = moment.tz(timezoneName)._offset;
  const hours = Math.floor(offset / 60);
  const minutes = Math.abs(Math.floor(offset % 60));
  const returnVal = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;

  return returnVal;
}

function globalHidePageSpinner() {
  const pageSpinner = document.querySelector("#pageSpinner");
  const mainContent = document.querySelector(".mainContent");

  pageSpinner.classList.add("d-none");
  mainContent.classList.remove("d-none");
}

function randomIntFromInterval(min = 0, max = 500) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function hide(selector) {
  selector.classList.add("d-none");
}

function isMobileDevice() {
  const result =
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("IEMobile") !== -1;
  return result;
}

async function populateContent(customEndpoint, variable = "pageContent") {
  return new Promise((resolve, reject) => {
    const lang = localStorage.getItem("lang") || "en";
    const endpoint = customEndpoint ? customEndpoint : `i18n/${lang}.json`;
    const breadcrumbs = document.querySelector("nav .breadcrumb");

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
        breadcrumbs ? breadcrumbs.style.display = "flex" : "";
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
    const breadcrumbs = document.querySelector("nav .breadcrumb");

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
        breadcrumbs ? breadcrumbs.style.display = "flex" : "";
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
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

function refreshFloatingLabels() {
  if (!document[hidden]) {
    document.querySelectorAll("input, select").forEach(item => {
      if (item.value !== "") {
        item.parentElement.classList.add("has-value");
      }
    });
  }
}

function refreshFloatingLabelsListener() {
  if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
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
    const { country, frequency, duration, startdate, multidaybegindate, multidayenddate, timezone } = eventObj;
    const lang = getLang();
    const locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
    const eventPhrasesAll = await fetch(`/events/i18n/${lang}.json`).then(res => res.json());
    const eventPhrases = eventPhrasesAll.phrases;
    const from = eventPhrases.filter(item => item.key === "from")[0].translated;
    const to = eventPhrases.filter(item => item.key === "to")[0].translated;
    const frequencyEverySunday = eventPhrases.filter(item => item.key === "frequencyEverySunday")[0].translated;
    const frequencyEveryMonday = eventPhrases.filter(item => item.key === "frequencyEveryMonday")[0].translated;
    const frequencyEveryTuesday = eventPhrases.filter(item => item.key === "frequencyEveryTuesday")[0].translated;
    const frequencyEveryWednesday = eventPhrases.filter(item => item.key === "frequencyEveryWednesday")[0].translated;
    const frequencyEveryThursday = eventPhrases.filter(item => item.key === "frequencyEveryThursday")[0].translated;
    const frequencyEveryFriday = eventPhrases.filter(item => item.key === "frequencyEveryFriday")[0].translated;
    const frequencyEverySaturday = eventPhrases.filter(item => item.key === "frequencyEverySaturday")[0].translated;
    const isRecurring = frequency !== "once";
    let html = "";
  
    if (isRecurring) {
      const whenTimeLocal = new Date(moment.tz(startdate, timezone).format());
      const whenTime = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(whenTimeLocal);
      let whenDate;
      switch(frequency) {
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
      const whenDate = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(whenDateLocal);
      const whenTime = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(whenDateLocal);
      html = `<span class="eventDate">${whenDate}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime">${whenTime}</span>`;
    } else if (duration === "multiple days") {
      const multidayBeginDateLocal = new Date(moment.tz(multidaybegindate, timezone).format());
      const multidayEndDateLocal = new Date(moment.tz(multidayenddate, timezone).format());
      const whenDateFrom = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(multidayBeginDateLocal);
      const whenTimeFrom = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(multidayBeginDateLocal);
      const whenDateTo = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(multidayEndDateLocal);
      const whenTimeTo = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(multidayEndDateLocal);
      html = `
        <span class="eventLabel from">${from}</span> <span class="eventDate from">${whenDateFrom}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime from">${whenTimeFrom}</span><br>
        <span class="eventLabel to">${to}</span> <span class="eventDate to">${whenDateTo}</span> <span class="eventSeparator">&bull;</span> <span class="eventTime to">${whenTimeTo}</span><br>
      `;
    }
  
    resolve(html);
  })
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

function hideToast() {
  const snackbar = document.querySelector(".snackbar");
  snackbar.classList.remove("show");
}

function showToast(message, duration = 5000, type = "dark") {
  const snackbar = document.querySelector(".snackbar");
  const body = document.querySelector(".snackbar-body");
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

/* function urlify(text, link_attributes_obj = {}) {
  //link_attributes_obj (optional) object {target:'_blank', class:'myLink'}

  //html to text
  text = text.replace(/</g, '&lt;');
  text = text.replace(/>/g, '&gt;');

  const emailPattern = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  text = text.replace(emailPattern, '<a href="mailto:$1">$1</a>');

  let attr = [];
  for (let k in link_attributes_obj) {
    if (k !== 'href') {
      attr.push(k + '="' + link_attributes_obj[k].replaceAll(/"/g, "'") + '"');
    }
  }

  //URLs starting with http://, https://, or ftp://
  let exp = /((?:https?|ftp):\/\/[a-zA-Z0-9][\w+\d+&@\-#\/%?=~_|!:,.;+]*)/gim;
  text = text.replace(exp, '<a href="$1" ' + attr.join(' ') + '>$1</a>');

  //URLs starting with www.
  let reg_ww = /(?<!\/)(www\.[a-zA-Z0-9][\w+\d+&@\-#\/%?=~_|!:,.;+]*)/gim;
  text = text.replace(reg_ww, '<a href="https://$1" ' + attr.join(' ') + '>$1</a>');

  return text;
} */

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function initGlobal() {
  showMaterialIcons();
  refreshFloatingLabelsListener();
}

initGlobal();
