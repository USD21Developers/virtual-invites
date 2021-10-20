function setTheme() {
  const defaultTheme = "blue";
  const color = localStorage.getItem("defaultTheme") || defaultTheme;
  const theme = document.querySelector(".theme");

  theme.setAttribute("data-theme", color);
  theme.classList.remove("d-none");
}

function onMoreInfoClicked(e) {
  console.log(`onMoreInfoClicked`);
  e.preventDefault();
  const body = `
    <p class="text-center">For more information, contact:</p>
    <div class="row">
      <div class="col col-sm-6 offset-sm-3 text-center">
        <h4>Lance Jesterson</h4>
      </div>
    </div>
    <div class="row">
      <div class="col col-sm-6 offset-sm-3 text-center">
        <div class="card">
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <a href="tel:+12133251382" class="list-group-item list-group-item-action">
                Phone
              </a>
              <a href="sms:+12133251382" class="list-group-item list-group-item-action">SMS</a>
              <a href="mailto:vrtjason@gmail.com" class="list-group-item list-group-item-action">E-mail</a>
            </div>
          </div>
      </div>
    </div>
  `;
  const title = "More Information";

  showModal(body, title);
}

function addEventListeners() {
  document
    .querySelector("#moreinfo")
    .addEventListener("click", onMoreInfoClicked);
}

function init() {
  setTheme();
  addEventListeners();
}

init();
