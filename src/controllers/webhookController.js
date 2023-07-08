const { default: axios } = require("axios");
const { isEmpty, get } = require("lodash");
const { googleAPI } = require("../../http");
const { getConversationByMessageId } = require("../APIServices/conversations");
const {
  updateEvent,
  getEvent,
} = require("../APIServices/google/googleCalendar");
const { getUserByEventId } = require("../database/services/user");
const { changeConversationReplyStatus } = require("../services/conversations");
const { getNewStatus, parseEventTitle, getEventItems } = require("../utils");
require("dotenv").config();
const WStoken = process.env.WHATSAPP_TOKEN;

// Controlador para la solicitud GET del webhook
async function webhookGetHandler(req, res) {
  // Lógica para manejar la solicitud GET del webhook
  // ...
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  // const verify_token = process.env.VERIFY_TOKEN;
  const verify_token = "HAPPY";
  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent

  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

// Controlador para la solicitud POST del webhook
async function webhookPostHandler(req, res) {
  // Lógica para manejar la solicitud POST del webhook
  // ...
  try {
    // Parse the request body from the POST
    let body = req.body;
    const {
      object,
      changes,
      entry,
      id,
      value,
      statuses,
      contacts,
      messages,
      context,
      field,
    } = getEventItems(body);

    console.log(JSON.stringify(req.body, null, 2));

    const changeReminderReplyStatus = async (conversationId) => {
      const payload = {
        replied: true,
        repliedAt: new Date(),
        msg_id_replied: req.body.entry[0].changes[0].value.messages[0].id,
      };
      try {
        const response = await axios({
          method: "PUT",
          url: `${process.env.STRAPI_URL}/api/conversations/${conversationId}`,
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " +
              "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
          },

          data: {
            data: {
              reminder_reply_status: JSON.stringify(payload),
            },
          },
        });
      } catch (error) {
        console.error("error changing reminder_reply_status", error);
      }
    };

    const handleConversationByMessageId = async (message_id) => {
      try {
        const response = await getConversationByMessageId(message_id);

        if (response?.data?.data?.length > 0) {
          const conversationId = response.data.data[0].id;

          const replyStatusReference = get(
            response,
            "data.data[0].attributes.reminder_reply_status",
            []
          );

          const newStatus = getNewStatus(body);

          changeConversationReplyStatus({
            message_id,
            conversationId,
            replyStatusReference: replyStatusReference
              ? replyStatusReference
              : [],
            newStatus,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    const isMessageStatus = !isEmpty(statuses);

    if (isMessageStatus) {
      const message_id = get(statuses, "[0].id", null);
      handleConversationByMessageId(message_id);
    }

    if (object) {
      if (context?.id) {
        const message_id = context.id;

        handleConversationByMessageId(message_id);
      }
    }

    // Check the Incoming webhook message

    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    if (req.body.object) {
      if (messages[0]) {
        let phone_number_id = changes[0].value.metadata.phone_number_id;
        let from = messages[0].from; // extract the phone number from the webhook payload
        const buttonQuickReply = get(messages, "[0].button", null);
        const contextMessageId = get(messages, "[0].context.id", null);
        // logic for quick reply buttons
        let msg_body = "";

        if (buttonQuickReply) {
          const payloadObject = JSON.parse(buttonQuickReply?.payload);
          const clientResponse = get(payloadObject, "response", null);
          const eventId = get(payloadObject, "googleEventId", null);
          const calendarId = get(payloadObject, "calendarId", null);
          console.log("eventId", eventId);
          console.log("calendarId", calendarId);
          console.log("clientResponse", clientResponse);
          // get conversation by message id
          const conversationData = await getConversationByMessageId(
            contextMessageId
          ).catch((error) => {
            console.error("error getting conversation", error);
          });
          const user = await getUserByEventId(eventId);
          const accessToken = get(user, "google_session.accessToken", null);
          const conversation = get(
            conversationData,
            "data.data[0].attributes",
            null
          );

          // const token = get(conversation, "user.data.attributes.ggToken", null);
          let summaryReference;

          if (accessToken) {
            googleAPI.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;
            const event = await getEvent({ calendarId, eventId }).catch(
              (error) => {
                console.error("error getting event", error);
              }
            );
            summaryReference = get(event, "data.summary", null);
          }

          if (clientResponse === "attend") {
            const response = await updateEvent({
              calendarId,
              eventId,
              params: {
                summary: parseEventTitle({
                  titleRef: summaryReference,
                  response: clientResponse,
                }),
              },
            }).catch((error) => {
              console.error("error updating event", error);
            });
            msg_body = "¡Gracias por confirmar tu cita!";
          }
          if (clientResponse === "cancel") {
            const response = await updateEvent({
              calendarId,
              eventId,
              params: {
                summary: parseEventTitle({
                  titleRef: summaryReference,
                  response: clientResponse,
                }),
              },
            }).catch((error) => {
              console.error("error updating event", error);
            });
            msg_body = "¡Gracias por notificarnos!";
          }
          if (clientResponse === "reschedule") {
            const response = await updateEvent({
              calendarId,
              eventId,
              params: {
                summary: parseEventTitle({
                  titleRef: summaryReference,
                  response: clientResponse,
                }),
              },
            }).catch((error) => {
              console.error("error updating event", error);
            });
            const userRemindersConfig = get(
              conversation,
              "user.data.attributes.remindersConfig",
              null
            );

            const contactName = get(userRemindersConfig, "wsContactName", null);
            console.log("contactName", contactName);
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
            console.log("response sending 200");
            res.sendStatus(200);
            return;
          }
        } else {
          console.log("text message line 273");
          msg_body = messages[0]?.text?.body; // extract the message text from the webhook payload
        }

        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
            "https://graph.facebook.com/v17.0/" +
            phone_number_id +
            "/messages?access_token=" +
            WStoken,
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: msg_body },
          },
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404);
    }
    console.log("response sending 200");
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500); // Enviar una respuesta de error si ocurre alguna excepción
  }
}

module.exports = {
  webhookGetHandler,
  webhookPostHandler,
};
