function populateTemplate(version = "default") {
  const path = `../templates/${version}/index.html`;
  fetch(path)
    .then((res) => res.text())
    .then((unparsed) => {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(unparsed, "text/html");
      const mainContent = parsed.querySelector(".container");
      const mainEl = document.querySelector("main");
      mainEl.appendChild(mainContent);
      populateContent();
    });
}

function init() {
  populateTemplate();
}

init();
