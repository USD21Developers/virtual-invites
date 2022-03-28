function getRelativeDate(numDays = 0, locale = "en") {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, {
      localeMatcher: "best fit",
      numeric: "auto",
      style: "long"
    });

    const numDaysAbsolute = Math.abs(numDays);
    let unitType;
    let unitQuantity;

    if (numDaysAbsolute >= 720) {
      unitType = "year";
      unitQuantity = Math.floor(numDaysAbsolute / 365);
    } else if (numDaysAbsolute >= 60) {
      unitType = "month";
      unitQuantity = Math.floor(numDaysAbsolute / 30);
    } else if (numDaysAbsolute >= 7) {
      unitType = "week";
      unitQuantity = Math.floor(numDaysAbsolute / 7);
    } else {
      unitType = "days";
      unitQuantity = numDaysAbsolute;
    }

    if (numDays < 0) {
      unitQuantity = unitQuantity * -1;
    }

    return rtf.format(unitQuantity, unitType);
  }
  catch (err) {
    console.log("Intl.RelativeTimeFormat is not supported. Switching to 'recently.'");
    return getGlobalPhrase("recently");
  }
}