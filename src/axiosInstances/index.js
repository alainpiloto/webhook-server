const axios = require("axios").default;

const strapi = axios.create({
  baseURL: process.env.STRAPI_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
  },
});

module.exports = {
  strapi,
};
