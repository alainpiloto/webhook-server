const { get } = require("lodash");

const getEventItems = (body) => {
  console.log("body from getMessageType", JSON.stringify(body, null, 2));

  const object = get(body, "object", "");
  const entry = get(body, "entry", []);
  const id = get(entry, "[0].id", "");
  const changes = get(entry, "[0].changes", []);
  const value = get(changes, "[0].value", []);
  const statuses = get(value, "statuses", []);
  const contacts = get(value, "contacts", []);
  const messages = get(value, "messages", []);
  const field = get(changes, "field", "");
  const context = get(messages, "[0].context", {});
  // console.logs of the above variables

  // return the above variables
  return {
    object,
    entry,
    id,
    changes,
    value,
    statuses,
    contacts,
    messages,
    field,
  };
};

//   if( )
// };

module.exports = {
  getEventItems,
};
