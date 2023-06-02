function hideSpinner() {
  const el = document.querySelector("#pageSpinner");
  el.classList.add("d-none");
}

function populateTemplate(version = "default") {
  return new Promise((resolve, reject) => {
    const path = `../templates/${version}/index.html`;
    fetch(path)
      .then((res) => res.text())
      .then((unparsed) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(unparsed, "text/html");
        const templateContent = parsed.querySelector(".container");
        const el = document.querySelector("main");
        el.appendChild(templateContent);
        hideSpinner();
        resolve();
      });
  });
}

async function init() {
  await populateTemplate();
  await populateContent();
}

init();
