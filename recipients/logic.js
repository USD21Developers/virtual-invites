function populateRecipientsTable() {
  return new Promise(async (resolve, reject) => {
    const translationURL = getDatatablesTranslationURL();
    const languageData = await fetch(translationURL).then((res) => res.json());
    var table = $("#recipients").DataTable({
      language: languageData,
      order: [[1, "desc"]],
    });
  });
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  await populateRecipientsTable();
  syncInvites();
}

init();
