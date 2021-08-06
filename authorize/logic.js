function onInstructionsClicked() {
  const instructionsButtonContainer = document.querySelector("#instructionsButtonContainer");
  instructionsButtonContainer.classList.add("d-none");
}

function attachListeners() {
  $("#instructions").on("show.bs.collapse", onInstructionsClicked);
}

function init() {
  attachListeners();
}

init();