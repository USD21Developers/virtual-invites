function hideAlert() {
    const alert = document.querySelector("#alert");
    alert.classList.add("d-none");
}

function hideSpinner() {
    const searchResults = document.querySelector("#searchResults");
    searchResults.innerHTML = "";
}

function noMatchesFound() {
    const searchResults = document.querySelector("#searchResults");
    const alert = document.querySelector("#alert");

    searchResults.classList.add("d-none");
    searchResults.innerHTML = "";

    showAlert(alert, getPhrase("noUsersFound"));
}

function showMatchesFound(matches) {
    // TODO
}

function showSpinner() {
    const searchResults = document.querySelector("#searchResults");
    searchResults.innerHTML = `
        <div class="text-center">
            <img
                src="/_assets/img/spinner.svg"
                width="200"
                height="200"
                style="max-width: 100%"
            />
        </div>
    `;
    searchResults.classList.remove("d-none");
}

function showTimeoutMessage() {
    // TODO
}

async function onNameSearched(e) {
    e.preventDefault();

    e.target.querySelectorAll(".is-invalid").forEach(item => {
        item.classList.remove("is-invalid");
    });

    const accessToken = await getAccessToken();
    const searchedFirstName = e.target.searchedFirstName.value || "";
    const searchedLastName = e.target.searchedLastName.value || "";
    const endpoint = `${getApiHost()}/users-in-congregation`;
    const controller = new AbortController();
    const timeout = 8000;

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