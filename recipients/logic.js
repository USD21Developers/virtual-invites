function populateRecipientsTable() {
  return new Promise((resolve, reject) => {
    var table = $("#recipients").DataTable({
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
