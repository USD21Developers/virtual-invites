function spinner(action="show", spinnerSelector="#pageSpinner", contentSelector="#pageContent") {
    const spinnerEl = document.querySelector(spinnerSelector);
    const contentEl = document.querySelector(contentSelector);
    if (action === "hide") {
        spinnerEl.classList.add("d-none");
        contentEl.classList.remove("d-none");
    } else if (action === "show") {
        contentEl.classList.add("d-none");
        spinnerEl.classList.remove("d-none");
    }
}

async function init() {
    await populateContent();
    spinner("hide");
    globalHidePageSpinner();
}
  
init();