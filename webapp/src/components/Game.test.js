import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Home from './Home';
import Game from './Game';
import GameOver from './GameOver';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = 'http://localhost:8000';

const mockQuestion = {
    correctAnswer: 'Spain',
    imageUrl: 'https://via.placeholder.com/300',
    options: ['Spain', 'France', 'Germany', 'Italy']
};

jest.useFakeTimers();

describe('Game Component', () => {
    const mockOnNavigate = jest.fn();
    const MAX_QUESTIONS = 10; // Define the max number of questions

    beforeEach(() => {
        mockAxios.reset();
    });

    // Render component
    const renderGameComponent = () => {
        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );
    };

    // Ask API
    const setupMockApiResponse = (endpoint, response, status = 200) => {
        mockAxios.onGet(`${apiEndpoint}/${endpoint}`).reply(status, response);
    };

    test('renders loading state initially', () => {
        renderGameComponent();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('fetches and displays question and options', async () => {
        setupMockApiResponse('question', mockQuestion);
        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        mockQuestion.options.forEach(option => {
            expect(screen.getByRole('button', { name: option })).toBeInTheDocument();
        });

        expect(screen.getByRole('img', { name: /question related/i })).toBeInTheDocument();
    });

    test('Clicking on back redirect to /home', async () => {
        setupMockApiResponse('question', mockQuestion);
        renderGameComponent();
        await waitFor(() => {
            const backButton = screen.getByRole('button', { name: /Back/i});
            fireEvent.click(backButton);
        })
        render(
            <MemoryRouter>
                <Home onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
        });
    });

    test('shows an error message if fetching fails', async () => {
        setupMockApiResponse('question', {}, 500);
        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
        });
    });

    test('displays the user input and the LLM output in chat after sending a prompt, ensuring the Send button turns off', async () => {
        const mockInput = "Which traditions does this country have?";
        const mockOutput = { answer: 'This country has bullfighting as a tradition.' };
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/askllm`).reply(200, mockOutput);

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/Type a message.../i), {
            target: { value: mockInput }
        });

        fireEvent.click(screen.getByRole('button', { name: /Send/i }));

        expect(screen.getByRole('button', { name: /Send/i })).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText(mockInput)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(mockOutput.answer)).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /Send/i })).not.toBeDisabled();

    });

    test('allows selecting an answer and enables "Next Question" button', async () => {
        setupMockApiResponse('question', mockQuestion);
        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const answerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(answerButton);

        const nextQuestionButton = screen.getByRole('button', { name: /Next Question/i });
        expect(nextQuestionButton).toBeEnabled();
    });

    test('disables all buttons after selecting an answer', async () => {
        setupMockApiResponse('question', mockQuestion);
        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const answerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(answerButton);

        mockQuestion.options.forEach(option => {
            expect(screen.getByRole('button', { name: option })).toBeDisabled();
        });
    });

    test('changes button color when selecting an incorrect answer', async () => {
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: false });

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const wrongAnswerButton = screen.getByRole('button', { name: 'France' });
        fireEvent.click(wrongAnswerButton);

        await waitFor(() => {
            expect(wrongAnswerButton).toHaveStyle('background-color: #F44336');
        });

        const correctAnswerButton = screen.getByRole('button', { name: 'Spain' });
        await waitFor(() => {
            expect(correctAnswerButton).toHaveStyle('background-color: #4CAF50');
        });
    });

    test('changes button color when selecting the correct answer', async () => {
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: true });

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const correctAnswerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(correctAnswerButton);

        await waitFor(() => {
            expect(correctAnswerButton).toHaveStyle('background-color: #4CAF50');
        });
    });

    test('initializes the database when no questions are found', async () => {
        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, []);
        renderGameComponent();

        await waitFor(() => {
            expect(mockAxios.history.post.length).toBe(1); // It should have called the POST request once
            expect(mockAxios.history.post[0].url).toBe(`${apiEndpoint}/fetch-flag-data`);
        });

        // Simulate the successful fetch of the question after database initialization
        setupMockApiResponse('question', mockQuestion);
        renderGameComponent();

        // After initializing the database, the question should be fetched and displayed
        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });
    });

    test('increments score correctly when correct answer is selected', async () => {
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: true });

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const scoreElement = screen.getByText(/Score: 0/i);
        expect(scoreElement).toBeInTheDocument();

        const answerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(answerButton);

        await waitFor(() => {
            expect(screen.getByText(/Score: 100/i)).toBeInTheDocument();
        });
    });

    test('does not increment score when incorrect answer is selected', async () => {
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: false });

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const scoreElement = screen.getByText(/Score: 0/i);
        expect(scoreElement).toBeInTheDocument();

        const answerButton = screen.getByRole('button', { name: 'France' });
        fireEvent.click(answerButton);

        await waitFor(() => {
            expect(screen.getByText(/Score: 0/i)).toBeInTheDocument();
        });
    });

    test('save scores when finish all questions', async () => {
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: false });

        renderGameComponent();

        for (let i = 0; i <= MAX_QUESTIONS; i++){
            await waitFor(() => {
                expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
            });
            const answerButton = screen.getByRole('button', { name: 'Spain' });
            fireEvent.click(answerButton);
        }

        render(
            <MemoryRouter>
                <GameOver onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();
        });
    });
});
