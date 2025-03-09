import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from './Leaderboard';

global.fetch = jest.fn();

describe('Leaderboard component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    // Simulate pending fetch
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<Leaderboard />);
    
    // Check if progessbar is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    // Mock fetch to return an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<Leaderboard />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to load leaderboard data/i)).toBeInTheDocument();
    });
  });

  it('should display server error when server returns error status', async () => {
    // Mock fetch to return a non-ok response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    render(<Leaderboard />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to load leaderboard data/i)).toBeInTheDocument();
    });
  });

  it('should display "No player data available" when data is empty', async () => {
    // Mock fetch to return an empty array
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    render(<Leaderboard />);
    
    // Wait for the table to load and check for the empty message
    await waitFor(() => {
      expect(screen.getByText(/No player data available/i)).toBeInTheDocument();
    });
  });

  it('should display player data when fetch is successful', async () => {
    // Create test players
    const mockPlayers = [
      {
        username: 'player3',
        totalScore: 500,
        gamesPlayed: 2,
        avgPointsPerGame: 250,
        winRate: 100
      },
      {
        username: 'player1',
        totalScore: 300,
        gamesPlayed: 2,
        avgPointsPerGame: 150,
        winRate: 100
      },
      {
        username: 'player2',
        totalScore: 150,
        gamesPlayed: 2,
        avgPointsPerGame: 75,
        winRate: 50
      }
    ];
    
    // Mock successful fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlayers
    });
    
    render(<Leaderboard />);
    
    // Wait for the table to load with data
    await waitFor(() => {
      // Check for player usernames
      expect(screen.getByText('player1')).toBeInTheDocument();
      expect(screen.getByText('player2')).toBeInTheDocument();
      expect(screen.getByText('player3')).toBeInTheDocument();
      
      // Check for total scores
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      
      // Check for games played
      expect(screen.getAllByText('2')).toHaveLength(3);
      
      // Check for average scores
      expect(screen.getByText('250.00')).toBeInTheDocument();
      expect(screen.getByText('150.00')).toBeInTheDocument();
      expect(screen.getByText('75.00')).toBeInTheDocument();
      
      // Check for win-rates
      expect(screen.getAllByText('100.00%')).toHaveLength(2);
      expect(screen.getByText('50.00%')).toBeInTheDocument();
    });
  });

  it('should handle null or undefined values in player data', async () => {
    // Mock player data with no avg point
    const mockPlayers = [
      {
        username: 'playerWithMissingData',
        totalScore: 50,
        gamesPlayed: 3,
        // avgPointsPerGame =null
        winRate: null
      }
    ];
    
    // Mock correct fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlayers
    });
    
    render(<Leaderboard />);
    
    // Wait loading data
    await waitFor(() => {
      expect(screen.getByText('playerWithMissingData')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument(); // No avgPointsPerGame
      expect(screen.getByText('0.00%')).toBeInTheDocument(); // No  win-rate
    });
  });

  it('should fetch data from the correct endpoint', async () => {
    // Mock correct fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    render(<Leaderboard />);
    
    // Verify the correct URL, maybe 3000, pendant of change if fail
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8003/leaderboard");
  });
});