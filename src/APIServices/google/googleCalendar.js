const { googleAPI } = require("../../../http");

const getEvent = async ({ eventId, calendarId }) => {
  try {
    const response = await googleAPI.get(
      `calendar/v3/calendars/${calendarId}/events/${eventId}`
    );
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

const updateEvent = async ({ eventId, calendarId, params }) => {
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
