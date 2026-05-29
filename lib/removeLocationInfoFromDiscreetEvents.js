module.exports = async function removeLocationInfoFromDiscreetEvents(
  arrayOfEvents,
) {
  if (!Array.isArray(arrayOfEvents)) return [];

  const events = arrayOfEvents.map((event) => {
    const { locationvisibility } = event;
    const isDiscreetLocation = locationvisibility === "discreet" ? true : false;

    if (!isDiscreetLocation) {
      return event;
    }

    const modifiedEvent = {
      ...event,
      locationaddressline1: null,
      locationaddressline2: null,
      locationaddressline3: null,
      locationcoordinates: null,
      locationname: null,
      otherlocationdetails: null,
    };

    return modifiedEvent;
  });

  return events;
};
