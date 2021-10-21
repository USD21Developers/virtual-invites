function setTheme() {
  const defaultTheme = "blue";
  const color = localStorage.getItem("defaultTheme") || defaultTheme;
  const theme = document.querySelector(".theme");

  theme.setAttribute("data-theme", color);
  theme.classList.remove("d-none");
}

function onMoreInfoClicked(e) {
  e.preventDefault();
  const body = `
    A Bible Talk is a casual, light-hearted discussion group that is open to anyone, regardless of their beliefs or prior experience with the Bible. We usually meet in a home or restaurant, but sometimes we meet in an open setting like a park.
    <br />
    <br />The discussion leader will focus on a Biblical topic and pertinent scriptures, and will engage the attendees with thought-provoking questions designed to get everyone thinking about those scriptures on a deeper level. The goal is to try to understand the scripture better through practical application, and to inspire attendees to pursue further Bible study. 
    <hr />
    <h3>Questions?</h3>
    <div class="row">
      <div class="col">
        If you have any questions or feedback, contact us below:
      </div>
    </div>
    <div class="row my-3">
      <div class="col col-sm-6 offset-sm-3 text-center">
        <h4 class="m-0">Laurence Jesterson</h4>
      </div>
    </div>
    <div class="row">
      <div class="col col-sm-6 offset-sm-3 text-center">
        <div class="card">
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <a href="tel:+12133251382" class="list-group-item list-group-item-action">
                Phone call
              </a>
              <a href="sms:+12133251382" class="list-group-item list-group-item-action">
                Text message
              </a>
              <a href="mailto:vrtjason@gmail.com" class="list-group-item list-group-item-action">
                E-mail
              </a>
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
