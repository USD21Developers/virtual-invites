(() => {
  const el = document.createElement("script");
  const lang = getLang();
  el.setAttribute("type", "text/javascript");
  el.setAttribute("src", `https://polyfill.io/v3/polyfill.js?features=Intl.RelativeTimeFormat,Intl.RelativeTimeFormat.~locale.${lang}`);
  document.head.appendChild(el);
})();