async function onNameSearched(e) {
    e.preventDefault();

    e.target.querySelectorAll(".is-invalid").forEach(item => {
        item.classList.remove("is-invalid");
    });

    const nameSearched = e.target.nameSearched.value || "";
    const endpoint = `${getApiHost()}/user`;
    const isBlank = nameSearched.trim().length ? false : true;
    const controller = new AbortController();
    const timeout = 8000;

    if (isBlank) {
        return e.target.querySelector("#nameSearched").classList.add("is-invalid");
    }

    // TODO:  send request to API
}

function onNameSearchInputted(e) {
    const searchTerm = e.target.value || "";
    const searchForm = document.querySelector("#formSearchByName");

    if (searchTerm.trim().value !== "") {
        searchForm.querySelectorAll(".is-invalid").forEach(item => {
            item.classList.remove("is-invalid");
        });
    }
}

function attachListeners() {
    document.querySelector("#formSearchByName").addEventListener("submit", onNameSearched);
    document.querySelector("#nameSearched").addEventListener("input", onNameSearchInputted);
}

async function init() {
    await populateContent();
    globalHidePageSpinner();
    attachListeners();
}

init();