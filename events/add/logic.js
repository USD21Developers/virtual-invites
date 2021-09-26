function onDurationChange(e) {
  const duration = e.target.value.trim();
  const nextOccurrenceEl = document.querySelector("#nextOccurrence");
  const oneTimeEventBeginInfoEl = document.querySelector(
    "#oneTimeEventBeginInfo"
  );
  const oneTimeEventEndInfoEl = document.querySelector("#oneTimeEventEndInfo");

  hide(nextOccurrenceEl);
  hide(oneTimeEventBeginInfoEl);
  hide(oneTimeEventEndInfoEl);

  switch (duration) {
    case "":
      break;
    case "same day":
      show(nextOccurrenceEl);
      break;
    case "multiple days":
      show(oneTimeEventBeginInfoEl);
      show(oneTimeEventEndInfoEl);
      break;
    default:
      break;
  }
}

function onFrequencyChange(e) {
  const frequency = e.target.value.trim();
  const duration = document.querySelector("#duration");
  const durationContainer = document.querySelector("#durationContainer");
  const nextOccurrenceEl = document.querySelector("#nextOccurrence");
  const oneTimeEventBeginInfoEl = document.querySelector(
    "#oneTimeEventBeginInfo"
  );
  const oneTimeEventEndInfoEl = document.querySelector("#oneTimeEventEndInfo");

  hide(durationContainer);
  hide(nextOccurrenceEl);
  hide(oneTimeEventBeginInfoEl);
  hide(oneTimeEventEndInfoEl);
  duration.options[0].selected = true;

  switch (frequency) {
    case "":
      break;
    case "Once":
      show(durationContainer);
      break;
    default:
      show(nextOccurrenceEl);
      break;
  }
}

function attachListeners() {
  document
    .querySelector("#frequency")
    .addEventListener("change", onFrequencyChange);

  document
    .querySelector("#duration")
    .addEventListener("change", onDurationChange);
}

async function init() {
  await populateContent();
  attachListeners();
}

init();
