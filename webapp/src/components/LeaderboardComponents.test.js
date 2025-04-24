import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WinRateBar, StickyPlayerHeader, calculatePointsToLevelUp } from './LeaderboardComponents';

describe('WinRateBar Component', () => {
  it('renders the correct win rate', () => {
    render(<WinRateBar winRate="75.5" />);
    expect(screen.getByText('75.50%')).toBeInTheDocument();
  });

  it('defaults to 0% if winRate is invalid', () => {
    render(<WinRateBar winRate={null} />);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });
});

describe('StickyPlayerHeader Component', () => {
  const mockPlayer = {
    username: 'TestUser',
    totalScore: 1000,
    gamesPlayed: 50,
    avgPointsPerGame: 20
  };

  it('renders player username and score info', () => {
    render(
      <StickyPlayerHeader player={mockPlayer} rank={1} pointsToLevelUp={150} />
    );

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText(/Score: 1000/i)).toBeInTheDocument();
  });

});

describe('calculatePointsToLevelUp function', () => {
  const players = [
    { username: 'Player1', totalScore: 1200 },
    { username: 'Player2', totalScore: 1100 },
    { username: 'Player3', totalScore: 900 }
  ];

  it('returns correct points to level up', () => {
    const result = calculatePointsToLevelUp(players, 2, players[2]);
    expect(result).toBe(201); // 1100 - 900 + 1
  });

  it('returns null if user is top ranked', () => {
    const result = calculatePointsToLevelUp(players, 0, players[0]);
    expect(result).toBeNull();
  });

  it('returns null if currentUser is null', () => {
    const result = calculatePointsToLevelUp(players, 1, null);
    expect(result).toBeNull();
  });
});
