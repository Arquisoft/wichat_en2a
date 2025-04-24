import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from './Leaderboard';
import { MemoryRouter } from 'react-router-dom';

// Mock global fetch
global.fetch = jest.fn();

// Mock react-router future flags warnings
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/leaderboard' }),
}));

describe('Leaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('username', 'testUser');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderComponent = async (mockData) => {
    await act(async () => {
      render(
        
          <MemoryRouter>
            <Leaderboard />
          </MemoryRouter>
        
      );
    });
  };

  it('should display loading state initially', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    await renderComponent();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/Loading Leaderboard.../i)).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load leaderboard data/i)).toBeInTheDocument();
    });
  });

  it('should handle server errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    });
    
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load leaderboard data/i)).toBeInTheDocument();
    });
  });

  it('should display player data correctly', async () => {
    const mockPlayers = [
      {
        _id: '1',
        username: 'player1',
        totalScore: 300,
        gamesPlayed: 2,
        avgPointsPerGame: 150,
        winRate: 100
      },
      {
        _id: '2',
        username: 'player2',
        totalScore: 150,
        gamesPlayed: 2,
        avgPointsPerGame: 75,
        winRate: 50
      }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlayers
    });
    
    await renderComponent();
    
    await waitFor(() => {
      // Check headers
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Total Score')).toBeInTheDocument();
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('Avg. Score')).toBeInTheDocument();
      expect(screen.getByText('Win-rate')).toBeInTheDocument();
      
      // Check player data
      expect(screen.getByText('player1')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('150.00')).toBeInTheDocument();
      expect(screen.getByText('100.00%')).toBeInTheDocument();
      
      
    });
  });


  it('should sort players correctly', async () => {
    const mockPlayers = [
      { _id: '1', username: 'playerB', totalScore: 200 },
      { _id: '2', username: 'playerA', totalScore: 300 }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlayers
    });
    
    await renderComponent();
    
    await waitFor(() => {
      const totalScores = screen.getAllByRole('cell', { name: /^\d+$/ });
      expect(totalScores[0]).toHaveTextContent('300'); // First row
      expect(totalScores[1]).toHaveTextContent('200'); // Second row
    });
  });
});

