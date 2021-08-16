let pageContent = "";

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
  document.querySelectorAll(".is-invalid").forEach(item => item.classList.remove("is-invalid"));
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

function getLang() {
  const path = window.location.pathname.split("/");
  const langFromPath = path.find(frag => frag === "lang") ? path[2] : "en";
  return langFromPath;
}

function getPhrase(key) {
  let content = "";
  const errorMessage = `phrase key "${key}" was not found`;
  if (!key) throw errorMessage;
  if (!pageContent.hasOwnProperty("phrases")) throw errorMessage;
  if (!Array.isArray(pageContent.phrases)) throw errorMessage;
  const phrase = pageContent.phrases.find(item => item.key == key);
  if (!phrase) throw errorMessage;
  content = phrase.translated || "";
  const hasChanges = Array.isArray(phrase.changes);
  if (hasChanges) {
    phrase.changes.forEach(change => {
      const { original, translated, bold, italic, link } = change;
      let changed = translated;
      if (bold) changed = `<strong>${changed}</strong>`;
      if (italic) changed = `<em>${changed}</em>`;
      if (link) changed = `<a href="${link}">${changed}</a>`;
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

function isMobileDevice() {
  const result = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
  return result;
};

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
    modal.querySelector(".modal-header button[class=close]").setAttribute("aria-label", "");
    modal.querySelector(".modal-footer button[data-dismiss=modal]").innerHTML = "";
    modal.querySelector(".modal-footer button[data-dismiss=modal]").classList.add("d-none");
  } else {
    modal.querySelector(".modal-header button[class=close]").setAttribute("aria-label", closeButtonText);
    modal.querySelector(".modal-footer button[data-dismiss=modal]").innerHTML = closeButtonText;
    modal.querySelector(".modal-footer button[data-dismiss=modal]").classList.remove("d-none");
  }

  $("#modal").modal();
}

function populateContent() {
  return new Promise((resolve, reject) => {
    const lang = localStorage.getItem("lang") || "en";
    const endpoint = `i18n/${lang}.json`;
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        pageContent = data;
        const contentitems = [];
        data.phrases.forEach(phrase => {
          const { key, translated, changes } = phrase;
          const hasChanges = Array.isArray(changes);
          let content = translated;
          if (hasChanges) {
            changes.forEach(change => {
              const { original, translated, bold, italic, link } = change;
              let changed = translated;
              if (bold) changed = `<strong>${changed}</strong>`;
              if (italic) changed = `<em>${changed}</em>`;
              if (link) changed = `<a href="${link}">${changed}</a>`;
              content = content.replaceAll(original, changed);
            });
          }
          contentitems.push({ key: key, content: content });
        });
        document.querySelectorAll("[data-i18n]").forEach(item => {
          const key = item.getAttribute("data-i18n");
          const matchedcontent = contentitems.find(contentitem => contentitem.key == key).content;
          if (matchedcontent) item.innerHTML = matchedcontent;
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(item => {
          const key = item.getAttribute("data-i18n-placeholder");
          const matchedcontent = contentitems.find(contentitem => contentitem.key == key).content;
          if (matchedcontent) item.setAttribute("placeholder", matchedcontent);
        });
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function showMaterialIcons() {
  document.querySelectorAll(".material-icons").forEach(item => item.style.opacity = "1");
}

function showToast(message, duration = 5000) {
  const snackbar = document.querySelector(".snackbar");
  const body = document.querySelector(".snackbar-body");

  body.innerHTML = message;
  snackbar.classList.add("show");
  setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}

function init() {
  showMaterialIcons();
}

init();