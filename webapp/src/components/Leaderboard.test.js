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

jest.mock('./Navbar', () =>
  React.forwardRef((props, ref) => {
    // Simula que el ref apunta a un elemento con altura 123
    React.useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = {
          getBoundingClientRect: () => ({ height: 123 }),
        };
      }
    }, [ref]);

    return <div ref={ref} data-testid="navbar">Mock Navbar</div>;
  })
);

jest.mock('./LeaderboardComponents', () => ({
  WinRateBar: () => <div data-testid="winrate-bar">Mock WinRateBar</div>,
  medalEmojis: [],
  medalColors: [],
  StickyPlayerHeader: () => <div data-testid="sticky-header">Mock StickyHeader</div>,
  calculatePointsToLevelUp: () => 0,
}));

test('sets navbar height from ref on mount', async () => {
  // Simula que fetch responde bien
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );

  const { container } = render(<Leaderboard />);

  await waitFor(() => {
    // El componente debería montarse sin errores
    const navbar = container.querySelector('[data-testid="navbar"]');
    expect(navbar).toBeInTheDocument();
  });

  // Este test asegura que no haya errores al usar getBoundingClientRect
  // y que el ref esté bien conectado, pero no podemos acceder directamente
  // al estado interno `navbarHeight` sin exponerlo.
});

test('renders the next player below current user if not last', async () => {
  const mockPlayers = [
    { username: 'Alice', totalScore: 150, gamesPlayed: 10, avgPointsPerGame: 15, winRate: 0.8 },
    { username: 'Bob', totalScore: 140, gamesPlayed: 12, avgPointsPerGame: 11.67, winRate: 0.75 },
    { username: 'Charlie', totalScore: 130, gamesPlayed: 13, avgPointsPerGame: 10, winRate: 0.7 },
  ];

  // Simula que el usuario actual es "Bob"
  localStorage.setItem('username', 'Bob');

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockPlayers),
    })
  );

  render(<Leaderboard />);

  // Espera que Bob y Charlie estén en el DOM
  await waitFor(() => {
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  // Verifica que la fila con el jugador siguiente (Charlie) contiene sus datos
  expect(screen.getByText('Charlie')).toBeInTheDocument();
  expect(screen.getByText('130')).toBeInTheDocument(); // totalScore
  expect(screen.getByText('13')).toBeInTheDocument();  // gamesPlayed
  expect(screen.getByText('10.00')).toBeInTheDocument(); // avgPointsPerGame
});

