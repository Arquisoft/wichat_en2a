import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);

const setupAddUserForm = async ({ username, password, mockStatus, mockResponse }) => {
  render(
      <MemoryRouter>
        <AddUser />
      </MemoryRouter>
  );
  const usernameInput = screen.getByLabelText(/Username/i);
  const passwordInput = screen.getByLabelText(/Password/i);
  const addUserButton = screen.getByRole('button', { name: /Register/i });
  mockAxios.onPost('http://localhost:8000/adduser').reply(mockStatus, mockResponse);
  fireEvent.change(usernameInput, { target: { value: username } });
  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.click(addUserButton);
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.setTimeout(20000);

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

    const addUserButton = screen.getByRole('button', { name: /Register/i });
    expect(addUserButton).toBeDisabled();
  });

  it('should add user successfully and navigate to login', async () => {
    await setupAddUserForm({
      username: 'testUser',
      password: 'testPassword',
      mockStatus: 200,
      mockResponse: {}
    })

    await waitFor(() => {
      expect(screen.getByText(/Register successful/i)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should show error message when an error happens', async () => {
    await setupAddUserForm({
      username: 'testUser',
      password: 'testPassword',
      mockStatus: 500,
      mockResponse: { error: 'Internal Server Error' }
    });

    await waitFor(() => {
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('should show a default error message if the error is not specified', async () => {
    await setupAddUserForm({
      username: 'testUser',
      password: 'testPassword',
      mockStatus: 500,
      mockResponse: {}
    });

    await waitFor(() => {
      expect(screen.getByText(/Register failed/i)).toBeInTheDocument();
    });
  });

  it('should display and close the error Snackbar when an error occurs', async () => {
    await setupAddUserForm({
      username: 'testUser',
      password: 'testPassword',
      mockStatus: 400,
      mockResponse: {error: 'Invalid credentials'}
    });

    const snackbar = await screen.findByText(/Error: Invalid credentials/i);
    expect(snackbar).toBeInTheDocument();

    fireEvent.click(snackbar);

    await waitFor(() => {
      expect(screen.queryByText(/Error: Invalid credentials/i)).not.toBeInTheDocument();
    }, { timeout: 7000 });
  });
});
