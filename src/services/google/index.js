const { googleAPI } = require("../../../http");
const {
  getEvent,
  updateEvent,
} = require("../../APIServices/google/googleCalendar");
const get = require("lodash/get");
const { parseEventTitle } = require("../../utils");
const { default: axios } = require("axios");

const handleUpdateEvent = async ({
  params,
  conversationData,
  phone_number_id,
  WStoken,
  from,
}) => {
  const { accessToken, calendarId, eventId, reminderStatus } = params;
  googleAPI.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  const event = await getEvent({ calendarId, eventId }).catch((error) => {
    console.error("error getting event", error);
  });
  summaryReference = get(event, "data.summary", null);
  let message = "";

  if (reminderStatus === "reschedule") {
    const conversation = get(conversationData, "data.data[0].attributes", null);
    const userRemindersConfig = get(
      conversation,
      "user.data.attributes.remindersConfig",
      null
    );

    const contactName = get(userRemindersConfig, "wsContactName", null);

    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url:
        "https://graph.facebook.com/v17.0/" +
        phone_number_id +
        "/messages?access_token=" +
        WStoken,
      data: {
        to: from,
        messaging_product: "whatsapp",
        type: "contacts",
        contacts: [
          {
            name: {
              first_name: contactName,
              formatted_name: contactName,
            },
            phones: [
              {
                wa_id: "593993950137",
                type: "WORK",
              },
            ],
          },
        ],
      },
      headers: { "Content-Type": "application/json" },
    }).catch((error) => {
      console.log("error sending contact", error);
    });

    return;
  }
  await updateEvent({
    calendarId,
    eventId,
    params: {
      summary: parseEventTitle({
        titleRef: summaryReference,
        response: reminderStatus,
      }),
    },
  })
    .then((response) => {
      if (reminderStatus === "cancel") {
        message = "¡Gracias por notificarnos!";
      }
      if (reminderStatus === "attend") {
        message = "¡Gracias por confirmar tu cita!";
      }
    })
    .catch((error) => {
      console.error("error updating event", error);
    });
  return message;
};

module.exports = { handleUpdateEvent };
