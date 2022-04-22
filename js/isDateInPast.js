function isDateInPast(timeZone = moment.tz.guess(), date, time) {
  const dateTime = time ? `${date} ${time}` : date;
  const momentNow = moment.tz(moment(), timeZone);
  const momentDate = moment.tz(dateTime, timeZone);
  const isInThePast = (momentNow > momentDate);

  return (isInThePast);
}