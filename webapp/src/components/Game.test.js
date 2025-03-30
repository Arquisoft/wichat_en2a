import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = 'http://localhost:8000';

const mockQuestion = {
    correctAnswer: 'Spain',
    imageUrl: 'https://via.placeholder.com/300',
    options: ['Spain', 'France', 'Germany', 'Italy']
};

describe('Game Component', () => {
    const mockOnNavigate = jest.fn();

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

    test('shows an error message if fetching fails', async () => {
        setupMockApiResponse('question', {}, 500);
        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
        });
    });

    test('fetches and displays a hint when "?" button is clicked', async () => {
        const mockHint = { answer: 'This country has bullfighting as a tradition.' };
        setupMockApiResponse('question', mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/askllm`).reply(200, mockHint);

        renderGameComponent();

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: '?' }));

        await waitFor(() => {
            expect(screen.getByText(mockHint.answer)).toBeInTheDocument();
        });
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
});
