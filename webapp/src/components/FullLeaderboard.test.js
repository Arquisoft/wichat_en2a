import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FullLeaderboard from './FullLeaderboard';
import { MemoryRouter } from 'react-router-dom';

const mockPlayers = Array.from({ length: 20 }, (_, i) => ({
  _id: `id-${i}`,
  username: `Player${i + 1}`,
  totalScore: 1000 - i * 10,
  gamesPlayed: 10 + i,
  avgPointsPerGame: 100 - i,
  winRate: (50 + i).toFixed(2),
}));

describe('FullLeaderboard', () => {
  beforeAll(() => {
    // Mock scrollIntoView para evitar errores
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });
  

  const setup = (props = {}) => {
    const defaultProps = {
      players: mockPlayers,
      currentUsername: 'Player5',
      order: 'desc',
      orderBy: 'totalScore',
      onRequestSort: jest.fn(),
      onCollapseView: jest.fn(),
    };

    return render(<MemoryRouter><FullLeaderboard {...defaultProps} {...props} /></MemoryRouter>);
  };

  test('renders leaderboard with title and current user', () => {
    setup();
    expect(screen.getByText('🏆 Full Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Player5 (You)')).toBeInTheDocument();
  });

  test('renders correct number of players per page', () => {
    setup();
    const rows = screen.getAllByRole('row');
    // +1 for header row
    expect(rows.length).toBeLessThanOrEqual(11);
  });

  test('displays win rate bar', () => {
    setup();
    expect(screen.getAllByText(/%/)[0]).toBeInTheDocument();
  });

  test('calls onCollapseView when "Show Top 5" button is clicked', () => {
    const onCollapseViewMock = jest.fn();
    setup({ onCollapseView: onCollapseViewMock });

    const button = screen.getByRole('button', { name: /show top 5/i });
    fireEvent.click(button);

    expect(onCollapseViewMock).toHaveBeenCalled();
  });


  test('calls onRequestSort when column header is clicked', () => {
    const onRequestSortMock = jest.fn();
    setup({ onRequestSort: onRequestSortMock });

    const sortLabel = screen.getByText(/Total Score/i);
    fireEvent.click(sortLabel);

    expect(onRequestSortMock).toHaveBeenCalledWith('totalScore');
  });

  test('shows 🏆 Top Player! for the top-ranked user', () => {
    setup();
    const topBadge = screen.getAllByText(/🏆 Top Player!/i);
    expect(topBadge.length).toBeGreaterThan(0);
  });
});
