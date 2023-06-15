const { isEmpty } = require("lodash");
const { getConversationByMessageId } = require("../APIServices/conversations");
const { getEventType } = require("../utils");

const processWebhookEvents = (req, res) => {
  // it refers to the whatsapp events
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

  const eventType = getEventType(body);
  const message_id = get(statuses, "[0].id", null);
  const conversation = getConversationByMessageId(message_id);
};
