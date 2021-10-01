let globalContent = "";
let pageContent = "";

const crypto = {
  decrypt: (serializedKey, encryptionObject) => {
    const key = deserialize(serializedKey);
    const { iv: serializedIV, ciphertext: serializedCiphertext } =
      encryptionObject;
    const iv = crypto.deserialize(serializedIV);
    const ciphertext = crypto.deserialize(serializedCiphertext);
    const plainText = crypto.decryptMessage(key, iv, ciphertext);
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
      key = await crypto.importSecretKey(crypto.deserialize(serializedKey));
    } catch (err) {
      return new Error(err);
    }
    const iv = crypto.generateIV();
    const ciphertext = await crypto.encryptMessage(key, iv, message);
    const encryptionObject = {
      iv: crypto.serialize(iv),
      ciphertext: crypto.serialize(ciphertext),
    };

    return encryptionObject;
  },

  encryptMessage: async (key, iv, message) => {
    const encoded = crypto.getMessageEncoding(message);
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

function enableTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

function formError(selector, message = "") {
  const element = document.querySelector(selector);
  const feedback = document.querySelector(`${selector} + .invalid-feedback`);
  const offset = 94;
  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = element.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - offset;

  feedback.innerHTML = message;
  element.classList.add("is-invalid");
  window.scrollTo({ top: offsetPosition, behavior: "smooth", block: "center" });
  if (!isMobileDevice()) element.focus();
}

function formErrorsReset() {
  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));
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
            window.location.href = "/logout/";
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
  const path = window.location.pathname.split("/");
  const langFromPath = path.find((frag) => frag === "lang") ? path[2] : "en";
  return langFromPath;
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
      const { original, translated, bold, italic, link } = change;
      let changed = translated;
      if (bold) changed = `<strong>${changed}</strong>`;
      if (italic) changed = `<em>${changed}</em>`;
      if (link) changed = `<a href="${link}" class="alert-link">${changed}</a>`;
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

function hide(selector) {
  selector.classList.add("d-none");
}

function isMobileDevice() {
  const result =
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("IEMobile") !== -1;
  return result;
}

async function populateContent() {
  return new Promise((resolve, reject) => {
    const lang = localStorage.getItem("lang") || "en";
    const endpoint = `i18n/${lang}.json`;
    fetch(endpoint)
      .then((res) => res.json())
      .then(async (data) => {
        pageContent = data;
        const contentitems = [];
        data.phrases.forEach((phrase) => {
          const { key, translated, changes } = phrase;
          const hasChanges = Array.isArray(changes);
          let content = translated;
          if (hasChanges) {
            changes.forEach((change) => {
              const { original, translated, bold, italic, link, code } = change;
              let changed = translated;
              if (bold) changed = `<strong>${changed}</strong>`;
              if (italic) changed = `<em>${changed}</em>`;
              if (link) changed = `<a href="${link}">${changed}</a>`;
              if (code) changed = `<code>${changed}</code>`;
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
          if (hasChanges) {
            changes.forEach((change) => {
              const { original, translated, bold, italic, link, code } = change;
              let changed = translated;
              if (bold) changed = `<strong>${changed}</strong>`;
              if (italic) changed = `<em>${changed}</em>`;
              if (link) changed = `<a href="${link}">${changed}</a>`;
              if (code) changed = `<code>${changed}</code>`;
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
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
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

function showMaterialIcons() {
  document
    .querySelectorAll(".material-icons")
    .forEach((item) => (item.style.opacity = "1"));
}

function showModal(body = "", title = "", closeButtonText = "") {
  const modal = document.querySelector("#modal");
  const modalTitle = document.querySelector("#modaltitle");

  if (title === "") {
    modalTitle.innerHTML = "";
    modalTitle.classList.add("d-none");
  } else {
    modalTitle.innerHTML = title;
    modalTitle.classList.remove("d-none");
  }

  modal.querySelector(".modal-body").innerHTML = body;

  if (closeButtonText === "") {
    modal
      .querySelector(".modal-header button[class=close]")
      .setAttribute("aria-label", "");
    modal.querySelector(".modal-footer button[data-dismiss=modal]").innerHTML =
      "";
    modal
      .querySelector(".modal-footer button[data-dismiss=modal]")
      .classList.add("d-none");
  } else {
    modal
      .querySelector(".modal-header button[class=close]")
      .setAttribute("aria-label", closeButtonText);
    modal.querySelector(".modal-footer button[data-dismiss=modal]").innerHTML =
      closeButtonText;
    modal
      .querySelector(".modal-footer button[data-dismiss=modal]")
      .classList.remove("d-none");
  }

  $("#modal").modal();
}

function showToast(message, duration = 5000, type = "dark") {
  const snackbar = document.querySelector(".snackbar");
  const body = document.querySelector(".snackbar-body");

  body.innerHTML = message;
  snackbar.classList.remove(
    "bg-danger,bg-dark,bg-info,bg-light,bg-primary,bg-secondary,bg-success,bg-warning,border-danger,border-dark,border-info,border-light,border-primary,border-secondary,border-warning"
  );

  switch (type) {
    case "danger":
      snackbar.classList.add("bg-danger,border,border-dark");
      break;
    case "dark":
      snackbar.classList.add("bg-dark,border,border-light");
      break;
    case "info":
      snackbar.classList.add("bg-info,border,border-dark");
      break;
    case "light":
      snackbar.classList.add("bg-light,border,border-dark");
      break;
    case "primary":
      snackbar.classList.add("bg-primary,border,border-dark");
      break;
    case "secondary":
      snackbar.classList.add("bg-secondary,border,border-dark");
      break;
    case "success":
      snackbar.classList.add("bg-success,border,border-dark");
      break;
    case "warning":
      snackbar.classList.add("bg-warning,border,border-dark");
      break;
    default:
      snackbar.classList.add("bg-dark,border,border-light");
      break;
  }

  snackbar.classList.add("show");

  if (typeof duration === "number") {
    setTimeout(() => {
      snackbar.classList.remove("show");
    }, duration);
  }
}

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function initGlobal() {
  showMaterialIcons();
}

initGlobal();
