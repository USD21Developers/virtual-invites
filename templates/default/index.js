function urlifyConnectionContent() {
  const connectionContentEl = document.querySelector("#connectionContent");
  let newContent = connectionContentEl.innerHTML;
  newContent = spacify(newContent);
  newContent = urlify(newContent);
  newContent = breakify(newContent);
  connectionContentEl.innerHTML = newContent;
}

function setTheme() {
  const defaultTheme = "blue";
  const color = localStorage.getItem("defaultTheme") || defaultTheme;
  const theme = document.querySelector(".theme");

  theme.setAttribute("data-theme", color);
  theme.classList.remove("d-none");
}

function addEventListeners() { }

function init() {
  setTheme();
  urlifyConnectionContent();
  addEventListeners();
}

init();
