jest.mock('./llm-service', () => {
    return {
      sendQuestionToGemini: jest.fn().mockResolvedValue({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Mocked Gemini response',
                  },
                ],
              },
            },
          ],
        },
      }),
    };
  });
  
  const { sendQuestionToGemini } = require('./llm-service');
  
  describe('sendQuestionToGemini', () => {
    it('should return a mocked response from Gemini', async () => {
      const question = 'What is the capital of France?';
      const result = await sendQuestionToGemini(question);
  
      expect(result).toEqual({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Mocked Gemini response',
                  },
                ],
              },
            },
          ],
        },
      });
    });
  });