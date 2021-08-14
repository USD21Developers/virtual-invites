let pageContent = "";

function enableTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

function getApiHost() {
  let host;

  switch (window.location.hostname) {
    case "localhost":
      host = `http://${window.location.hostname}:4000/invites`;
      break;
    case "staging.invites.usd21.org":
      host = "https://api.usd21.org/invites/staging/api";
      break;
    case "invites.usd21.org":
      host = "https://api.usd21.org/invites/api";
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