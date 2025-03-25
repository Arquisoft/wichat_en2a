import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);

//useNavigate Mock
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('AddUser component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear(); // Clear mock before the start of each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
  });

  it('should disable the Add User button when inputs are empty', () => {
    render(
        <MemoryRouter>
          <AddUser />
        </MemoryRouter>
    );

    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    // If fields are empty then button is disabled
    expect(addUserButton).toBeDisabled();
  });

  it('should add user successfully and navigate to login', async () => {
    render(
        <MemoryRouter>
          <AddUser />
        </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    // Mock the axios.post request to simulate a successful response
    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the add user button click
    fireEvent.click(addUserButton);

    // Wait for the Snackbar to be open
    await waitFor(() => {
      expect(screen.getByText(/User added successfully/i)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login'); // Should go to login view
    });
  });

  it('should handle error when adding user', async () => {
    render(
        <MemoryRouter>
          <AddUser />
        </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    // Mock the axios.post request to simulate an error response
    mockAxios.onPost('http://localhost:8000/adduser').reply(500, { error: 'Internal Server Error' });

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the add user button click
    fireEvent.click(addUserButton);

    // Wait for the error Snackbar to be open
    await waitFor(() => {
      expect(screen.getByText(/Error: Internal Server Error/i)).toBeInTheDocument();
    });
  });
});
