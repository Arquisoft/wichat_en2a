import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomGameMode from './CustomGameMode';
import { MemoryRouter } from 'react-router-dom';

jest.mock('./Navbar', () => () => <div data-testid="navbar-mock">Navbar</div>);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- Tests ---

describe('CustomGameMode component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    global.fetch.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear();

    global.fetch.mockImplementation((url) => {
        if (url.toString().includes('/clear-questions')) {
           return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
        if (url.toString().includes('/fetch-custom-question-data')) {
           return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders title and controls', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );

    expect(screen.getByText(/Custom Game Mode/i)).toBeInTheDocument();
    const timeInput = screen.getAllByRole('spinbutton')[0];
    expect(timeInput).toBeInTheDocument();
    expect(screen.getByLabelText(/Shuffle questions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready/i })).toBeInTheDocument();
  });

  it('enables categories and updates question count', async () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const flagsCheckbox = checkboxes[1];
    fireEvent.click(flagsCheckbox);

    const inputs = screen.getAllByRole('spinbutton');
    const flagsInput = inputs[1];

    expect(flagsInput).toBeEnabled();

    fireEvent.change(flagsInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(flagsInput).toHaveValue(5);
    });
  });


  it('renders detailed initial state correctly', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );

    expect(screen.getByText(/Custom Game Mode/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar-mock')).toBeInTheDocument();
    const timeInput = screen.getAllByRole('spinbutton')[0];
    expect(timeInput).toBeInTheDocument();
    expect(screen.getByText(/Current total:/i)).toHaveTextContent('Current total: 0');
    expect(screen.getByLabelText(/Shuffle questions\?/i)).toBeChecked();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Cars')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('updates time limit and affects Ready button state', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const inputs = screen.getAllByRole('spinbutton');
    const timeInput = inputs[0];
    const readyButton = screen.getByRole('button', { name: /Ready/i });

    fireEvent.change(timeInput, { target: { value: '5' } });
    expect(timeInput).toHaveValue(5);
    expect(readyButton).toBeDisabled();

    fireEvent.change(timeInput, { target: { value: '30' } });
    expect(timeInput).toHaveValue(30);
    expect(readyButton).toBeDisabled();

     fireEvent.change(timeInput, { target: { value: '70' } });
     expect(timeInput).toHaveValue(70);
     expect(readyButton).toBeDisabled();
  });

   it('selects a category, updates question count, total count, and Ready button state', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const flagsCheckbox = screen.getAllByRole('checkbox')[1];
    const flagsSpinner = screen.getAllByRole('spinbutton')[1];
    const totalCountDisplay = screen.getByText(/Current total:/i);
    const readyButton = screen.getByRole('button', { name: /Ready/i });
    const inputs = screen.getAllByRole('spinbutton');
    const timeInput = inputs[0];

    expect(flagsCheckbox).not.toBeChecked();
    expect(flagsSpinner).toBeDisabled();
    expect(flagsSpinner).toHaveValue(0);
    expect(totalCountDisplay).toHaveTextContent('Current total: 0');
    expect(readyButton).toBeDisabled();

    fireEvent.click(flagsCheckbox);
    expect(flagsCheckbox).toBeChecked();
    expect(flagsSpinner).toBeEnabled();
    expect(flagsSpinner).toHaveValue(1);
    expect(totalCountDisplay).toHaveTextContent('Current total: 1');
    expect(readyButton).toBeDisabled();

    fireEvent.change(flagsSpinner, { target: { value: '5' } });
    expect(flagsSpinner).toHaveValue(5);
    expect(totalCountDisplay).toHaveTextContent('Current total: 5');
    expect(readyButton).toBeEnabled();

    fireEvent.change(timeInput, { target: { value: '5' } });
    expect(readyButton).toBeDisabled();

    fireEvent.change(timeInput, { target: { value: '25' } });
    expect(readyButton).toBeEnabled();

    fireEvent.click(flagsCheckbox);
    expect(flagsCheckbox).not.toBeChecked();
    expect(flagsSpinner).toBeDisabled();
    expect(flagsSpinner).toHaveValue(0);
    expect(totalCountDisplay).toHaveTextContent('Current total: 0');
    expect(readyButton).toBeDisabled();
  });

  it('respects the maximum total question limit', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const flagsCheckbox = screen.getAllByRole('checkbox')[1];
    const carsCheckbox = screen.getAllByRole('checkbox')[2];
    const flagsSpinner = screen.getAllByRole('spinbutton')[1];
    const carsSpinner = screen.getAllByRole('spinbutton')[2];
    const famousCheckbox = screen.getAllByRole('checkbox')[3];
    const totalCountDisplay = screen.getByText(/Current total:/i);

    fireEvent.click(flagsCheckbox);
    fireEvent.change(flagsSpinner, { target: { value: '20' } });
    expect(totalCountDisplay).toHaveTextContent('Current total: 20');

    fireEvent.click(carsCheckbox);
    fireEvent.change(carsSpinner, { target: { value: '10' } });
    expect(totalCountDisplay).toHaveTextContent('Current total: 30');

    fireEvent.change(carsSpinner, { target: { value: '11' } });
    expect(carsSpinner).toHaveValue(10);
    expect(totalCountDisplay).toHaveTextContent('Current total: 30');

    expect(famousCheckbox).toBeDisabled();
    expect(totalCountDisplay).toHaveTextContent('Current total: 30');

    fireEvent.change(flagsSpinner, { target: { value: '15' } });
    expect(totalCountDisplay).toHaveTextContent('Current total: 25');
    expect(famousCheckbox).toBeEnabled();
    fireEvent.click(famousCheckbox);
    expect(famousCheckbox).toBeChecked();
    expect(totalCountDisplay).toHaveTextContent('Current total: 26');
  });

  it('calls navigate to /gamemodes when Back button is clicked', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/gamemodes');
  });

  it('calls API endpoints, sets localStorage, and navigates on Ready click', async () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const flagsCheckbox = screen.getAllByRole('checkbox')[1];
    const carsCheckbox = screen.getAllByRole('checkbox')[2];
    const flagsSpinner = screen.getAllByRole('spinbutton')[1];
    const carsSpinner = screen.getAllByRole('spinbutton')[2];
    const inputs = screen.getAllByRole('spinbutton');
    const timeInput = inputs[0];
    const shuffleCheckbox = screen.getByLabelText(/Shuffle questions\?/i);
    const readyButton = screen.getByRole('button', { name: /Ready/i });

    fireEvent.change(timeInput, { target: { value: '15' } });
    fireEvent.click(flagsCheckbox);
    fireEvent.change(flagsSpinner, { target: { value: '3' } });
    fireEvent.click(carsCheckbox);
    fireEvent.change(carsSpinner, { target: { value: '7' } });
    expect(readyButton).toBeEnabled();

    fireEvent.click(readyButton);

    expect(readyButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/clear-questions'),
            { method: 'POST' }
        );
    });

     await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/fetch-custom-question-data'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: [
                        { questionType: 'flag', numberOfQuestions: 3 },
                        { questionType: 'car', numberOfQuestions: 7 }
                    ],
                    shuffle: true
                })
            })
        );
    });


   await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('totalQuestions', 10);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('timeLimit', 15);
    });

    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/game');
    });

     expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error during Ready click', async () => {
     const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
     global.fetch.mockImplementationOnce(() =>
       Promise.reject(new Error('Network Error 1'))
     );

    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );

    const flagsCheckbox = screen.getAllByRole('checkbox')[1];
    const flagsSpinner = screen.getAllByRole('spinbutton')[1];
    fireEvent.click(flagsCheckbox);
    fireEvent.change(flagsSpinner, { target: { value: '8' } });
    const readyButton = screen.getByRole('button', { name: /Ready/i });
    expect(readyButton).toBeEnabled();

    fireEvent.click(readyButton);

    await waitFor(() => {
      expect(readyButton).toBeEnabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to start custom game:',
        expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

   it('toggles shuffle state', () => {
    render(
      <MemoryRouter>
        <CustomGameMode />
      </MemoryRouter>
    );
    const shuffleCheckbox = screen.getByLabelText(/Shuffle questions\?/i);

    expect(shuffleCheckbox).toBeChecked();

    fireEvent.click(shuffleCheckbox);
    expect(shuffleCheckbox).not.toBeChecked();

    fireEvent.click(shuffleCheckbox);
    expect(shuffleCheckbox).toBeChecked();
  });

});