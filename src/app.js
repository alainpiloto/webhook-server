/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

const { get, isEmpty } = require("lodash");

const first = require("lodash/first");
require("dotenv").config();

// require axios for making http requests

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
// const token = process.env.WHATSAPP_TOKEN;
const token = process.env.WHATSAPP_TOKEN;
// Imports dependencies and set up http server
const request = require("request");
const v1Router = require("./v1/routes");
const express = require("express");
const body_parser = require("body-parser");
const { getEventItems, getNewStatus } = require("./utils");
const { strapi } = require("./axiosInstances");
const { changeConversationReplyStatus } = require("./services/conversations");
const axios = require("axios").default;
const app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success

const PORT = process.env.PORT || 1339;

app.listen(PORT, () => console.log("webhook is listening", PORT));

app.use("/api/v1", v1Router);

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
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
  console.log("object", object);
  console.log("entry", entry);
  console.log("id", id);
  console.log("changes", changes);
  console.log("value", value);
  console.log("statuses", statuses);
  console.log("contacts", contacts);
  console.log("messages", messages);
  console.log("field", field);
  console.log("body", JSON.stringify(body));

  console.log(JSON.stringify(req.body, null, 2));

  const changeReminderReplyStatus = async (conversationId) => {
    console.log("conversationId", conversationId);
    const payload = {
      replied: true,
      repliedAt: new Date(),
      msg_id_replied: req.body.entry[0].changes[0].value.messages[0].id,
    };
    try {
      const response = await axios({
        method: "PUT",
        url: `http://localhost:1337/api/conversations/${conversationId}`,
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
      console.log("response", response.data);
    } catch (error) {
      console.error("error changing reminder_reply_status", error);
    }
  };

  const getConversationByMessageId = async (message_id) => {
    try {
      const response = await strapi(
        `api/conversations?populate=*&filters[init_message_id]=${message_id}`
      );

      console.log("conversation data", response.data);
      console.log("message_id from get", message_id);

      if (response?.data?.data?.length > 0) {
        console.log("conversation data inside", response.data.data[0]);
        const conversationId = response.data.data[0].id;
        console.log("conversationId", conversationId);

        const replyStatusReference = get(
          response,
          "data.data[0].attributes.reminder_reply_status",
          []
        );

        console.log("reminder_reply_status", replyStatusReference);

        console.log("before setting MessageStatus");

        const newStatus = getNewStatus(body);

        changeConversationReplyStatus({
          message_id,
          conversationId,
          replyStatusReference: replyStatusReference
            ? replyStatusReference
            : [],
          newStatus,
        });

        console.log("replyStatusReference", replyStatusReference);
        // // console.log("appointment_id", event_id);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const isMessageStatus = !isEmpty(statuses);
  console.log("isMessageStatus", isMessageStatus);

  if (isMessageStatus) {
    const message_id = get(statuses, "[0].id", null);
    getConversationByMessageId(message_id);
  }

  if (object) {
    console.log("is an object");
    console.log("context 234", context);
    if (context?.id) {
      console.log("context.id", context.id);

      const message_id = context.id;
      console.log(
        "message as a response to init message in database",
        message_id
      );

      console.log("button quick reply");
      getConversationByMessageId(message_id);
    }
  }

  // Check the Incoming webhook message

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (messages[0]) {
      let phone_number_id = changes[0].value.metadata.phone_number_id;
      let from = messages[0].from; // extract the phone number from the webhook payload
      const buttonQuickReply = get(messages, "[0].button", null);
      // logic for quick reply buttons
      let msg_body = "";
      if (buttonQuickReply) {
        console.log("button quick reply");
        const response = first(buttonQuickReply.payload.split(":"));
        console.log("response", response);
        if (response === "attend") {
          msg_body = "¡Gracias por confirmar tu cita!";
        }
        if (response === "cancel") {
          msg_body = "¡Gracias por notificarnos!";
        }
        if (response === "reschedule") {
          axios({
            method: "POST", // Required, HTTP method, a string, e.g. POST, GET
            url:
              "https://graph.facebook.com/v17.0/" +
              phone_number_id +
              "/messages?access_token=" +
              token,
            data: {
              to: from,
              messaging_product: "whatsapp",
              type: "contacts",
              contacts: [
                {
                  name: {
                    first_name: "Alain",
                    formatted_name: "Alain Piloto",
                    last_name: "Piloto",
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
          res.sendStatus(200);
          return;
        }
      } else {
        console.log("text message");
        msg_body = messages[0].text.body; // extract the message text from the webhook payload
      }

      axios({
        method: "POST", // Required, HTTP method, a string, e.g. POST, GET
        url:
          "https://graph.facebook.com/v17.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
        data: {
          messaging_product: "whatsapp",
          to: from,
          text: { body: "Ack: " + msg_body },
        },
        headers: { "Content-Type": "application/json" },
      });
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
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
});
