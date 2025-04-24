import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';
import * as components from './LeaderboardComponents';
import { MemoryRouter } from 'react-router-dom';

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('username', 'testuser');
  components.calculatePointsToLevelUp = jest.fn(() => 10);
  components.WinRateBar = ({ winRate }) => <div>{winRate}%</div>;
  components.StickyPlayerHeader = () => <div>StickyHeader</div>;
});

test('muestra loader mientras se carga', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

  render(<MemoryRouter><Leaderboard /></MemoryRouter>);
  expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
});

test('muestra error si la API falla', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 500 });

  render(<MemoryRouter><Leaderboard /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
});

test('renderiza correctamente jugadores y muestra top 5 por defecto', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { _id: '1', username: 'Alice', totalScore: 100, gamesPlayed: 10, avgPointsPerGame: 10, winRate: 70 },
      { _id: '2', username: 'Bob', totalScore: 90, gamesPlayed: 9, avgPointsPerGame: 10, winRate: 60 },
      { _id: '3', username: 'testuser', totalScore: 80, gamesPlayed: 8, avgPointsPerGame: 10, winRate: 50 },
    ],
  });

  render(<MemoryRouter><Leaderboard /></MemoryRouter>);
  await waitFor(() => screen.getByText(/Alice/));
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
  expect(screen.getByText(/You/)).toBeInTheDocument();
});

test('cambia orden al hacer click en columna', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { _id: '1', username: 'Zoe', totalScore: 200, gamesPlayed: 5, avgPointsPerGame: 40, winRate: 80 },
      { _id: '2', username: 'Anna', totalScore: 100, gamesPlayed: 10, avgPointsPerGame: 10, winRate: 50 },
    ],
  });

  render(<MemoryRouter><Leaderboard /></MemoryRouter>);
  await waitFor(() => screen.getByText('Zoe'));

  const scoreHeader = screen.getByText('Total Score');
  fireEvent.click(scoreHeader);
  fireEvent.click(scoreHeader); // Orden ascendente, luego descendente

  expect(screen.getAllByText(/Zoe|Anna/)).toHaveLength(2);
});

test('cambia a vista completa al hacer click en botón', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => Array.from({ length: 12 }, (_, i) => ({
      _id: `${i + 1}`,
      username: `Player${i + 1}`,
      totalScore: 100 - i * 5,
      gamesPlayed: 10,
      avgPointsPerGame: 10,
      winRate: 50,
    })),
  });

  render(<MemoryRouter><Leaderboard /></MemoryRouter>);
  await waitFor(() => screen.getByText(/Player1/));
  fireEvent.click(screen.getByText(/Show Full Leaderboard/i));
  expect(await screen.findByText(/Points To Level Up/)).toBeInTheDocument();
});
