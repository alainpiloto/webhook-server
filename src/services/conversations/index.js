const { updateConversation } = require("../../APIServices/conversations");

const changeConversationReplyStatus = async (params) => {
  const { message_id, conversationId, replyStatusReference, newStatus } =
    params;

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

  const response = await updateConversation(params);
};

module.exports = {
  changeConversationReplyStatus,
};
