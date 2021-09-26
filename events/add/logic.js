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
      hide(oneTimeEventBeginInfoEl);
      hide(oneTimeEventEndInfoEl);
      break;
  }
}

function onFrequencyChange(e) {
  const frequency = e.target.value.trim();
  const durationEl = document.querySelector("#duration");
  const nextOccurrenceEl = document.querySelector("#nextOccurrence");

  hide(durationEl);
  hide(nextOccurrenceEl);

  switch (frequency) {
    case "":
      break;
    case "Once":
      show(durationEl);
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
