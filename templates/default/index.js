function setTheme() {
  const defaultTheme = "blue";
  const color = localStorage.getItem("defaultTheme") || defaultTheme;
  const theme = document.querySelector(".theme");

  theme.setAttribute("data-theme", color);
  theme.classList.remove("d-none");
}

function init() {
  setTheme();
  addEventListeners();
}

init();
