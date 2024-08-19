let registrant;

function populateLeadershipRoleHeading() {
  const headingEl = document.querySelector("#labelHighestLeadershipRole");
  const headingText = getPhrase("highestLeadershipRole").replaceAll(
    "{FIRST-NAME}",
    registrant.firstname
  );
  headingEl.innerHTML = headingText;
}

async function populateOathText() {
  const churches = await getChurches();
  const church = churches.find((item) => item.id === registrant.churchid);
  const oathEl = document.querySelector("label[for='oath']");
  const name = `${registrant.firstname} ${registrant.lastname}`;
  const churchName = church.name;
  const oathText = getPhrase("oath")
    .replaceAll("{NAME}", name)
    .replaceAll("{CHURCH-NAME}", churchName);
  oathEl.innerHTML = oathText;
}

function populateParagraph1() {
  const p1El = document.querySelector("#p1");
  let p1Phrase =
    registrant.gender === "male" ? getPhrase("p1Male") : getPhrase("p1Female");
  p1Phrase = p1Phrase.replaceAll("{FIRST-NAME}", registrant.firstname);
  p1El.innerHTML = p1Phrase;
}

async function populateRegistrant() {
  const churches = await getChurches();
  const userid = Number(window.location.hash.split("/")[1]);
  const endpoint = `${getApiHost()}/userprofile/${userid}`;
  const accessToken = await getAccessToken();

  const user = await fetch(endpoint, {
    mode: "cors",
    method: "get",
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      return data.profile;
    });

  registrant = user;

  const name = `${user.firstname} ${user.lastname}`;
  const church = churches.find((item) => item.id === user.churchid);
  const profilePhotoEl = document.querySelector("#profilephoto");
  const pageTitle = getPhrase("pagetitle").replaceAll("{NAME}", name);
  const profilePhotoAltText = getPhrase("profilePhotoAltText").replaceAll(
    "{NAME}",
    name
  );

  const registrationDateEl = document.querySelector("#registrationDate");
  const lang = getLang();
  const locale = `${lang.toLowerCase()}-${church.country.toUpperCase()}`;
  const registrationDateUTC = user.createdAt;
  const now = moment();
  const daysSinceRegistered = moment(registrationDateUTC).diff(now, "days");
  const relativeDate = getRelativeDate(daysSinceRegistered, locale);
  const registrationDateText = getPhrase("registrationDate").replaceAll(
    "{DATE}",
    relativeDate
  );

  document.title = pageTitle;
  profilePhotoEl.setAttribute("src", user.profilephoto);
  profilePhotoEl.setAttribute("alt", profilePhotoAltText);
  registrationDateEl.innerHTML = registrationDateText;

  document
    .querySelectorAll(".fullname")
    .forEach((item) => (item.innerHTML = name));

  document.querySelector("#churchname").innerHTML = church.name;
}

async function populateWhyAuthorize() {
  const url = `../../authorize/i18n/${getLang()}.json`;
  const phraseJSON = await fetch(url).then((res) => res.json());
  const modalEl = document.querySelector("#whyAuthorizeModal");
  const linkEl = document.querySelector("#whyAuthorizeLink");
  const titleText = getPhrase("whyAuthorizeHeading", phraseJSON);
  const p1Text = getPhrase("whyAuthorizeP1", phraseJSON);
  const p2Text = getPhrase("whyAuthorizeP2", phraseJSON);

  linkEl.innerHTML = titleText;
  modalEl.querySelector(".modal-title").innerHTML = titleText;
  modalEl.querySelector("[data-i18n='whyAuthorizeP1']").innerHTML = p1Text;
  modalEl.querySelector("[data-i18n='whyAuthorizeP2']").innerHTML = p2Text;
}

function unhideContentForHighestUsers() {
  let canAuthToAuth = false;
  let canAccessThisPage = false;
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );

  if (refreshToken.isAuthorized) {
    isAuthorized = true;
  }

  if (refreshToken.canAuthorize) {
    canAuthorize = true;
    canAccessThisPage = true;
  }

  if (refreshToken.canAuthToAuth) {
    canAuthToAuth = true;
  }

  if (!canAccessThisPage) {
    sessionStorage.setItem("redirectOnLogin", window.location.href);
    window.location.href = "/";
  }

  if (canAuthToAuth) {
    document
      .querySelector("#containerHighestLeadershipRole")
      .classList.remove("d-none");
  }
}

function onSubmit(e) {
  e.preventDefault();

  // TODO:  validate form.  Must check an option under Highest Leaedership Role (if it is visible), and must accept oath.
  // TODO:  fetch the API
  // TODO:  build API endpoint
}

function onWhyAuthorizeClicked(e) {
  e.preventDefault();
  $("#whyAuthorizeModal").modal();
}

function attachListeners() {
  window.addEventListener("hashchange", (e) => window.location.reload());

  document
    .querySelector("#whyAuthorizeLink")
    .addEventListener("click", onWhyAuthorizeClicked);

  document.querySelector("#authorizeForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  await populateRegistrant();
  unhideContentForHighestUsers();
  populateParagraph1();
  populateLeadershipRoleHeading();
  await populateWhyAuthorize();
  populateOathText();
  attachListeners();
  globalHidePageSpinner();
}

init();
