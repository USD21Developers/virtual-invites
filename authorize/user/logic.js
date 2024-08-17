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

  console.log(registrationDateUTC);
}

function attachListeners() {
  window.addEventListener("hashchange", (e) => window.location.reload());
}

async function init() {
  await populateContent();
  await populateRegistrant();
  attachListeners();
  globalHidePageSpinner();
}

init();
