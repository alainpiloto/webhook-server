const { isEmpty } = require("lodash");
const cron = require("node-cron");
const { refreshToken } = require("../APIServices/google/googleAuth");
const { getUsers } = require("../database/services/user");
const { updateUser } = require("../services/users");

// Función para realizar el cron job
function refreshGoogleSession() {
  // Programar la tarea según tus necesidades
  cron.schedule("*/5 * * * *", async () => {
    const users = await getUsers();

    let usersToRefresh = [];

    users.forEach((user) => {
      const tokenExpiration = user?.googleSession?.accessTokenExpires;
      // if token expires in less than 15 minutes (900 seconds), add user to usersToRefresh array
      if (tokenExpiration - Date.now() < 900000) {
        usersToRefresh.push(user);
      }
    });

    console.log("usersToRefresh", usersToRefresh);

    if (!isEmpty(usersToRefresh)) {
      for await (const user of usersToRefresh) {
        const response = await refreshToken(user?.googleSession?.refreshToken);

        const accessTokenExpires = Date.now() + response?.expires_in * 1000;

        const params = {
          googleSession: {
            refreshToken:
              response?.refresh_token ?? user?.googleSession?.refreshToken,
            accessToken: response?.access_token,
            accessTokenExpires,
          },
        };
        if (!isEmpty(response)) {
          updateUser({ userId: user?.id, params });
        }
      }
    }
  });
}

module.exports = refreshGoogleSession;
