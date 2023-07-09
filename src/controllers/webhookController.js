const { default: axios } = require("axios");
const { isEmpty, get } = require("lodash");
const { googleAPI } = require("../../http");
const { getConversationByMessageId } = require("../APIServices/conversations");
const { refreshToken } = require("../APIServices/google/googleAuth");
const {
  updateEvent,
  getEvent,
} = require("../APIServices/google/googleCalendar");
const {
  getUserByEventId,
  getUserByMessageId,
} = require("../database/services/user");
const { changeConversationReplyStatus } = require("../services/conversations");
const { handleUpdateEvent } = require("../services/google");
const { updateGoogleSession } = require("../services/users");
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

    const getConversationFromUser = ({ user, message_id }) => {
      const userConversations = get(user, "conversations_user_links", []);

      for (const obj of userConversations) {
        if (obj.conversations.init_message_id === message_id) {
          return obj.conversations;
        }
      }
      return null;
    };

    console.log(JSON.stringify(req.body, null, 2));
    const isExpired = (unixTimestamp) => {
      const now = new Date();
      const date = new Date(unixTimestamp * 1000);
      return now > date;
    };
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
      console.log("req.body.object", req.body.object);

      if (
        statuses &&
        statuses[0]?.status === "delivered" &&
        statuses[0]?.conversation?.origin?.type === "utility"
      ) {
        const message_id = get(statuses, "[0].id", null);

        // get user's google session by message id (init_message_id)
        const userData = await getUserByMessageId(message_id).catch((error) => {
          console.error("error getting user", error);
        });

        if (userData) {
          const { calendar_id: calendarId, event_id: eventId } =
            getConversationFromUser({
              user: userData,
              message_id,
            });

          const userId = get(userData, "id", null);
          const googleSession = get(userData, "google_session", null);

          if (!isExpired(googleSession?.accessTokenExpires)) {
            const params = {
              userId,
              eventId,
              calendarId,
              reminderStatus: "delivered",
              accessTokenExpires: googleSession?.accessTokenExpires,
              accessToken: googleSession?.accessToken,
            };
            await handleUpdateEvent({ params });
          }

          // if access token is expired, refresh it
          if (isExpired(googleSession?.accessTokenExpires)) {
            const response = await refreshToken(googleSession?.refreshToken);
            const accessTokenExpires = Date.now() + response?.expires_in * 1000;

            const params = {
              userId,
              calendarId,
              reminderStatus: "delivered",
              googleSession: {
                refreshToken:
                  response?.refresh_token ??
                  userData?.google_session?.refreshToken,
                accessToken: response?.access_token,
                accessTokenExpires,
              },
            };
            //
            await handleUpdateEvent({ params });

            // update user's google session with new access token
            await updateGoogleSession(params);
          }
        } else {
          res.sendStatus(200);
          return;
        }
      }
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

          // get conversation by message id
          const conversationData = await getConversationByMessageId(
            contextMessageId
          ).catch((error) => {
            console.error("error getting conversation", error);
          });
          const userData = await getUserByEventId(eventId);

          if (userData) {
            const userId = get(userData, "id", null);
            const googleSession = get(userData, "google_session", null);
            if (!isExpired(googleSession?.accessTokenExpires)) {
              const params = {
                userId,
                reminderStatus: clientResponse,
                calendarId,
                eventId,
                accessToken: googleSession?.accessToken,
              };
              handleUpdateEvent;
              msg_body = await handleUpdateEvent({
                params,
                conversationData,
                phone_number_id,
                WStoken,
                from,
              });
            }
            if (isExpired(googleSession?.accessTokenExpires)) {
              const response = await refreshToken(googleSession?.refreshToken);
              const accessTokenExpires =
                Date.now() + response?.expires_in * 1000;

              const params = {
                userId,
                reminderStatus: clientResponse,
                googleSession: {
                  refreshToken:
                    response?.refresh_token ??
                    userData?.google_session?.refreshToken,
                  accessToken: response?.access_token,
                  accessTokenExpires,
                },
              };
              //
              try {
                msg_body = await handleUpdateEvent({
                  params,
                  conversationData,
                  phone_number_id,
                  WStoken,
                  from,
                });
              } catch (error) {}

              // update user's google session with new access token
              await updateGoogleSession(params);
            }
          }
        } else {
          msg_body = messages[0]?.text?.body; // extract the message text from the webhook payload
        }
        if (msg_body) {
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
      }
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404);
    }
    console.log("executing line 343 before sending 200 ");
    res.sendStatus(200);
  } catch (error) {
    console.log("error line 403", error);
    console.error(error);
    res.sendStatus(500); // Enviar una respuesta de error si ocurre alguna excepción
  }
}

module.exports = {
  webhookGetHandler,
  webhookPostHandler,
};
