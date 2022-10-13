function hideAlert() {
    const alert = document.querySelector("#alert");
    alert.classList.add("d-none");
}

function hideSpinner() {
    const searchSpinner = document.querySelector("#searchSpinner");

    searchSpinner.classList.add("d-none");
}

function noMatchesFound() {
    const alert = document.querySelector("#alert");
    const searchResults = document.querySelector("#searchResults");

    searchResults.classList.add("d-none");
    searchResults.innerHTML = "";

    showAlert(alert, getPhrase("noUsersFound"));
}

function showMatchesFound(matches) {
    const searchResults = document.querySelector("#searchResults");
    const numMatches = matches.length;
    let html = "";

    for (let i = 0; i < numMatches; i++) {
        const userid = matches[i].userid;
        const firstname = matches[i].firstname;
        const lastname = matches[i].lastname;
        const gender = matches[i].gender;
        const profilephoto = matches[i].profilephoto.replace("400.jpg", "140.jpg");
        const btnFollow = getPhrase("btnFollow");
        const btnProfile = getPhrase("btnProfile");
        const defaultImg = (gender === "male") ? "avatar_male.svg" : "avatar_female.svg";
        html += `
            <div class="row align-items-center result">
                <div class="col-md-2 offset-md-3 text-center">
                    <img class="mr-3" src="${profilephoto}" alt="${firstname} ${lastname}" width="140" height="140" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';">
                </div>
                <div class="col-md-4 text-center">
                    <h3 class="mt-0 mb-3">${firstname} ${lastname}</h4>
                    <button type="button" class="btn btn-primary btn-sm my-0 mr-2" data-follow-userid="${userid}">
                        ${btnFollow}
                    </button>
                    <button type="button" class="btn btn-default btn-sm my-0 ml-2" data-profile-userid="${userid}">
                        ${btnProfile}
                    </button>
                </div>
            </div>
        `;
    }

    html = `<div class="container">${html}</div>`;

    searchResults.innerHTML = html;

    hideSpinner();

    searchResults.classList.remove("d-none");

    customScrollTo("#searchResults");
}

function showSpinner() {
    const searchSpinner = document.querySelector("#searchSpinner");

    searchSpinner.classList.remove("d-none");
}

function showTimeoutMessage() {
    // TODO
}

function validate(e) {
    let isValid = true;
    const firstName = e.target.searchedFirstName.value.trim();
    const lastName = e.target.searchedLastName.value.trim();

    if (firstName === "" && lastName === "") {
        isValid = false;
    }

    return isValid;
}

async function onNameSearched(e) {
    e.preventDefault();

    e.target.querySelectorAll(".is-invalid").forEach(item => {
        item.classList.remove("is-invalid");
    });

    const accessToken = await getAccessToken();
    const searchedFirstName = e.target.searchedFirstName.value || "";
    const searchedLastName = e.target.searchedLastName.value || "";
    const limitToUsersInCongregation = e.target.checkboxLimitToLocalCongregation.checked ? true : false;
    let endpoint = `${getApiHost()}/users-all`;
    const controller = new AbortController();
    const timeout = 8000;
    const isValid = validate(e);

    if (!isValid) {
        formError("#searchedFirstName", getPhrase("errorNameIsRequired"));
        return;
    }

    if (limitToUsersInCongregation) {
        endpoint = `${getApiHost()}/users-in-congregation`;
    }

    hideAlert();
    showSpinner();

    fetch(endpoint, {
        mode: "cors",
        method: "POST",
        body: JSON.stringify({
            searchedFirstName: searchedFirstName,
            searchedLastName: searchedLastName
        }),
        headers: new Headers({
            "Content-Type": "application/json",
            authorization: `Bearer ${accessToken}`
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data && data.hasOwnProperty("matches") && data.matches.length) {
                showMatchesFound(data.matches);
                hideSpinner();
            } else {
                noMatchesFound();
                hideSpinner();
            }
        })
        .catch(err => {
            console.error(err);
            hideSpinner();
        });

    setTimeout(() => {
        controller.abort();
        hideSpinner();
        showTimeoutMessage();
    }, timeout);
}

function onFirstNameSearchInputted(e) {
    const searchTerm = e.target.value || "";
    const searchForm = document.querySelector("#searchedFirstName");

    if (searchTerm.trim().value !== "") {
        searchForm.querySelectorAll(".is-invalid").forEach(item => {
            item.classList.remove("is-invalid");
        });
    }

    // TODO:  Check indexedDB for list of all registered users in the church congregation of the current user. If populated, insert names into the datalist. Then sync silently.
}

function onLastNameSearchInputted(e) {
    const searchTerm = e.target.value || "";
    const searchForm = document.querySelector("#searchedLastName");

    if (searchTerm.trim().value !== "") {
        searchForm.querySelectorAll(".is-invalid").forEach(item => {
            item.classList.remove("is-invalid");
        });
    }

    // TODO:  Check indexedDB for list of all registered users in the church congregation of the current user. If populated, insert names into the datalist. Then sync silently.
}

function attachListeners() {
    document.querySelector("#formSearchByName").addEventListener("submit", onNameSearched);
    document.querySelector("#searchedFirstName").addEventListener("input", onFirstNameSearchInputted);
    document.querySelector("#searchedLastName").addEventListener("input", onLastNameSearchInputted);
}

async function init() {
    await populateContent();
    globalHidePageSpinner();
    attachListeners();
}

init();