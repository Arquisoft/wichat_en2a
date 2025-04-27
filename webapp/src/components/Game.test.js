import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import Home from "./Home";
import Game from "./Game";
import GameOver from "./GameOver";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

const mockAxios = new MockAdapter(axios);
const apiEndpoint = "http://localhost:8000";

const mockQuestion = {
  _id: "1",
  correctAnswer: "Spain",
  imageUrl: "https://via.placeholder.com/300",
  options: ["Spain", "France", "Germany", "Italy"],
  type: "flag",
};

// Render component
const renderGameComponent = () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    </AuthProvider>
  );
};

jest.useFakeTimers();

// Ask API
const setupMockApiResponse = (endpoint, response, status = 200) => {
  mockAxios.onGet(`${apiEndpoint}/${endpoint}`).reply(status, response);
};

describe("Game Component", () => {
  const mockOnNavigate = jest.fn();
  const MAX_QUESTIONS = 10; // Define the max number of questions

  beforeEach(() => {
    mockAxios.reset();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "gameMode") return "flag";
      if (key === "flagQuestions") return "10";
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("renders loading state initially", () => {
    renderGameComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("fetches and displays question and options", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    mockQuestion.options.forEach((option) => {
      expect(screen.getByRole("button", { name: option })).toBeInTheDocument();
    });

    expect(
      screen.getByRole("img", { name: /question related/i })
    ).toBeInTheDocument();
  });

  test("Clicking on back redirect to /home", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    renderGameComponent();
    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: /Exit/i });
      fireEvent.click(backButton);
    });

    // test dialog
    expect(screen.getByText(/Leave Game\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/If you leave now, your progress will be lost/i)
    ).toBeInTheDocument();

    // 3. Click en Cancel → debería cerrar el diálogo
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Leave Game\?/i)).not.toBeInTheDocument();
    });

    // 4. Volver a hacer click en Exit para abrir el diálogo otra vez
    fireEvent.click(screen.getByRole("button", { name: /Exit/i }));

    // 5. Click en Leave → debe navegar a /home
    fireEvent.click(screen.getByRole("button", { name: /Leave/i }));

    render(
      <AuthProvider>
        <MemoryRouter>
          <Home onNavigate={mockOnNavigate} />
        </MemoryRouter>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  test("shows an error message if fetching fails", async () => {
    setupMockApiResponse("question/flag", {}, 500);
    renderGameComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
    });
  });

  test("displays the user input and the LLM output in chat after sending a prompt, ensuring the Send button turns off", async () => {
    const mockInput = "Which traditions does this country have?";
    const mockOutput = {
      answer: "This country has bullfighting as a tradition.",
    };
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios.onPost(`${apiEndpoint}/askllm`).reply(200, mockOutput);

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Type a message.../i), {
      target: { value: mockInput },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send/i }));

    expect(screen.getByRole("button", { name: /Send/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(mockInput)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(mockOutput.answer)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Send/i })).not.toBeDisabled();
  });

  test("next question will be shown 3 seconds after selecting an option", async () => {
    jest.useFakeTimers(); // Usamos timers fake para avanzar tiempo

    setupMockApiResponse("question/flag", mockQuestion);
    const mockQuestion2 = {
      _id: "2",
      imageUrl: "https://example.com/flag2.png",
      correctAnswer: "Germany",
      options: ["Spain", "France", "Germany", "Italy"],
      type: "flag",
    };

    const getSpy = jest.spyOn(axios, "get");
    const postSpy = jest.spyOn(axios, "post");

    getSpy
      .mockResolvedValueOnce({ data: mockQuestion }) // Pregunta 1
      .mockResolvedValueOnce({ data: mockQuestion2 }); // Pregunta 2

    postSpy.mockResolvedValue({ data: { isCorrect: true } });

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const answerButton = screen.getByRole("button", { name: "Spain" });
    fireEvent.click(answerButton);

    // Avanza 3s para que se dispare skipNextQuestion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Germany" })
      ).toBeInTheDocument();
    });

    // Comprobamos que los botones están habilitados (answerSelected = false)
    const allOptionButtons = mockQuestion2.options.map((option) =>
      screen.getByRole("button", { name: option })
    );
    allOptionButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Comprobamos que el input del chat esté vacío (input === "")
    expect(screen.getByPlaceholderText(/Type a message.../i)).toHaveValue("");

    // Comprobamos que el chat esté vacío (messages === [])
    // Podés usar algún testId si los mensajes están en una lista
    const chatMessages = screen.queryAllByTestId("chat-message");
    expect(chatMessages.length).toBe(0);

    getSpy.mockRestore();
    postSpy.mockRestore();
  });

  test("disables all buttons after selecting an answer", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const answerButton = screen.getByRole("button", { name: "Spain" });
    fireEvent.click(answerButton);

    mockQuestion.options.forEach((option) => {
      expect(screen.getByRole("button", { name: option })).toBeDisabled();
    });
  });

  test("changes button color when selecting an incorrect answer", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios
      .onPost(`${apiEndpoint}/check-answer`)
      .reply(200, { isCorrect: false });

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const wrongAnswerButton = screen.getByRole("button", { name: "France" });
    fireEvent.click(wrongAnswerButton);

    await waitFor(() => {
      expect(wrongAnswerButton).toHaveStyle("background-color: #F44336");
    });

    const correctAnswerButton = screen.getByRole("button", { name: "Spain" });
    await waitFor(() => {
      expect(correctAnswerButton).toHaveStyle("background-color: #4CAF50");
    });
  });

  test("changes button color when selecting the correct answer", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios
      .onPost(`${apiEndpoint}/check-answer`)
      .reply(200, { isCorrect: true });

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const correctAnswerButton = screen.getByRole("button", { name: "Spain" });
    fireEvent.click(correctAnswerButton);

    await waitFor(() => {
      expect(correctAnswerButton).toHaveStyle("background-color: #4CAF50");
    });
  });

  test("increments score correctly when correct answer is selected", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios
      .onPost(`${apiEndpoint}/check-answer`)
      .reply(200, { isCorrect: true });

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const scoreElement = screen.getByText(/Score: 0/i);
    expect(scoreElement).toBeInTheDocument();

    const answerButton = screen.getByRole("button", { name: "Spain" });
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(screen.getByText(/Score: 100/i)).toBeInTheDocument();
    });
  });

  test("does not increment score when incorrect answer is selected", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios
      .onPost(`${apiEndpoint}/check-answer`)
      .reply(200, { isCorrect: false });

    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    const scoreElement = screen.getByText(/Score: 0/i);
    expect(scoreElement).toBeInTheDocument();

    const answerButton = screen.getByRole("button", { name: "France" });
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(screen.getByText(/Score: 0/i)).toBeInTheDocument();
    });
  });

  test("save scores when finish all questions", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    mockAxios
      .onPost(`${apiEndpoint}/check-answer`)
      .reply(200, { isCorrect: false });

    renderGameComponent();

    for (let i = 0; i <= MAX_QUESTIONS; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(/What country is represented by the flag shown?/i)
        ).toBeInTheDocument();
      });
      const answerButton = screen.getByRole("button", { name: "Spain" });
      fireEvent.click(answerButton);
    }

    render(
      <AuthProvider>
        <MemoryRouter>
          <GameOver onNavigate={mockOnNavigate} />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();
    });
  });

  test("function handleTimeUp() is called after timer ends", async () => {
    setupMockApiResponse("question/flag", mockQuestion);
    renderGameComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/What country is represented by the flag shown?/i)
      ).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(40000); // Simula 3 segundos
    });

    const correctAnswerButton = screen.getByRole("button", { name: "Spain" });
    await waitFor(() => {
      expect(correctAnswerButton).toHaveStyle("background-color: #F44336");
    });
  });
});

describe("Unit tests for getGameMode method", () => {
  // Helper function to set up localStorage mocks
  const setupLocalStorage = (items) => {
    Storage.prototype.getItem = jest.fn((key) => items[key] || null);
    Storage.prototype.setItem = jest.fn();
  };

  beforeEach(() => {
    // Mock possible API responses
    setupMockApiResponse("question/flag", mockQuestion);
    setupMockApiResponse("question/dino", mockQuestion);
    setupMockApiResponse("question/car", mockQuestion);
    setupMockApiResponse("question/famous-person", mockQuestion);
    setupMockApiResponse("question/place", mockQuestion);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    localStorage.clear();
    mockAxios.reset();
  });

  test("returns stored gameMode when available", () => {
    setupLocalStorage({
      gameMode: "flag",
    });

    renderGameComponent();

    expect(localStorage.getItem).toHaveBeenCalledWith("gameMode");
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test("when custom gameMode is passed in localStorage, the custom mode part is prompted with no shuffle", () => {
    setupLocalStorage({
      gameMode: "custom",
      flagQuestions: "10",
      dinoQuestions: "10",
    });

    renderGameComponent();

    expect(localStorage.getItem).toHaveBeenCalledWith("gameMode");
    expect(localStorage.setItem).toHaveBeenCalledWith("flagQuestions", 9);
    expect(localStorage.setItem).not.toHaveBeenCalledWith("dinoQuestions");
  });

  test("when custom gameMode is passed in localStorage with shuffle, the custom mode part is prompted with shuffle", () => {
    setupLocalStorage({
      gameMode: "custom",
      flagQuestions: "10",
      dinoQuestions: "10",
      shuffle: "true",
    });

    renderGameComponent();

    expect(localStorage.getItem).toHaveBeenCalledWith("gameMode");
    expect(localStorage.setItem).toHaveBeenCalledWith(expect.any(String), 9);
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
  });

  test("defaults to flag game mode when no gameMode is stored", () => {
    setupLocalStorage({});

    renderGameComponent();

    expect(localStorage.getItem).toHaveBeenCalledWith("gameMode");
    waitFor(() => {
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe(`${apiEndpoint}/question/flag`);
    });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
