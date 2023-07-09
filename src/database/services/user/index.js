const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUsers = async () => {
  try {
    const users = await prisma.up_users.findMany({});
    return users;
  } catch (error) {
    console.log("error getting users from DB", error);
  }
};

const getUserByEventId = async (eventId) => {
  const user = await prisma.up_users.findFirst({
    where: {
      conversations_user_links: {
        some: {
          conversations: {
            event_id: eventId,
          },
        },
      },
    },
  });
  return user;
};

const getUserByMessageId = async (message_id) => {
  const user = await prisma.up_users.findFirst({
    include: {
      conversations_user_links: {
        include: {
          conversations: true,
        },
      },
    },

    where: {
      conversations_user_links: {
        some: {
          conversations: {
            init_message_id: message_id,
          },
        },
      },
    },
  });
  return user;
};

module.exports = {
  getUsers,
  getUserByMessageId,
  getUserByEventId,
};
// kill $(lsof -t -i:1339)
// kill $(lsof -t -i:1337)

// how to kill port 1339
// lsof -i :1339
// kill -9 <PID>
