function isDateInPast(timeZone = moment.tz.guess(), date, time = "23:59:59") {
  const dateTime = time ? `${date} ${time}` : date;
  const momentNow = moment.tz(moment(), timeZone);
  const momentDate = moment.tz(dateTime, timeZone);
  const isInThePast = (momentNow > momentDate);

  return (isInThePast);
}