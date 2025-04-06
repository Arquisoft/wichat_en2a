import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomGameMode from './CustomGameMode';
import { MemoryRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({}) })
);

beforeEach(() => {
  fetch.mockClear();
  mockNavigate.mockClear();
});

describe('CustomGameMode component', () => {
  test('renders title and controls', () => {
    render(<MemoryRouter><CustomGameMode /></MemoryRouter>);
    expect(screen.getByText(/Custom Game Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Time limit per question/i)).toBeInTheDocument();
    expect(screen.getByText(/Shuffle questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Back/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
  });

  test('enables and disables categories and updates question count', () => {
    render(<MemoryRouter><CustomGameMode /></MemoryRouter>);
    const flagsCheckbox = screen.getByLabelText('Flags');
    fireEvent.click(flagsCheckbox); // select "Flags"

    const questionInput = screen.getByDisplayValue('1'); // default to 1 question
    expect(questionInput).toBeInTheDocument();

    fireEvent.change(questionInput, { target: { value: '5' } });
    expect(questionInput.value).toBe("5");
  });

  test('enables Ready button when valid number of questions selected', () => {
    render(<MemoryRouter><CustomGameMode /></MemoryRouter>);
    const flagsCheckbox = screen.getByLabelText('Flags');
    fireEvent.click(flagsCheckbox);

    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '6' } });

    const readyButton = screen.getByText('Ready');
    expect(readyButton).not.toBeDisabled();
  });

  test('sends correct payload and navigates on Ready click', async () => {
    render(<MemoryRouter><CustomGameMode /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText('Flags'));
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '6' } });

    fireEvent.click(screen.getByText('Ready'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/clear-questions'), expect.any(Object));
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch-custom-question-data'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"questionType":"flag"')
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/game');
    });
  });
});
