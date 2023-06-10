const { updateConversation } = require("../../APIServices/conversations");

const changeConversationReplyStatus = async (data) => {
  const { message_id, conversationId, replyStatusReference, newStatus } = data;

  const reminderStatusUpdated = [
    ...replyStatusReference,
    {
      createdAt: new Date(),
      fromStatus: "notSentYet",
      statusName: newStatus,
    },
  ];

  const params = {
    reminder_reply_status: JSON.stringify(reminderStatusUpdated),
  };

  const response = await updateConversation(conversationId, params);
};

module.exports = {
  changeConversationReplyStatus,
};
