function GoogleGenerativeAI() {
    return {
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
    };
    }

module.exports = {
  GoogleGenerativeAI,
};
