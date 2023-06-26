const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUsers = async () => {
  console.log("trying to get users");
  try {
    const users = await prisma.up_users.findMany({});
    console.log("response from get users", users);
    return users;
  } catch (error) {
    console.log("error getting users from DB", error);
  }
};

const getUserByEventId = async (eventId) => {
  console.log("eventId", eventId);
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

module.exports = {
  getUsers,
  getUserByEventId,
};
// kill $(lsof -t -i:1339)
// kill $(lsof -t -i:1337)

// how to kill port 1339
// lsof -i :1339
// kill -9 <PID>
