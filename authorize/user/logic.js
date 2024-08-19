let registrant;

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

function onWhyAuthorizeClicked(e) {
  e.preventDefault();
  const authorizeModalEl = document.querySelector("#whyAuthorizeModal");
  $("#whyAuthorizeModal").modal();
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

function attachListeners() {
  window.addEventListener("hashchange", (e) => window.location.reload());

  document
    .querySelector("#whyAuthorizeLink")
    .addEventListener("click", onWhyAuthorizeClicked);
}

async function init() {
  await populateContent();
  await populateRegistrant();
  populateParagraph1();
  await populateWhyAuthorize();
  attachListeners();
  globalHidePageSpinner();
}

init();
