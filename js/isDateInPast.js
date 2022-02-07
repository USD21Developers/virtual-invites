function isDateInPast(date, time) {
  const dateTime = time ? `${date} ${time}` : date;
  const momentNow = moment();
  const momentDate = moment(dateTime);
  const isInThePast = (momentNow > momentDate);

  return (isInThePast);
}