const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sendQuestionToGemini } = require('../path/to/your/geminiService'); // Asegúrate de importar la función correctamente

// Mockear el módulo @google/generative-ai
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
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
        }),
      };
    }),
  };
});

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

    // Verifica que los métodos de GoogleGenerativeAI fueron llamados correctamente
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(process.env.GEMINI_KEY);
    expect(GoogleGenerativeAI().getGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-2.0-flash',
    });
    expect(
      GoogleGenerativeAI().getGenerativeModel().generateContent
    ).toHaveBeenCalledWith(question);
  });

  it('should handle errors and return null', async () => {
    // Mockear un error en generateContent
    GoogleGenerativeAI().getGenerativeModel().generateContent.mockRejectedValueOnce(
      new Error('Mocked error')
    );

    const question = 'What is the capital of France?';
    const result = await sendQuestionToGemini(question);

    expect(result).toBeNull();
  });
});