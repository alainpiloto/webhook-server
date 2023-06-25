const { googleAPI } = require("../../../http");

const getEvent = async ({ eventId, calendarId }) => {
  try {
    console.log("eventId", eventId);
    console.log("calendarId", calendarId);
    const response = await googleAPI.get(
      `calendar/v3/calendars/${calendarId}/events/${eventId}`
    );
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

const updateEvent = async ({ eventId, calendarId, params }) => {
  // console.log("eventId", eventId);
  // console.log("calendarId", calendarId);
  console.log("params line 19", params);

  try {
    const response = await googleAPI.patch(
      `calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        ...params,
      }
    );
    console.log("response of updateEvent", response.data);
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

module.exports = {
  getEvent,
  updateEvent,
};
