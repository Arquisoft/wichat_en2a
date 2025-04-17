import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import Home from './Home';
import { MemoryRouter } from 'react-router-dom';
import axios from "axios";
import {AuthProvider} from "./AuthContext";

//useNavigate Mock
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('axios');

describe('Home component', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        mockNavigate.mockClear(); // Clear mock before the start of each test
        jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    });

    const renderHomeComponent = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <Home onNavigate={mockNavigate} />
                </MemoryRouter>
            </AuthProvider>
        );
    };

    it('renders the Home title', () => {
        renderHomeComponent();
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    it('navigates to "game" when "Play" button is clicked', () => {
        renderHomeComponent();
        fireEvent.click(screen.getByRole('button', { name: /Play/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/gamemodes');
    });

    it('renders all buttons', () => {
        renderHomeComponent();
        expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
    });

    it('Welcomes the user displaying its name', () => {
        const mockUsername = 'JohnDoe';
        Storage.prototype.getItem = jest.fn(() => mockUsername);

        renderHomeComponent();

        // Check if the username is displayed
        expect(screen.getByText((content) => content.includes('Welcome back, JohnDoe'))).toBeInTheDocument();

    })

    it('If something went wrong and username is not stored, welcomes the user displaying guest', () => {
        Storage.prototype.getItem = jest.fn(() => null);

        renderHomeComponent();

        // Check if 'Guest' is displayed when no username is found
        expect(screen.getByText((content) => content.includes('Welcome back, Guest'))).toBeInTheDocument();

    })

    it('displays top 3 players from leaderboard', async () => {
        const leaderboardData = [
            { _id: '1', totalScore: 300 },
            { _id: '2', totalScore: 250 },
            { _id: '3', totalScore: 200 },
        ];
        axios.get.mockResolvedValueOnce({ data: leaderboardData });

        //Mock fetch for each user's data
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                json: async () => ({ username: 'Alice' })
            })
            .mockResolvedValueOnce({
                json: async () => ({ username: 'Bob' })
            })
            .mockResolvedValueOnce({
                json: async () => ({ username: 'Charlie' })
            });

        renderHomeComponent();

        expect(await screen.findByText('🥇Alice - 300 pts')).toBeInTheDocument();
        expect(await screen.findByText('🥈Bob - 250 pts')).toBeInTheDocument();
        expect(await screen.findByText('🥉Charlie - 200 pts')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(3);
    });
});