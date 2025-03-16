const axios = require("axios");

function generateTemplateMocks() {
  axios.post.mockImplementation((url, data) => {
    return Promise.resolve({
      data: { choices: [{ message: { content: "llmanswer" } }] },
    });
  });
}

module.exports = {
  generateTemplateMocks,
};
