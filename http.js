// export const strapiUrl = axios.create({
//   // baseURL: "https://dentaflowstrapi-production.up.railway.app/",
//   baseURL: "http://localhost:1337/api/",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization:
//       "Bearer " +
//       "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
//   },
// });

const googleAPI = axios.create({
  baseURL: process.env.GOOGLE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = {
  googleAPI,
};
