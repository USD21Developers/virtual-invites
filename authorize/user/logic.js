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

  // TODO:  if new user is already authorized, show error message

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

function showSuccessModal() {
  // TODO
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

async function validate() {
  const churches = await getChurches();
  const approver = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const approverChurch = churches.find((item) => item.id === approver.churchid);
  const acceptedOath = document.querySelector("#oath").checked;

  document.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((item) => {
    item.classList.remove("d-block");
  });

  if (approver.usertype !== "user") {
    const error = getPhrase("approverMustBeRegistered");
    showToast(error, 5000, "danger");
    return false;
  }

  if (registrant.usertype !== "user") {
    const error = getPhrase("registrantMustBeRegistered");
    showToast(error, 5000, "danger");
    return false;
  }

  if (!approver.canAuthToAuth) {
    if (registrant.churchid !== approver.churchid) {
      const errorMsg = getPhrase("errorChurchMustMatch")
        .replaceAll("{NAME}", `${registrant.firstname} ${registrant.lastname}`)
        .replaceAll("{CHURCH-NAME}", approverChurch.name);
      showModal(errorMsg, getPhrase("churchMustMatch"));
      return false;
    }
  }

  if (approver.canAuthToAuth) {
    const highestLeadershipRole = document.querySelector(
      "[name='highestLeadershipRole']:checked"
    )?.value;
    if (!highestLeadershipRole) {
      if (!highestLeadershipRole) {
        const errorEl = document.querySelector(
          "#highestLeadershipRole_invalidFeedback"
        );
        errorEl.innerHTML = getPhrase("errorLeadershipRoleRequired");
        errorEl.classList.add("d-block");
        customScrollTo("#highestLeadershipRole_invalidFeedback", 225);
        return false;
      }
    }
  }

  if (!acceptedOath) {
    const errorEl = document.querySelector("#oathInvalidFeedback");

    errorEl.innerHTML = getPhrase("errorOathIsRequired");
    errorEl.classList.add("d-block");
    customScrollTo("#oathContainer");
    return false;
  }
}

async function onSubmit(e) {
  const acceptedOath = document.querySelector("#oath").checked;
  const registrantUserId = Number(getHash().split("/")[1]);
  const highestLeadershipRoleEl = document.querySelector(
    "[name='highestLeadershipRole']:checked"
  );
  const highestLeadershipRole = highestLeadershipRoleEl
    ? highestLeadershipRoleEl.value
    : null;

  e.preventDefault();

  const isValid = validate();
  if (!isValid) return;

  if (!navigator.onLine) {
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

  globalShowPageSpinner();

  const endpoint = `${getApiHost()}/authorization-postreg-grant`;
  const accessToken = await getAccessToken();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      acceptedOath: acceptedOath,
      registrantUserId: registrantUserId,
      highestLeadershipRole: highestLeadershipRole,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      switch (data.msg) {
        case "oath is required":
          globalHidePageSpinner();
          const errorEl = document.querySelector("#oathInvalidFeedback");
          errorEl.innerHTML = getPhrase("errorOathIsRequired");
          errorEl.classList.add("d-block");
          customScrollTo("#oathContainer");
          break;
        case "registrantUserId is required":
          break;
        case "registrantUserId must be a number":
          break;
        case "approving user lacks permission to authorize":
          break;
        case "highest leadership role is required":
          globalHidePageSpinner();
          const highestLeadershipRole = document.querySelector(
            "[name='highestLeadershipRole']:checked"
          )?.value;
          if (!highestLeadershipRole) {
            if (!highestLeadershipRole) {
              const errorEl = document.querySelector(
                "#highestLeadershipRole_invalidFeedback"
              );
              errorEl.innerHTML = getPhrase("errorLeadershipRoleRequired");
              errorEl.classList.add("d-block");
              customScrollTo("#highestLeadershipRole_invalidFeedback", 225);
            }
          }
          break;
        case "unable to query for new user":
          break;
        case "new user not found":
          break;
        case "invalid user status of new user":
          break;
        case "church of approver must match that of new user":
          globalHidePageSpinner();
          const errorMsg = getPhrase("errorChurchMustMatch")
            .replaceAll(
              "{NAME}",
              `${registrant.firstname} ${registrant.lastname}`
            )
            .replaceAll("{CHURCH-NAME}", approverChurch.name);
          showModal(errorMsg, getPhrase("churchMustMatch"));
          break;
        case "unable to authorize new user":
          break;
        case "new user authorized":
          globalHidePageSpinner();
          showSuccessModal();
          break;
        default:
          break;
      }
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();
    });
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
  syncChurches();
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
