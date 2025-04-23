let mockImplementation = () => ({
  getGenerativeModel: () => ({
    generateContent: () => ({
      response: {
        candidates: [
          {
            content: {
              parts: [{ text: "llmAnswer" }],
            },
          },
        ],
      },
    }),
  }),
});

function GoogleGenerativeAI() {
  return mockImplementation();
}

// For being able to modify it
GoogleGenerativeAI.__setMockImplementation = (impl) => {
  mockImplementation = impl;
};

module.exports = {
  GoogleGenerativeAI,
};