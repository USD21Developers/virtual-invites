function populateContent() {
  //
}

function populateTemplate(version = "default") {
  const path = `../templates/${version}/index.html`;
  fetch(path)
    .then((res) => res.text())
    .then((unparsed) => {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(unparsed, "text/html");
      const templateContent = parsed.querySelector("#content");
      const el = document.querySelector("main");
      el.appendChild(templateContent);
      populateContent();
    });
}

function init() {
  populateTemplate();
}

init();
